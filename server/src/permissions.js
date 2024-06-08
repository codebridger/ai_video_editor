const { PermissionGroup } = require("@modular-rest/server");

module.exports.permissionGroups = [
  new PermissionGroup({
    title: "end-user",
    isDefault: true,
    validPermissionTypes: [
      "anonymous_access",
      "user_access",
      "upload_file_access",
      "remove_file_access",
    ],
  }),

  new PermissionGroup({
    title: "anonymous",
    isAnonymous: true,
    validPermissionTypes: ["anonymous_access"],
  }),

  new PermissionGroup({
    title: "administrator",
    validPermissionTypes: [
      "user_access",
      "advanced_settings",
      "anonymous_access",
      "upload_file_access",
      "remove_file_access",
    ],
  }),
];
