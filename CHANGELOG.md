# CHANGELOG

## Breaking Changes

- 0.100.0

  - Renamed `getClientAuthkey()` to `getClientAuthenticationKey()`.
  - Extended type checking may now throw an error in some corner cases when parameters have invalid values; safe in any other case.
  - The `userId` parameter type in `getUserRights()` was changed from String to Number for consistency with the rest of the library.
  - The `userName` parameter in the `addUser()` and `getUserRights()` methods was renamed to `username` for consistency with the rest of the library.
  - Renamed `stopActivity()` to `stopClientActivity()`.

- 0.90.0

  - Use the Node.js Fetch API instead of the node-fetch module. Older Node.js versions may require the `--experimental-fetch` flag.

- 0.70.0

  - Migrated from CommonJS (require, module.exports) to ES Modules (import, export) only.

- 0.60.0

  - Breaking change of naming in `getFailedClients()` method: previously, it used the `includeBlankClients` parameter, which is now renamed to `includeBlank`.

- 0.50.0

  - Reverted property name changes introduced in `0.40.0` - this was not a good idea. If such a change is needed in the future, it will be an optional feature (disabled by default) controlled by a method parameter.

- 0.40.0

  - ~~Breaking change of property names of objects returned by `getClients()` method. This affects the `getClients()`, `getGroupMembers()`, and `getRemovedClients()` methods.~~

- 0.30.0
  - Breaking change of naming in `getActivities()` method: previously, it used the `past` property, which is now renamed to `last`. Similarly, the `includePast` parameter has been renamed to `includeLast`.

## Notable Changes

- 0.100.0

  - Breaking change: renamed `getClientAuthkey()` to `getClientAuthenticationKey()`.
  - Breaking change: extended type checking may now throw an error in some corner cases when parameters have invalid values; safe in any other case.
  - Breaking change: the `userId` parameter type in `getUserRights()` was changed from String to Number for consistency with the rest of the library.
  - Breaking change: the `userName` parameter in the `addUser()` and `getUserRights()` methods was renamed to `username` for consistency with the rest of the library.
  - Breaking change: renamed `stopActivity()` to `stopClientActivity()`.
  - Fixed bugs in `getClientGroup()`, `setClientGroup()`, `getPausedActivities()`, `#startBackupCommon` (affecting `startFullFileBackup`, `startIncrementalFileBackup`, `startFullImageBackup`, `startIncrementalImageBackup`).
  - Migrated to Biome for code formatting and linting.
  - Updated the user-agent value to `node-urbackup-server-api`.
  - Added `getCurrentUser()` method.
  - Added `setUserRights()` method.
  - Added `setUserPassword()` method.
  - The `removeClient()` method now checks whether the specified client is pending deletion before requesting `stop_remove_client`, and returns `false` if it is not.
  - Improved the `stopActivity()` method: it now checks whether the specified activity exists, and returns `false` if it does not.
  - The `removeUser()` method now checks whether the specified user exists before deletion, and returns `false` if it does not.
  - The `removeUser()` method now supports the username parameter.
  - The `removeUser()` method now prevents removing the user that is currently making the API call.

- 0.92.0

  - Changes in `getGroupMembers()` method: Change the precedence to `groupId` if both `groupId` and `groupName` are defined.

- 0.91.0

  - Added following methods: `getClientGroup()`, `setClientGroup()`. Thanks to @yoya93 for the contribution!

- 0.90.0

  - Use the Node.js Fetch API instead of the node-fetch module. Older Node.js versions may require the `--experimental-fetch` flag.

- 0.80.1

  - Fixed the `getUsage()` method: the return type for a single client was incorrect.

- 0.70.0

  - Migrated from CommonJS (require, module.exports) to ES Modules (import, export) only.

- 0.60.0

  - Breaking change of naming in `getFailedClients()` method: previously, it used the `includeBlankClients` parameter, which is now renamed to `includeBlank`.
  - Added following parameters to `getOnlineClients()` and `getOfflineClients()` method: `includeBlank`.
  - Added following methods: `getUnseenClients()`, `getStaleClients()`.
  - Matching empty clients now considers whether file backups or image backups are enabled.
  - Matching failed clients now considers whether file backups or image backups are enabled.
  - Matching OK clients now considers whether file backups or image backups are enabled.

- 0.54.0

  - Added following parameters to `getActivities()` and `getCurrentActivities()` method: `includePaused`.

- 0.53.0

  - Fixed the `getBlankClients()` method: image backups were not being matched correctly.

- 0.52.0

  - Added following methods: `getOutdatedClients()`, `getConflictingClients()`, `removeUser()`, `addUser()`, `isServerOutdated()`.

- 0.51.0

  - Added following methods: `getFailedClients()`, `getOkClients()`.
  - Added following parameters to `getBlankClients()`: `includeFileBackups`, `includeImageBackups`, `groupName`.
  - Added `groupName` parameter to the following methods: `getRemovedClients()`, `getOnlineClients()`, `getOfflineClients()`, `getActiveClients()`, `getBlankClients()`.

- 0.50.0

  - Reverted property name changes introduced in `0.40.0` - this was not a good idea. If such a change is needed in the future, it will be an optional feature (disabled by default) controlled by a method parameter.

- 0.42.0

  - Added following methods: `getServerVersion()`, `getUserRights()`, `getRawStatus()`, `getRawUsage()`, `getRawProgress()`, `getActiveClients()`, `getBlankClients()`.
  - Added following properties to objects returned by `getClients()` method: `status`, `seen`, `processes`, `imageBackupDisabled`, `imageBackupOk`, `lastImageBackup`, `fileBackupOk`, `lastFileBackup`, `lastFileBackupIssues`.

- 0.41.0

  - Added following properties to objects returned by `getClients()` method: `online`, `uid`, `ip`, `clientVersion`, `osFamily`, `osVersion`. This affects the `getClients()`, `getGroupMembers()`, `getRemovedClients()`, `getOnlineClients()`, `getOfflineClients()`.

- 0.40.0

  - ~~Breaking change of property names of objects returned by `getClients()` method. This affects the `getClients()`, `getGroupMembers()`, and `getRemovedClients()` methods.~~

- 0.31.0

  - Added following methods: `getOnlineClients()`, `getOfflineClients()`, `getRemovedClients()`, `getPausedActivities()`.

- 0.30.0

  - Breaking change of naming in `getActivities()` method: previously, it used the `past` property, which is now renamed to `last`. Similarly, the `includePast` parameter has been renamed to `includeLast`.
  - Defaults change for `getActivities()` method: previously, it returned only current activities by default. Now, both current and last activities are included.

- 0.22.0

  - Added following methods: `getCurrentActivities()`, `getPastActivities()`, `getMailSettings()`, `getLdapSettings()`.

- 0.21.0

  - Added `getGroupMembers()` method.

- 0.20.1

  - Fixed `getClientAuthKey()` method. Previously, due to changes introduced by a UrBackup Server update, it was always returning an empty string.

- 0.20.0
  - Fixed returned type inconsistencies for the following methods: `getClientId()`, `getClientName()`, `getGroupId()`, `getGroupName()`.
