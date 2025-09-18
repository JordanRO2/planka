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
    // Check ProjectMembership first
    const projectMembership = await ProjectMembership.findOne({
      userId: inputs.userId,
      projectId: inputs.projectId,
    });

    if (projectMembership) {
      // Use explicit permission if set, otherwise use role default
      if (projectMembership.canCreateBoards !== null) {
        return projectMembership.canCreateBoards;
      }

      // Use role defaults
      switch (projectMembership.role) {
        case ProjectMembership.Roles.MANAGER:
        case ProjectMembership.Roles.EDITOR:
          return true;
        case ProjectMembership.Roles.VIEWER:
          return false;
        default:
          return false;
      }
    }

    // Fallback to checking if user is a project manager (backward compatibility)
    const projectManager = await ProjectManager.findOne({
      userId: inputs.userId,
      projectId: inputs.projectId,
    });

    return !!projectManager;
  },
};