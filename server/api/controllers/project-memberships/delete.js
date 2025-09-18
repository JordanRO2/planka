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
  CANNOT_REMOVE_LAST_MANAGER: {
    cannotRemoveLastManager: 'Cannot remove the last manager',
  },
  CANNOT_REMOVE_SELF: {
    cannotRemoveSelf: 'Cannot remove yourself from the project',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    projectMembershipNotFound: {
      responseType: 'notFound',
    },
    cannotRemoveLastManager: {
      responseType: 'unprocessableEntity',
    },
    cannotRemoveSelf: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // Get the project membership to delete
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

    // Don't allow users to remove themselves
    if (projectMembership.userId === currentUser.id) {
      throw Errors.CANNOT_REMOVE_SELF;
    }

    // If removing a manager, check if there are other managers
    if (projectMembership.role === ProjectMembership.Roles.MANAGER) {
      const managerCount = await ProjectMembership.count({
        projectId: projectMembership.projectId,
        role: ProjectMembership.Roles.MANAGER,
      });

      if (managerCount <= 1) {
        throw Errors.CANNOT_REMOVE_LAST_MANAGER;
      }
    }

    // Delete the membership
    await ProjectMembership.destroyOne({ id: inputs.id });

    // Also remove from ProjectManager for backward compatibility
    await ProjectManager.destroy({
      projectId: projectMembership.projectId,
      userId: projectMembership.userId,
    });

    // Remove user from all boards in the project
    await BoardMembership.destroy({
      projectId: projectMembership.projectId,
      userId: projectMembership.userId,
    });

    // Broadcast the deletion
    sails.sockets.broadcast(`user:${projectMembership.userId}`, 'projectMembershipDelete', {
      item: projectMembership,
    });

    return {
      item: projectMembership,
    };
  },
};