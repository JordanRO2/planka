/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => Project.find(criteria).sort('id');

/* Query methods */

const createOne = (values, { user } = {}) =>
  sails.getDatastore().transaction(async (db) => {
    let project = await Project.create({ ...values })
      .fetch()
      .usingConnection(db);

    let projectMemberships = [];
    let primaryProjectManager;

    // Always create a project manager entry for the creator (for backward compatibility)
    const projectManager = await ProjectManager.create({
      projectId: project.id,
      userId: user.id,
    })
      .fetch()
      .usingConnection(db);

    if (values.type === Project.Types.PRIVATE) {
      // For private projects, set owner and create owner membership
      project = await Project.updateOne(project.id)
        .set({
          ownerProjectManagerId: projectManager.id,
        })
        .usingConnection(db);

      // Create project membership as OWNER (not manager)
      await ProjectMembership.create({
        projectId: project.id,
        userId: user.id,
        role: ProjectMembership.Roles.OWNER,
        canCreateBoards: true,
        canEditProject: true,
        canManageMembers: true,
        canDeleteProject: true,
        canAddCards: true,
        canEditCards: true,
        canDeleteBoards: true,
        canArchiveBoards: true,
        canExportData: true,
        canViewAnalytics: true,
        canManageLabels: true,
        canManageCustomFields: true,
        canInviteGuests: true,
        canManageIntegrations: true,
      })
        .fetch()
        .usingConnection(db);

      primaryProjectManager = projectManager;
    } else {
      // For team/shared projects - NO OWNER, just a manager
      // ownerProjectManagerId stays NULL for team projects
      const allUsers = await User.find().usingConnection(db);

      // Create project memberships for all users
      projectMemberships = await ProjectMembership.createEach(
        allUsers.map(u => ({
          projectId: project.id,
          userId: u.id,
          // Creator is MANAGER (not owner), everyone else is VIEWER
          role: u.id === user.id ? ProjectMembership.Roles.MANAGER : ProjectMembership.Roles.VIEWER,
          canCreateBoards: u.id === user.id,
          canEditProject: u.id === user.id,
          canManageMembers: u.id === user.id,
          canDeleteProject: u.id === user.id,
          canAddCards: u.id === user.id ? true : false,  // Only manager can add cards initially
          canEditCards: u.id === user.id ? true : false,  // Only manager can edit cards initially
          canDeleteBoards: u.id === user.id,
          canArchiveBoards: u.id === user.id,
          canExportData: true,  // Everyone can export
          canViewAnalytics: true,  // Everyone can view
          canManageLabels: u.id === user.id,
          canManageCustomFields: u.id === user.id,
          canInviteGuests: false,
          canManageIntegrations: false,
        }))
      )
        .fetch()
        .usingConnection(db);

      // Also add all users as project managers for backward compatibility (will be phased out)
      const otherUsers = allUsers.filter(u => u.id !== user.id);
      if (otherUsers.length > 0) {
        await ProjectManager.createEach(
          otherUsers.map(u => ({
            projectId: project.id,
            userId: u.id,
          }))
        )
          .fetch()
          .usingConnection(db);
      }

      primaryProjectManager = projectManager;
    }

    return { project, projectManager: primaryProjectManager };
  });

const getByIds = (ids) => defaultFind(ids);

const getShared = ({ exceptIdOrIds } = {}) => {
  const criteria = {
    ownerProjectManagerId: null,
  };

  if (exceptIdOrIds) {
    criteria.id = {
      '!=': exceptIdOrIds,
    };
  }

  return defaultFind(criteria);
};

const getOneById = (id) => Project.findOne(id);

const updateOne = (criteria, values) => Project.updateOne(criteria).set({ ...values });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => Project.destroy(criteria).fetch();

const deleteOne = (criteria) => Project.destroyOne(criteria);

module.exports = {
  createOne,
  getByIds,
  getShared,
  getOneById,
  updateOne,
  deleteOne,
  delete: delete_,
};
