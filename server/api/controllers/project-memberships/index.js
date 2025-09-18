/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  PROJECT_NOT_FOUND: {
    projectNotFound: 'Project not found',
  },
};

module.exports = {
  inputs: {
    projectId: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    projectNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // Check if project exists
    const project = await Project.findOne({ id: inputs.projectId });
    if (!project) {
      throw Errors.PROJECT_NOT_FOUND;
    }

    // Check if user has access to the project
    const userMembership = await ProjectMembership.findOne({
      projectId: inputs.projectId,
      userId: currentUser.id,
    });

    const userProjectManager = await ProjectManager.findOne({
      projectId: inputs.projectId,
      userId: currentUser.id,
    });

    const userBoardMemberships = await BoardMembership.find({
      projectId: inputs.projectId,
      userId: currentUser.id,
    });

    // User must be a member or have board access
    if (!userMembership && !userProjectManager && userBoardMemberships.length === 0) {
      throw Errors.PROJECT_NOT_FOUND; // Forbidden
    }

    // Get all project memberships
    const projectMemberships = await ProjectMembership.find({
      projectId: inputs.projectId,
    }).sort([
      { role: 'ASC' },
      { createdAt: 'ASC' },
    ]);

    // Get user details
    const userIds = projectMemberships.map(pm => pm.userId);
    const users = await User.find({ id: userIds });

    // Map users to memberships
    const membershipsWithUsers = projectMemberships.map(membership => {
      const user = users.find(u => u.id === membership.userId);
      return {
        ...membership,
        user: user ? {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          avatarUrl: user.avatarUrl,
        } : null,
      };
    });

    // Check if project has an owner
    let owner = null;
    if (project.ownerProjectManagerId) {
      const ownerProjectManager = await ProjectManager.findOne({
        id: project.ownerProjectManagerId
      });
      if (ownerProjectManager) {
        owner = users.find(u => u.id === ownerProjectManager.userId);
      }
    }

    return {
      items: membershipsWithUsers,
      meta: {
        projectId: inputs.projectId,
        projectName: project.name,
        isTeamProject: !project.ownerProjectManagerId,
        ownerId: owner ? owner.id : null,
        currentUserCanManage: userMembership ? userMembership.canManageMembers : false,
      },
    };
  },
};