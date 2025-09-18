/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * ProjectMembership.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const Roles = {
  OWNER: 'owner',
  MANAGER: 'manager',
  EDITOR: 'editor',
  MEMBER: 'member',
  VIEWER: 'viewer',
  GUEST: 'guest',
};

const SHARED_RULES = {
  role: {},
  canCreateBoards: { setTo: null },
  canEditProject: { setTo: null },
  canManageMembers: { setTo: null },
  canDeleteProject: { setTo: null },
  canAddCards: { setTo: null },
  canEditCards: { setTo: null },
  canDeleteBoards: { setTo: null },
  canArchiveBoards: { setTo: null },
  canExportData: { setTo: null },
  canViewAnalytics: { setTo: null },
  canManageLabels: { setTo: null },
  canManageCustomFields: { setTo: null },
  canInviteGuests: { setTo: null },
  canManageIntegrations: { setTo: null },
};

const RULES_BY_ROLE = {
  [Roles.OWNER]: {
    canCreateBoards: { defaultTo: true },
    canEditProject: { defaultTo: true },
    canManageMembers: { defaultTo: true },
    canDeleteProject: { defaultTo: true },
    canAddCards: { defaultTo: true },
    canEditCards: { defaultTo: true },
    canDeleteBoards: { defaultTo: true },
    canArchiveBoards: { defaultTo: true },
    canExportData: { defaultTo: true },
    canViewAnalytics: { defaultTo: true },
    canManageLabels: { defaultTo: true },
    canManageCustomFields: { defaultTo: true },
    canInviteGuests: { defaultTo: true },
    canManageIntegrations: { defaultTo: true },
  },
  [Roles.MANAGER]: {
    canCreateBoards: { defaultTo: true },
    canEditProject: { defaultTo: true },
    canManageMembers: { defaultTo: true },
    canDeleteProject: { defaultTo: true },
    canAddCards: { defaultTo: true },
    canEditCards: { defaultTo: true },
    canDeleteBoards: { defaultTo: true },
    canArchiveBoards: { defaultTo: true },
    canExportData: { defaultTo: true },
    canViewAnalytics: { defaultTo: true },
    canManageLabels: { defaultTo: true },
    canManageCustomFields: { defaultTo: true },
    canInviteGuests: { defaultTo: false },
    canManageIntegrations: { defaultTo: false },
  },
  [Roles.EDITOR]: {
    canCreateBoards: { defaultTo: true },
    canEditProject: { defaultTo: false },
    canManageMembers: { defaultTo: false },
    canDeleteProject: { defaultTo: false },
    canAddCards: { defaultTo: true },
    canEditCards: { defaultTo: true },
    canDeleteBoards: { defaultTo: false },
    canArchiveBoards: { defaultTo: true },
    canExportData: { defaultTo: true },
    canViewAnalytics: { defaultTo: true },
    canManageLabels: { defaultTo: true },
    canManageCustomFields: { defaultTo: false },
    canInviteGuests: { defaultTo: false },
    canManageIntegrations: { defaultTo: false },
  },
  [Roles.MEMBER]: {
    canCreateBoards: { defaultTo: false },
    canEditProject: { defaultTo: false },
    canManageMembers: { defaultTo: false },
    canDeleteProject: { defaultTo: false },
    canAddCards: { defaultTo: true },
    canEditCards: { defaultTo: true },
    canDeleteBoards: { defaultTo: false },
    canArchiveBoards: { defaultTo: false },
    canExportData: { defaultTo: true },
    canViewAnalytics: { defaultTo: true },
    canManageLabels: { defaultTo: false },
    canManageCustomFields: { defaultTo: false },
    canInviteGuests: { defaultTo: false },
    canManageIntegrations: { defaultTo: false },
  },
  [Roles.VIEWER]: {
    canCreateBoards: { defaultTo: false },
    canEditProject: { defaultTo: false },
    canManageMembers: { defaultTo: false },
    canDeleteProject: { defaultTo: false },
    canAddCards: { defaultTo: false },
    canEditCards: { defaultTo: false },
    canDeleteBoards: { defaultTo: false },
    canArchiveBoards: { defaultTo: false },
    canExportData: { defaultTo: true },
    canViewAnalytics: { defaultTo: true },
    canManageLabels: { defaultTo: false },
    canManageCustomFields: { defaultTo: false },
    canInviteGuests: { defaultTo: false },
    canManageIntegrations: { defaultTo: false },
  },
  [Roles.GUEST]: {
    canCreateBoards: { defaultTo: false },
    canEditProject: { defaultTo: false },
    canManageMembers: { defaultTo: false },
    canDeleteProject: { defaultTo: false },
    canAddCards: { defaultTo: false },
    canEditCards: { defaultTo: false },
    canDeleteBoards: { defaultTo: false },
    canArchiveBoards: { defaultTo: false },
    canExportData: { defaultTo: false },
    canViewAnalytics: { defaultTo: false },
    canManageLabels: { defaultTo: false },
    canManageCustomFields: { defaultTo: false },
    canInviteGuests: { defaultTo: false },
    canManageIntegrations: { defaultTo: false },
  },
};

module.exports = {
  Roles,
  SHARED_RULES,
  RULES_BY_ROLE,

  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    role: {
      type: 'string',
      isIn: Object.values(Roles),
      required: true,
    },
    canCreateBoards: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_create_boards',
    },
    canEditProject: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_edit_project',
    },
    canManageMembers: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_manage_members',
    },
    canDeleteProject: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_delete_project',
    },
    canAddCards: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_add_cards',
    },
    canEditCards: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_edit_cards',
    },
    canDeleteBoards: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_delete_boards',
    },
    canArchiveBoards: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_archive_boards',
    },
    canExportData: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_export_data',
    },
    canViewAnalytics: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_view_analytics',
    },
    canManageLabels: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_manage_labels',
    },
    canManageCustomFields: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_manage_custom_fields',
    },
    canInviteGuests: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_invite_guests',
    },
    canManageIntegrations: {
      type: 'boolean',
      allowNull: true,
      columnName: 'can_manage_integrations',
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    projectId: {
      model: 'Project',
      required: true,
      columnName: 'project_id',
    },
    userId: {
      model: 'User',
      required: true,
      columnName: 'user_id',
    },
  },

  tableName: 'project_membership',
};