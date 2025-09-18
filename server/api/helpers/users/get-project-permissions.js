/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    userId: {
      type: 'string',
      required: true,
    },
    projectId: {
      type: 'string',
      required: true,
    },
  },

  async fn(inputs) {
    // Check ProjectMembership for permissions
    const projectMembership = await ProjectMembership.findOne({
      userId: inputs.userId,
      projectId: inputs.projectId,
    });

    if (projectMembership) {
      // Return all permissions for the user
      return {
        role: projectMembership.role,
        canCreateBoards: projectMembership.canCreateBoards !== null
          ? projectMembership.canCreateBoards
          : ProjectMembership.RULES_BY_ROLE[projectMembership.role].canCreateBoards.defaultTo,
        canEditProject: projectMembership.canEditProject !== null
          ? projectMembership.canEditProject
          : ProjectMembership.RULES_BY_ROLE[projectMembership.role].canEditProject.defaultTo,
        canManageMembers: projectMembership.canManageMembers !== null
          ? projectMembership.canManageMembers
          : ProjectMembership.RULES_BY_ROLE[projectMembership.role].canManageMembers.defaultTo,
        canDeleteProject: projectMembership.canDeleteProject !== null
          ? projectMembership.canDeleteProject
          : ProjectMembership.RULES_BY_ROLE[projectMembership.role].canDeleteProject.defaultTo,
        canAddCards: projectMembership.canAddCards !== null
          ? projectMembership.canAddCards
          : ProjectMembership.RULES_BY_ROLE[projectMembership.role].canAddCards.defaultTo,
        canEditCards: projectMembership.canEditCards !== null
          ? projectMembership.canEditCards
          : ProjectMembership.RULES_BY_ROLE[projectMembership.role].canEditCards.defaultTo,
        canDeleteBoards: projectMembership.canDeleteBoards !== null
          ? projectMembership.canDeleteBoards
          : ProjectMembership.RULES_BY_ROLE[projectMembership.role].canDeleteBoards.defaultTo,
      };
    }

    // Check if user is admin
    const user = await User.findOne({ id: inputs.userId });
    if (user && user.role === 'admin') {
      // Admins get full manager permissions
      return {
        role: 'admin',
        canCreateBoards: true,
        canEditProject: true,
        canManageMembers: true,
        canDeleteProject: true,
        canAddCards: true,
        canEditCards: true,
        canDeleteBoards: true,
      };
    }

    // No permissions
    return null;
  },
};