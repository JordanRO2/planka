/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria, { sort = 'id' } = {}) => Board.find(criteria).sort(sort);

/* Query methods */

const createOne = (values, { user } = {}) =>
  sails.getDatastore().transaction(async (db) => {
    const board = await Board.create({ ...values })
      .fetch()
      .usingConnection(db);

    // Check if this is a team project (no owner_project_manager_id)
    const project = await Project.findOne({ id: board.projectId }).usingConnection(db);
    const isTeamProject = !project.ownerProjectManagerId;

    let boardMemberships = [];

    if (isTeamProject) {
      // For team projects, only add users who have at least member role in the project
      // Viewers can see the project but not automatically get board access
      const projectMemberships = await ProjectMembership.find({
        projectId: board.projectId
      }).usingConnection(db);

      // Only add board membership for users with member role or higher
      const eligibleMemberships = projectMemberships.filter(pm =>
        pm.role !== ProjectMembership.Roles.VIEWER &&
        pm.role !== ProjectMembership.Roles.GUEST
      );

      boardMemberships = await BoardMembership.createEach(
        eligibleMemberships.map(pm => ({
          projectId: board.projectId,
          boardId: board.id,
          userId: pm.userId,
          // Creator gets editor, others get viewer by default
          role: pm.userId === user.id ? BoardMembership.Roles.EDITOR : BoardMembership.Roles.VIEWER,
        }))
      )
        .fetch()
        .usingConnection(db);
    } else {
      // For private projects, only add the creator
      const boardMembership = await BoardMembership.create({
        projectId: board.projectId,
        boardId: board.id,
        userId: user.id,
        role: BoardMembership.Roles.EDITOR,
      })
        .fetch()
        .usingConnection(db);

      boardMemberships = [boardMembership];
    }

    const lists = await List.createEach(
      [List.Types.ARCHIVE, List.Types.TRASH].map((type) => ({
        type,
        boardId: board.id,
      })),
    )
      .fetch()
      .usingConnection(db);

    // Return the creator's membership as primary
    const boardMembership = boardMemberships.find(bm => bm.userId === user.id) || boardMemberships[0];

    return { board, boardMembership, lists };
  });

const getByIds = (ids, { exceptProjectIdOrIds } = {}) => {
  const criteria = {
    id: ids,
  };

  if (exceptProjectIdOrIds) {
    criteria.projectId = {
      '!=': exceptProjectIdOrIds,
    };
  }

  return defaultFind(criteria);
};

const getByProjectId = (projectId, { exceptIdOrIds, sort = ['position', 'id'] } = {}) => {
  const criteria = {
    projectId,
  };

  if (exceptIdOrIds) {
    criteria.id = {
      '!=': exceptIdOrIds,
    };
  }

  return defaultFind(criteria, { sort });
};

const getByProjectIds = (projectIds, { sort = ['position', 'id'] } = {}) =>
  defaultFind(
    {
      projectId: projectIds,
    },
    { sort },
  );

const getOneById = (id) => Board.findOne(id);

const updateOne = (criteria, values) => Board.updateOne(criteria).set({ ...values });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => Board.destroy(criteria).fetch();

const deleteOne = (criteria) => Board.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getByProjectId,
  getByProjectIds,
  getOneById,
  updateOne,
  deleteOne,
  delete: delete_,
};
