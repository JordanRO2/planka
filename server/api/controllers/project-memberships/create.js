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
  USER_ALREADY_PROJECT_MEMBER: {
    userAlreadyProjectMember: 'User is already a project member',
  },
};

module.exports = {
  inputs: {
    projectId: {
      ...idInput,
      required: true,
    },
    userId: {
      ...idInput,
      required: true,
    },
    role: {
      type: 'string',
      isIn: Object.values(ProjectMembership.Roles),
      defaultsTo: ProjectMembership.Roles.MEMBER,
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
    projectNotFound: {
      responseType: 'notFound',
    },
    userNotFound: {
      responseType: 'notFound',
    },
    userAlreadyProjectMember: {
      responseType: 'conflict',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // Check if project exists
    const project = await Project.findOne({ id: inputs.projectId });
    if (!project) {
      throw Errors.PROJECT_NOT_FOUND;
    }

    // Check if current user can manage members in this project
    const canManageMembers = await sails.helpers.users.canManageProjectMembers(
      currentUser.id,
      inputs.projectId
    );

    if (!canManageMembers) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    // Check if user exists
    const user = await User.findOne({ id: inputs.userId });
    if (!user) {
      throw Errors.USER_NOT_FOUND;
    }

    // Check if user is already a member
    const existingMembership = await ProjectMembership.findOne({
      projectId: inputs.projectId,
      userId: inputs.userId,
    });

    if (existingMembership) {
      throw Errors.USER_ALREADY_PROJECT_MEMBER;
    }

    // Get role defaults
    const roleDefaults = ProjectMembership.RULES_BY_ROLE[inputs.role];

    // Create the membership with role defaults and any overrides
    const values = {
      projectId: inputs.projectId,
      userId: inputs.userId,
      role: inputs.role,
      canCreateBoards: inputs.canCreateBoards !== undefined ? inputs.canCreateBoards : roleDefaults.canCreateBoards.defaultTo,
      canEditProject: inputs.canEditProject !== undefined ? inputs.canEditProject : roleDefaults.canEditProject.defaultTo,
      canManageMembers: inputs.canManageMembers !== undefined ? inputs.canManageMembers : roleDefaults.canManageMembers.defaultTo,
      canDeleteProject: inputs.canDeleteProject !== undefined ? inputs.canDeleteProject : roleDefaults.canDeleteProject.defaultTo,
      canAddCards: inputs.canAddCards !== undefined ? inputs.canAddCards : roleDefaults.canAddCards.defaultTo,
      canEditCards: inputs.canEditCards !== undefined ? inputs.canEditCards : roleDefaults.canEditCards.defaultTo,
      canDeleteBoards: inputs.canDeleteBoards !== undefined ? inputs.canDeleteBoards : roleDefaults.canDeleteBoards.defaultTo,
    };

    const projectMembership = await ProjectMembership.create(values).fetch();

    // Also create a project manager entry for backward compatibility
    await ProjectManager.create({
      projectId: inputs.projectId,
      userId: inputs.userId,
    }).fetch();

    // If this is a team project, add user to all existing boards as viewer
    if (!project.ownerProjectManagerId) {
      const boards = await Board.find({ projectId: inputs.projectId });

      for (const board of boards) {
        await BoardMembership.create({
          projectId: inputs.projectId,
          boardId: board.id,
          userId: inputs.userId,
          role: BoardMembership.Roles.VIEWER,
        }).fetch();
      }
    }

    // Broadcast the creation
    sails.sockets.broadcast(`user:${inputs.userId}`, 'projectMembershipCreate', {
      item: projectMembership,
      included: {
        projects: [project],
        users: [user],
      },
    });

    return {
      item: projectMembership,
      included: {
        users: [user],
      },
    };
  },
};