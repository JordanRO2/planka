/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  PROJECT_NOT_FOUND: {
    projectNotFound: 'Project not found',
  },
  USER_NOT_FOUND: {
    userNotFound: 'User not found',
  },
  USER_NOT_PROJECT_MEMBER: {
    userNotProjectMember: 'User is not a project member',
  },
  CANNOT_TRANSFER_TEAM_PROJECT: {
    cannotTransferTeamProject: 'Cannot transfer ownership of team projects',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
    userId: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    projectNotFound: {
      responseType: 'notFound',
    },
    userNotFound: {
      responseType: 'notFound',
    },
    userNotProjectMember: {
      responseType: 'unprocessableEntity',
    },
    cannotTransferTeamProject: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // Get the project
    const project = await Project.findOne({ id: inputs.id });
    if (!project) {
      throw Errors.PROJECT_NOT_FOUND;
    }

    // Can't transfer team projects (they have no owner)
    if (!project.ownerProjectManagerId) {
      throw Errors.CANNOT_TRANSFER_TEAM_PROJECT;
    }

    // Check if current user is the owner
    const ownerProjectManager = await ProjectManager.findOne({
      id: project.ownerProjectManagerId
    });

    if (!ownerProjectManager || ownerProjectManager.userId !== currentUser.id) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    // Check if target user exists
    const targetUser = await User.findOne({ id: inputs.userId });
    if (!targetUser) {
      throw Errors.USER_NOT_FOUND;
    }

    // Check if target user is a project member
    const targetMembership = await ProjectMembership.findOne({
      projectId: inputs.id,
      userId: inputs.userId,
    });

    if (!targetMembership) {
      // Create membership if doesn't exist
      await ProjectMembership.create({
        projectId: inputs.id,
        userId: inputs.userId,
        role: ProjectMembership.Roles.MANAGER,
        canCreateBoards: true,
        canEditProject: true,
        canManageMembers: true,
        canDeleteProject: true,
        canAddCards: true,
        canEditCards: true,
        canDeleteBoards: true,
      }).fetch();

      // Also add to ProjectManager
      const targetProjectManager = await ProjectManager.create({
        projectId: inputs.id,
        userId: inputs.userId,
      }).fetch();

      // Update project owner
      await Project.updateOne({ id: inputs.id })
        .set({ ownerProjectManagerId: targetProjectManager.id });
    } else {
      // Update existing membership to manager
      await ProjectMembership.updateOne({ id: targetMembership.id })
        .set({
          role: ProjectMembership.Roles.MANAGER,
          canCreateBoards: true,
          canEditProject: true,
          canManageMembers: true,
          canDeleteProject: true,
          canAddCards: true,
          canEditCards: true,
          canDeleteBoards: true,
        });

      // Get or create ProjectManager entry
      let targetProjectManager = await ProjectManager.findOne({
        projectId: inputs.id,
        userId: inputs.userId,
      });

      if (!targetProjectManager) {
        targetProjectManager = await ProjectManager.create({
          projectId: inputs.id,
          userId: inputs.userId,
        }).fetch();
      }

      // Update project owner
      await Project.updateOne({ id: inputs.id })
        .set({ ownerProjectManagerId: targetProjectManager.id });
    }

    // Optionally downgrade the previous owner to regular manager
    const currentMembership = await ProjectMembership.findOne({
      projectId: inputs.id,
      userId: currentUser.id,
    });

    if (currentMembership) {
      await ProjectMembership.updateOne({ id: currentMembership.id })
        .set({
          role: ProjectMembership.Roles.MANAGER,
          // Keep manager permissions but remove ownership
        });
    }

    const updatedProject = await Project.findOne({ id: inputs.id });

    // Broadcast the update
    const projectMembers = await ProjectMembership.find({ projectId: inputs.id });
    const memberUserIds = projectMembers.map(pm => pm.userId);

    memberUserIds.forEach((userId) => {
      sails.sockets.broadcast(`user:${userId}`, 'projectOwnershipTransfer', {
        item: updatedProject,
        newOwnerId: inputs.userId,
        previousOwnerId: currentUser.id,
      });
    });

    return {
      item: updatedProject,
      included: {
        users: [targetUser],
      },
    };
  },
};