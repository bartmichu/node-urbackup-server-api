# CHANGELOG

This changelog starts at version `0.20.0` and includes a selection of significant changes.

Breaking Changes

  - No breaking changes listed.

Notable Changes

  - 0.21.0
    - Added `getGroupMembers()` method.

  - 0.20.1
    - Fixed `getClientAuthKey()` method. Previously, due to changes introduced by a UrBackup Server update, it was always returning an empty string.

  - 0.20.0
    - Fixed returned type inconsistencies for the following methods: `getClientId()`, `getClientName()`, `getGroupId()`, `getGroupName()`.