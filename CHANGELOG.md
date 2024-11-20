# CHANGELOG

This changelog starts at version `0.20.0` and includes a selection of significant changes.

## Breaking Changes
  - 0.60.0
    - Breaking change of naming in `getFailedClients()` method: previously, it used the `includeBlankClients` parameter, which is now renamed to `includeBlank`.

  - 0.50.0
    - Reverted property name changes introduced in `0.40.0` - this was not a good idea. If such a change is needed in the future, it will be an optional feature (disabled by default) controlled by a method parameter.

  - 0.40.0
    - ~~Breaking change of property names of objects returned by `getClients()` method. This affects the `getClients()`, `getGroupMembers()`, and `getRemovedClients()` methods.~~

  - 0.30.0
    - Breaking change of naming in `getActivities()` method: previously, it used the `past` property, which is now renamed to `last`. Similarly, the `includePast` parameter has been renamed to `includeLast`.

## Notable Changes

  - 0.60.0
    - Breaking change of naming in `getFailedClients()` method: previously, it used the `includeBlankClients` parameter, which is now renamed to `includeBlank`.
    - Added following parameters to `getOnlineClients()` and `getOfflineClients()` method: `includeBlank`.
    - Added following methods: `getUnseenClients()`

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
