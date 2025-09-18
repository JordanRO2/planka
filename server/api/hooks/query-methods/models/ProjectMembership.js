/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => ProjectMembership.find(criteria);

/* Query methods */

const createOne = (values) =>
  ProjectMembership.create({ ...values }).fetch();

const getByProjectId = (projectId) =>
  defaultFind({
    projectId,
  }).sort([
    { role: 'ASC' },
    { createdAt: 'ASC' },
    { id: 'ASC' },
  ]);

const getByUserId = (userId) =>
  defaultFind({
    userId,
  });

const getByUserIdAndProjectId = (userId, projectId) =>
  ProjectMembership.findOne({
    userId,
    projectId,
  });

const getOneByIdAndProjectId = (id, projectId) =>
  ProjectMembership.findOne({
    id,
    projectId,
  });

const updateOne = (criteria, values) => ProjectMembership.updateOne(criteria).set({ ...values });

const deleteOne = (criteria) => ProjectMembership.destroyOne(criteria);

module.exports = {
  createOne,
  getByProjectId,
  getByUserId,
  getByUserIdAndProjectId,
  getOneByIdAndProjectId,
  updateOne,
  deleteOne,
};