/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  PROJECT_MEMBERSHIP_NOT_FOUND: {
    projectMembershipNotFound: 'Project membership not found',
  },
  CANNOT_DEMOTE_LAST_MANAGER: {
    cannotDemoteLastManager: 'Cannot demote the last manager',
  },
  CANNOT_CHANGE_OWN_ROLE: {
    cannotChangeOwnRole: 'Cannot change your own role',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
    role: {
      type: 'string',
      isIn: Object.values(ProjectMembership.Roles),
    },
    canCreateBoards: {
      type: 'boolean',
    },
    canEditProject: {
      type: 'boolean',
    },
    canManageMembers: {
      type: 'boolean',
    },
    canDeleteProject: {
      type: 'boolean',
    },
    canAddCards: {
      type: 'boolean',
    },
    canEditCards: {
      type: 'boolean',
    },
    canDeleteBoards: {
      type: 'boolean',
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    projectMembershipNotFound: {
      responseType: 'notFound',
    },
    cannotDemoteLastManager: {
      responseType: 'unprocessableEntity',
    },
    cannotChangeOwnRole: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // Get the project membership to update
    const projectMembership = await ProjectMembership.findOne({ id: inputs.id });

    if (!projectMembership) {
      throw Errors.PROJECT_MEMBERSHIP_NOT_FOUND;
    }

    // Check if current user can manage members in this project
    const canManageMembers = await sails.helpers.users.canManageProjectMembers(
      currentUser.id,
      projectMembership.projectId
    );

    if (!canManageMembers) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    // Don't allow users to change their own role
    if (projectMembership.userId === currentUser.id && inputs.role) {
      throw Errors.CANNOT_CHANGE_OWN_ROLE;
    }

    // If demoting from manager to member, check if there are other managers
    if (projectMembership.role === ProjectMembership.Roles.MANAGER &&
        inputs.role === ProjectMembership.Roles.MEMBER) {
      const managerCount = await ProjectMembership.count({
        projectId: projectMembership.projectId,
        role: ProjectMembership.Roles.MANAGER,
      });

      if (managerCount <= 1) {
        throw Errors.CANNOT_DEMOTE_LAST_MANAGER;
      }
    }

    const values = {};

    // Update role if provided
    if (inputs.role) {
      values.role = inputs.role;

      // Apply role defaults when changing role
      const defaults = ProjectMembership.RULES_BY_ROLE[inputs.role];
      if (defaults) {
        values.canCreateBoards = defaults.canCreateBoards.defaultTo;
        values.canEditProject = defaults.canEditProject.defaultTo;
        values.canManageMembers = defaults.canManageMembers.defaultTo;
        values.canDeleteProject = defaults.canDeleteProject.defaultTo;
        values.canAddCards = defaults.canAddCards.defaultTo;
        values.canEditCards = defaults.canEditCards.defaultTo;
        values.canDeleteBoards = defaults.canDeleteBoards.defaultTo;
      }
    }

    // Override with specific permissions if provided
    if (typeof inputs.canCreateBoards === 'boolean') {
      values.canCreateBoards = inputs.canCreateBoards;
    }
    if (typeof inputs.canEditProject === 'boolean') {
      values.canEditProject = inputs.canEditProject;
    }
    if (typeof inputs.canManageMembers === 'boolean') {
      values.canManageMembers = inputs.canManageMembers;
    }
    if (typeof inputs.canDeleteProject === 'boolean') {
      values.canDeleteProject = inputs.canDeleteProject;
    }
    if (typeof inputs.canAddCards === 'boolean') {
      values.canAddCards = inputs.canAddCards;
    }
    if (typeof inputs.canEditCards === 'boolean') {
      values.canEditCards = inputs.canEditCards;
    }
    if (typeof inputs.canDeleteBoards === 'boolean') {
      values.canDeleteBoards = inputs.canDeleteBoards;
    }

    const updatedMembership = await ProjectMembership.updateOne({ id: inputs.id })
      .set(values);

    // Broadcast the update
    const project = await Project.findOne({ id: projectMembership.projectId });
    const user = await User.findOne({ id: projectMembership.userId });

    sails.sockets.broadcast(`user:${projectMembership.userId}`, 'projectMembershipUpdate', {
      item: updatedMembership,
      included: {
        projects: [project],
        users: [user],
      },
    });

    return {
      item: updatedMembership,
    };
  },
};