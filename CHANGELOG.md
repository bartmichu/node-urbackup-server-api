# CHANGELOG

This changelog starts at version `0.20.0` and includes a selection of significant changes.

Breaking Changes

  - 0.30.0
    - Breaking change of defaults for `getActivities()` method: previously, it returned only current activities by default. Now, both current and last activities are included.
    - Breaking change of naming in `getActivities()` method: previously, it used the `past` property, which is now renamed to `last`. Similarly, the `includePast` parameter has been renamed to `includeLast`.

Notable Changes

  - 0.30.0
    - Breaking change of defaults for `getActivities()` method: previously, it returned only current activities by default. Now, both current and last activities are included.
    - Breaking change of naming in `getActivities()` method: previously, it used the `past` property, which is now renamed to `last`. Similarly, the `includePast` parameter has been renamed to `includeLast`.

  - 0.22.0
    - Added following methods: `getCurrentActivities()`, `getPastActivities()`, `getMailSettings()`, `getLdapSettings()`.

  - 0.21.0
    - Added `getGroupMembers()` method.

  - 0.20.1
    - Fixed `getClientAuthKey()` method. Previously, due to changes introduced by a UrBackup Server update, it was always returning an empty string.

  - 0.20.0
    - Fixed returned type inconsistencies for the following methods: `getClientId()`, `getClientName()`, `getGroupId()`, `getGroupName()`.