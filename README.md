# node-urbackup-server-api

This module provides a Node.js interface for interacting with the UrBackup server's web API, whether the server is installed locally or accessed over a network. It facilitates the management and monitoring of backup operations by offering a range of functionalities, including:

- Viewing and modifying server settings
- Viewing and modifying client settings
- Adding or removing clients
- Managing groups
- Retrieving information about running tasks and client statuses
- Managing backup jobs, including starting and stopping backups
- Accessing live logs
- Fetching backup history and details for specific clients

The module aims to simplify the integration of UrBackup server management into Node.js applications, making it easier to automate and control backup operations programmatically.

_Please note that this module is still in a pre-1.0.0 release. Some functionality is missing, and method signatures may change without notice. Always review the [CHANGELOG](https://github.com/bartmichu/node-urbackup-server-api/blob/main/CHANGELOG.md) before updating to understand any potential breaking changes._

## Requirements

To use this module, ensure you have the following:

- An Active LTS or Maintenance LTS version of Node.js (https://nodejs.org/en/about/previous-releases)
- A current release of the UrBackup Server

## Installation

To install the module, use npm:

```shell
npm install urbackup-server-api
```

## Usage Example

Here's a basic example to get you started:

```javascript
import { UrbackupServer } from 'urbackup-server-api';

// When troubleshooting TSL connections with self-signed certificates you may try to disable certificate validation. Keep in mind that it's strongly discouraged for production use.
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const server = new UrbackupServer({
  url: 'http://127.0.0.1:55414',
  username: 'admin',
  password: 'secretpassword',
});

(async () => {
  try {
    // Check if server is currently busy
    const activities = await urbackup.getCurrentActivities();
    console.log(`Busy: ${activities.length > 0}`);

    // Get a list of production clients
    const prodClients = await urbackup
      .getGroupMembers({ groupName: 'prod' })
      .then((data) => console.log(data));

    // Get production clients with failed image backup
    const failedClients = await urbackup
      .getFailedClients({ groupName: 'prod', includeFileBackups: false })
      .then((data) => console.log(data));

    // Get all clients without both file and image backups
    const blankClients = await urbackup
      .getBlankClients()
      .then((data) => console.log(data));
  } catch (error) {
    // Deal with it
  }
})();
```

## Example implementation

<https://github.com/bartmichu/urbstat/>

**urbstat**

The missing command-line tool for UrBackup Server. It provides valuable insights into the utilization of data, clients' status and activities, and helps administrator to identify, troubleshoot and resolve issues that may arise within the system.

---

## Below is an automatically generated reference from JSDoc.

<a name="UrbackupServer"></a>

## UrbackupServer

Represents a UrBackup Server.

**Kind**: global class

- [UrbackupServer](#UrbackupServer)
  - [new UrbackupServer([params])](#new_UrbackupServer_new)
  - [.getServerIdentity()](#UrbackupServer+getServerIdentity) ⇒ <code>Promise.&lt;string&gt;</code>
  - [.getServerVersion()](#UrbackupServer+getServerVersion) ⇒ <code>Promise.&lt;object&gt;</code>
  - [.isServerOutdated()](#UrbackupServer+isServerOutdated) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.getUsers()](#UrbackupServer+getUsers) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.addUser(params)](#UrbackupServer+addUser) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.removeUser(params)](#UrbackupServer+removeUser) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.getUserRights([params])](#UrbackupServer+getUserRights) ⇒ <code>Promise.&lt;(Array\|null)&gt;</code>
  - [.getGroups()](#UrbackupServer+getGroups) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.addGroup(params)](#UrbackupServer+addGroup) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.removeGroup(params)](#UrbackupServer+removeGroup) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.getGroupMembers(params)](#UrbackupServer+getGroupMembers) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.getClients([params])](#UrbackupServer+getClients) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.getRemovedClients([params])](#UrbackupServer+getRemovedClients) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.getOnlineClients([params])](#UrbackupServer+getOnlineClients) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.getOfflineClients([params])](#UrbackupServer+getOfflineClients) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.getActiveClients([params])](#UrbackupServer+getActiveClients) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.getBlankClients([params])](#UrbackupServer+getBlankClients) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.getFailedClients([params])](#UrbackupServer+getFailedClients) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.getOkClients([params])](#UrbackupServer+getOkClients) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.getOutdatedClients([params])](#UrbackupServer+getOutdatedClients) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.getConflictingClients([params])](#UrbackupServer+getConflictingClients) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.getUnseenClients([params])](#UrbackupServer+getUnseenClients) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
  - [.getStaleClients([params])](#UrbackupServer+getStaleClients) ⇒ <code>Promise.&lt;Array&gt;</code>
  - [.addClient(params)](#UrbackupServer+addClient) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.removeClient(params)](#UrbackupServer+removeClient) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.cancelRemoveClient(params)](#UrbackupServer+cancelRemoveClient) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.getClientHints()](#UrbackupServer+getClientHints) ⇒ <code>Promise.&lt;Array&gt;</code>
  - [.addClientHint(params)](#UrbackupServer+addClientHint) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.removeClientHint(params)](#UrbackupServer+removeClientHint) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.getClientSettings([params])](#UrbackupServer+getClientSettings) ⇒ <code>Promise.&lt;Array&gt;</code>
  - [.setClientSettings(params)](#UrbackupServer+setClientSettings) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.getClientGroup(params)](#UrbackupServer+getClientGroup) ⇒ <code>Promise.&lt;(object\|null)&gt;</code>
  - [.setClientGroup(params)](#UrbackupServer+setClientGroup) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.getClientAuthkey(params)](#UrbackupServer+getClientAuthkey) ⇒ <code>Promise.&lt;string&gt;</code>
  - [.getStatus([params])](#UrbackupServer+getStatus) ⇒ <code>Promise.&lt;Array&gt;</code>
  - [.getUsage([params])](#UrbackupServer+getUsage) ⇒ <code>Promise.&lt;Array&gt;</code>
  - [.getActivities([params])](#UrbackupServer+getActivities) ⇒ <code>Promise.&lt;object&gt;</code>
  - [.getCurrentActivities([params])](#UrbackupServer+getCurrentActivities) ⇒ <code>Promise.&lt;Array&gt;</code>
  - [.getLastActivities([params])](#UrbackupServer+getLastActivities) ⇒ <code>Promise.&lt;Array&gt;</code>
  - [.getPausedActivities([params])](#UrbackupServer+getPausedActivities) ⇒ <code>Promise.&lt;Array&gt;</code>
  - [.stopActivity(params)](#UrbackupServer+stopActivity) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.getBackups(params)](#UrbackupServer+getBackups) ⇒ <code>Promise.&lt;object&gt;</code>
  - [.startFullFileBackup(params)](#UrbackupServer+startFullFileBackup) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.startIncrementalFileBackup(params)](#UrbackupServer+startIncrementalFileBackup) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.startFullImageBackup(params)](#UrbackupServer+startFullImageBackup) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.startIncrementalImageBackup(params)](#UrbackupServer+startIncrementalImageBackup) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.getLiveLog([params])](#UrbackupServer+getLiveLog) ⇒ <code>Promise.&lt;Array&gt;</code>
  - [.getGeneralSettings()](#UrbackupServer+getGeneralSettings) ⇒ <code>Promise.&lt;object&gt;</code>
  - [.getMailSettings()](#UrbackupServer+getMailSettings) ⇒ <code>Promise.&lt;object&gt;</code>
  - [.getLdapSettings()](#UrbackupServer+getLdapSettings) ⇒ <code>Promise.&lt;object&gt;</code>
  - [.setGeneralSettings(params)](#UrbackupServer+setGeneralSettings) ⇒ <code>Promise.&lt;boolean&gt;</code>
  - [.getRawStatus()](#UrbackupServer+getRawStatus) ⇒ <code>Promise.&lt;object&gt;</code>
  - [.getRawUsage()](#UrbackupServer+getRawUsage) ⇒ <code>Promise.&lt;object&gt;</code>
  - [.getRawProgress()](#UrbackupServer+getRawProgress) ⇒ <code>Promise.&lt;object&gt;</code>

<a name="new_UrbackupServer_new"></a>

### new UrbackupServer([params])

This is a constructor.

| Param             | Type                | Default                                                     | Description                                                                                                   |
| ----------------- | ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [params]          | <code>object</code> |                                                             | An optional object containing parameters.                                                                     |
| [params.url]      | <code>string</code> | <code>&quot;&#x27;http://127.0.0.1:55414&#x27;&quot;</code> | The URL of the server, must include the protocol, hostname, and port. Defaults to `http://127.0.0.1:55414`.   |
| [params.username] | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code>                       | The username used for logging in. If empty, anonymous login method will be used. Defaults to an empty string. |
| [params.password] | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code>                       | The password used to log in. Defaults to an empty string.                                                     |

**Example** _(Connect to the built-in server locally without a password)_

```js
const server = new UrbackupServer();
```

**Example** _(Connect locally with a specified password)_

```js
const server = new UrbackupServer({
  url: 'http://127.0.0.1:55414',
  username: 'admin',
  password: 'secretpassword',
});
```

**Example** _(Connect over the network)_

```js
const server = new UrbackupServer({
  url: 'https://192.168.0.2:443',
  username: 'admin',
  password: 'secretpassword',
});
```

<a name="UrbackupServer+getServerIdentity"></a>

### urbackupServer.getServerIdentity() ⇒ <code>Promise.&lt;string&gt;</code>

Retrieves server identity.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;string&gt;</code> - The server identity.  
**Throws**:

- <code>Error</code> If the API response is missing required values or if the login fails.

**Example** _(Get server identity)_

```js
server.getServerIdentity().then((data) => console.log(data));
```

<a name="UrbackupServer+getServerVersion"></a>

### urbackupServer.getServerVersion() ⇒ <code>Promise.&lt;object&gt;</code>

Retrieves the server version in both number and string representation.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - An object containing the server version number and string.  
**Throws**:

- <code>Error</code> If the API response is missing required values or if the login fails.

**Example** _(Get server version number)_

```js
server.getServerVersion().then((data) => console.log(data.number));
```

**Example** _(Get server version string)_

```js
server.getServerVersion().then((data) => console.log(data.string));
```

<a name="UrbackupServer+isServerOutdated"></a>

### urbackupServer.isServerOutdated() ⇒ <code>Promise.&lt;boolean&gt;</code>

Checks if the server version is outdated compared to the available version.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the server version is outdated, false otherwise.  
**Throws**:

- <code>Error</code> If the API response is missing required values or if the login fails.

**Example**

```js
server.isServerOutdated().then((isOutdated) => console.log(isOutdated));
```

<a name="UrbackupServer+getUsers"></a>

### urbackupServer.getUsers() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of users.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing users. If no users are found, it returns an empty array.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

**Example** _(Get all users)_

```js
server.getUsers().then((data) => console.log(data));
```

<a name="UrbackupServer+addUser"></a>

### urbackupServer.addUser(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Adds a new user with the specified username, password, and rights.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the user was added successfully, false otherwise.  
**Throws**:

- <code>Error</code> If required parameters are missing, the login fails, or the API response is missing expected values.

| Param            | Type                              | Default            | Description                                                                                   |
| ---------------- | --------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| params           | <code>object</code>               |                    | An object containing parameters.                                                              |
| params.userName  | <code>string</code>               |                    | The username for the new user.                                                                |
| params.password  | <code>string</code>               |                    | The password for the new user.                                                                |
| [params.isAdmin] | <code>boolean</code>              | <code>false</code> | Whether the new user should have admin rights (all domains, all rights). Defaults to false.   |
| [params.rights]  | <code>Array.&lt;object&gt;</code> |                    | Array of user permissions. Ignored if `isAdmin` is true. Defaults to the default user rights. |

**Example** _(Add a regular user)_

```js
server
  .addUser({ userName: 'newUser', password: 'userPassword' })
  .then((result) => console.log(result));
```

**Example** _(Add an admin user)_

```js
server
  .addUser({ userName: 'adminUser', password: 'adminPassword', isAdmin: true })
  .then((result) => console.log(result));
```

<a name="UrbackupServer+removeUser"></a>

### urbackupServer.removeUser(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Removes a user by their user ID.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to a boolean indicating whether the user was successfully removed.  
**Throws**:

- <code>Error</code> If the `userId` parameter is missing or invalid, or if the login fails.

| Param         | Type                | Description                       |
| ------------- | ------------------- | --------------------------------- |
| params        | <code>object</code> | An object containing parameters.  |
| params.userId | <code>number</code> | The ID of the user to be removed. |

**Example** _(Remove a user by their ID)_

```js
server.removeUser({ userId: 123 }).then((status) => console.log(status));
```

<a name="UrbackupServer+getUserRights"></a>

### urbackupServer.getUserRights([params]) ⇒ <code>Promise.&lt;(Array\|null)&gt;</code>

Retrieves the rights of a specific user.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;(Array\|null)&gt;</code> - A promise that resolves to an array of user rights, or null if the user is not found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param             | Type                | Default                                 | Description                                                                                                                            |
| ----------------- | ------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| [params]          | <code>object</code> |                                         | An optional object containing parameters.                                                                                              |
| [params.userId]   | <code>string</code> |                                         | The user's ID. Takes precedence if both `userId` and `userName` are defined. Required if `clientName` is undefined.                    |
| [params.userName] | <code>string</code> | <code>&quot;this.#username&quot;</code> | The user's name. Ignored if `userId` is defined. Defaults to the username of the current session. Required if `clientId` is undefined. |

**Example** _(Get user rights of the current session user)_

```js
server.getUserRights().then((data) => console.log(data));
```

**Example** _(Get user rights by user ID)_

```js
server.getUserRights({ userId: '12345' }).then((data) => console.log(data));
```

**Example** _(Get user rights by user name)_

```js
server
  .getUserRights({ userName: 'john_doe' })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getGroups"></a>

### urbackupServer.getGroups() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of groups.
By default, UrBackup clients are added to a group with ID 0 and an empty name (empty string).

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing groups. If no groups are found, it returns an empty array.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

**Example** _(Get all groups)_

```js
server.getGroups().then((data) => console.log(data));
```

<a name="UrbackupServer+addGroup"></a>

### urbackupServer.addGroup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Adds a new group.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. If the group already exists, or adding the group was not successful for any reason, returns false.  
**Throws**:

- <code>Error</code> If the groupName is missing or invalid, or if the API response is missing expected values.

| Param            | Type                | Description                                                   |
| ---------------- | ------------------- | ------------------------------------------------------------- |
| params           | <code>object</code> | An object containing parameters.                              |
| params.groupName | <code>string</code> | The group name. Must be unique and cannot be an empty string. |

**Example** _(Add new group)_

```js
server.addGroup({ groupName: 'prod' }).then((data) => console.log(data));
```

<a name="UrbackupServer+removeGroup"></a>

### urbackupServer.removeGroup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Removes a group.
All clients in this group will be reassigned to the default group. Does not allow removal of the default group (ID: 0, name: '').

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When the removal is successful, the method returns true. If the removal is not successful, the method returns false.  
**Throws**:

- <code>Error</code> If both `groupId` and `groupName` are missing or invalid, or if the login fails.

| Param            | Type                | Description                                                                                                                                 |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| params           | <code>object</code> | An object containing parameters.                                                                                                            |
| params.groupId   | <code>number</code> | Group ID. Must be greater than 0. Takes precedence if both `groupId` and `groupName` are defined. Required if `groupName` is undefined.     |
| params.groupName | <code>string</code> | Group name. Must be different than empty string. Ignored if both `groupId` and `groupName` are defined. Required if `groupId` is undefined. |

**Example** _(Remove group)_

```js
server.removeGroup({ groupId: 1 }).then((data) => console.log(data));
server.removeGroup({ groupName: 'prod' }).then((data) => console.log(data));
```

<a name="UrbackupServer+getGroupMembers"></a>

### urbackupServer.getGroupMembers(params) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of clients who are members of a given group.
This is only a convenience method that wraps the `getClients()` method.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing clients matching the search criteria. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If both `groupId` and `groupName` are missing or invalid.

| Param            | Type                | Description                                                                                                     |
| ---------------- | ------------------- | --------------------------------------------------------------------------------------------------------------- |
| params           | <code>object</code> | An object containing parameters.                                                                                |
| params.groupId   | <code>number</code> | Group ID. Takes precedence if both `groupId` and `groupName` are defined. Required if `groupName` is undefined. |
| params.groupName | <code>string</code> | Group name. Ignored if both `groupId` and `groupName` are defined. Required if `groupId` is undefined.          |

**Example** _(Get members of default group)_

```js
server.getGroupMembers({ groupId: 0 }).then((data) => console.log(data));
```

**Example** _(Get all clients belonging to a specific group)_

```js
server
  .getGroupMembers({ groupName: 'office' })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getClients"></a>

### urbackupServer.getClients([params]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of clients.
By default, this method matches all clients, including those marked for removal.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing clients matching the search criteria. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param                   | Type                 | Default           | Description                                                                   |
| ----------------------- | -------------------- | ----------------- | ----------------------------------------------------------------------------- |
| [params]                | <code>object</code>  |                   | An optional object containing parameters.                                     |
| [params.groupName]      | <code>string</code>  |                   | Group name. Defaults to undefined, which matches all groups.                  |
| [params.includeRemoved] | <code>boolean</code> | <code>true</code> | Whether or not clients pending deletion should be included. Defaults to true. |

**Example** _(Get all clients)_

```js
server.getClients().then((data) => console.log(data));
```

**Example** _(Get all clients, but exclude clients marked for removal)_

```js
server.getClients({ includeRemoved: false }).then((data) => console.log(data));
```

**Example** _(Get all clients belonging to a specific group)_

```js
server.getClients({ groupName: 'office' }).then((data) => console.log(data));
```

<a name="UrbackupServer+getRemovedClients"></a>

### urbackupServer.getRemovedClients([params]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of clients marked for removal.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param              | Type                | Description                                                  |
| ------------------ | ------------------- | ------------------------------------------------------------ |
| [params]           | <code>object</code> | An optional object containing parameters.                    |
| [params.groupName] | <code>string</code> | Group name. Defaults to undefined, which matches all groups. |

**Example** _(Get clients marked for removal)_

```js
server.getRemovedClients().then((data) => console.log(data));
```

**Example** _(Get clients marked for removal in a specific group)_

```js
server
  .getRemovedClients({ groupName: 'sales' })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getOnlineClients"></a>

### urbackupServer.getOnlineClients([params]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of online clients.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param                   | Type                 | Default           | Description                                                                                        |
| ----------------------- | -------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| [params]                | <code>object</code>  |                   | An optional object containing parameters.                                                          |
| [params.groupName]      | <code>string</code>  |                   | Group name. Defaults to undefined, which matches all groups.                                       |
| [params.includeRemoved] | <code>boolean</code> | <code>true</code> | Whether or not clients pending deletion should be included. Defaults to true.                      |
| [params.includeBlank]   | <code>boolean</code> | <code>true</code> | Whether or not blank clients should be taken into account when matching clients. Defaults to true. |

**Example** _(Get all online clients)_

```js
server.getOnlineClients().then((data) => console.log(data));
```

**Example** _(Get online clients from a specific group)_

```js
server
  .getOnlineClients({ groupName: 'servers' })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getOfflineClients"></a>

### urbackupServer.getOfflineClients([params]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of offline clients.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param                   | Type                 | Default           | Description                                                                                        |
| ----------------------- | -------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| [params]                | <code>object</code>  |                   | An optional object containing parameters.                                                          |
| [params.groupName]      | <code>string</code>  |                   | Group name. Defaults to undefined, which matches all groups.                                       |
| [params.includeRemoved] | <code>boolean</code> | <code>true</code> | Whether or not clients pending deletion should be included. Defaults to true.                      |
| [params.includeBlank]   | <code>boolean</code> | <code>true</code> | Whether or not blank clients should be taken into account when matching clients. Defaults to true. |

**Example** _(Get all offline clients)_

```js
server.getOfflineClients().then((data) => console.log(data));
```

**Example** _(Get offline clients, skip clients marked for removal)_

```js
server
  .getOfflineClients({ includeRemoved: false })
  .then((data) => console.log(data));
```

**Example** _(Get offline clients from a specific groups)_

```js
server
  .getOfflineClients({ groupName: 'servers' })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getActiveClients"></a>

### urbackupServer.getActiveClients([params]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of active clients.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param                   | Type                 | Default           | Description                                                                   |
| ----------------------- | -------------------- | ----------------- | ----------------------------------------------------------------------------- |
| [params]                | <code>object</code>  |                   | An optional object containing parameters.                                     |
| [params.groupName]      | <code>string</code>  |                   | Group name. Defaults to undefined, which matches all groups.                  |
| [params.includeRemoved] | <code>boolean</code> | <code>true</code> | Whether or not clients pending deletion should be included. Defaults to true. |

**Example** _(Get all active clients)_

```js
server.getActiveClients().then((data) => console.log(data));
```

<a name="UrbackupServer+getBlankClients"></a>

### urbackupServer.getBlankClients([params]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of blank clients, i.e., clients without any finished file and/or image backups.
Matching empty clients considers whether file backups or image backups are enabled.
By default, it matches clients without both file and image backups.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param                        | Type                 | Default           | Description                                                                                        |
| ---------------------------- | -------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| [params]                     | <code>object</code>  |                   | An optional object containing parameters.                                                          |
| [params.groupName]           | <code>string</code>  |                   | Group name. Defaults to undefined, which matches all groups.                                       |
| [params.includeRemoved]      | <code>boolean</code> | <code>true</code> | Whether or not clients pending deletion should be included. Defaults to true.                      |
| [params.includeFileBackups]  | <code>boolean</code> | <code>true</code> | Whether or not file backups should be taken into account when matching clients. Defaults to true.  |
| [params.includeImageBackups] | <code>boolean</code> | <code>true</code> | Whether or not image backups should be taken into account when matching clients. Defaults to true. |

**Example** _(Get all blank clients, i.e., clients without both file and image backups)_

```js
server.getBlankClients().then((data) => console.log(data));
```

**Example** _(Get blank clients, skip clients marked for removal)_

```js
server
  .getBlankClients({ includeRemoved: false })
  .then((data) => console.log(data));
```

**Example** _(Get clients without any file backups)_

```js
server
  .getBlankClients({ includeImageBackups: false })
  .then((data) => console.log(data));
```

**Example** _(Get clients without any image backups)_

```js
server
  .getBlankClients({ includeFileBackups: false })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getFailedClients"></a>

### urbackupServer.getFailedClients([params]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of failed clients, i.e., clients with failed backup status.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param                        | Type                 | Default            | Description                                                                                        |
| ---------------------------- | -------------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| [params]                     | <code>object</code>  |                    | An optional object containing parameters.                                                          |
| [params.groupName]           | <code>string</code>  |                    | Group name. Defaults to undefined, which matches all groups.                                       |
| [params.includeRemoved]      | <code>boolean</code> | <code>true</code>  | Whether or not clients pending deletion should be included. Defaults to true.                      |
| [params.includeBlank]        | <code>boolean</code> | <code>true</code>  | Whether or not blank clients should be taken into account when matching clients. Defaults to true. |
| [params.includeFileBackups]  | <code>boolean</code> | <code>true</code>  | Whether or not file backups should be taken into account when matching clients. Defaults to true.  |
| [params.includeImageBackups] | <code>boolean</code> | <code>true</code>  | Whether or not image backups should be taken into account when matching clients. Defaults to true. |
| [params.failOnFileIssues]    | <code>boolean</code> | <code>false</code> | Whether or not to treat file backups finished with issues as being failed. Defaults to false.      |

**Example** _(Get clients with failed file or image backups)_

```js
server.getFailedClients().then((data) => console.log(data));
```

**Example** _(Get failed clients, skip clients marked for removal)_

```js
server
  .getFailedClients({ includeRemoved: false })
  .then((data) => console.log(data));
```

**Example** _(Get clients with failed file backups)_

```js
server
  .getFailedClients({ includeImageBackups: false })
  .then((data) => console.log(data));
```

**Example** _(Get clients with failed image backups)_

```js
server
  .getFailedClients({ includeFileBackups: false })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getOkClients"></a>

### urbackupServer.getOkClients([params]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of OK clients, i.e., clients with OK backup status.
File backups finished with issues are treated as OK by default.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param                        | Type                 | Default            | Description                                                                                        |
| ---------------------------- | -------------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| [params]                     | <code>object</code>  |                    | An optional object containing parameters.                                                          |
| [params.groupName]           | <code>string</code>  |                    | Group name. Defaults to undefined, which matches all groups.                                       |
| [params.includeRemoved]      | <code>boolean</code> | <code>true</code>  | Whether or not clients pending deletion should be included. Defaults to true.                      |
| [params.includeFileBackups]  | <code>boolean</code> | <code>true</code>  | Whether or not file backups should be taken into account when matching clients. Defaults to true.  |
| [params.includeImageBackups] | <code>boolean</code> | <code>true</code>  | Whether or not image backups should be taken into account when matching clients. Defaults to true. |
| [params.failOnFileIssues]    | <code>boolean</code> | <code>false</code> | Whether or not to treat file backups finished with issues as being failed. Defaults to false.      |

**Example** _(Get OK clients, use default parameters)_

```js
server.getOkClients().then((data) => console.log(data));
```

**Example** _(Get OK clients, skip clients marked for removal)_

```js
server
  .getOkClients({ includeRemoved: false })
  .then((data) => console.log(data));
```

**Example** _(Get clients with OK file backup, skip image backup status)_

```js
server
  .getOkClients({ includeImageBackups: false })
  .then((data) => console.log(data));
```

**Example** _(Get clients with OK file backup but treat backup issues as a failure, skip image backup status)_

```js
server
  .getOkClients({ includeImageBackups: false, failOnFileIssues: true })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getOutdatedClients"></a>

### urbackupServer.getOutdatedClients([params]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of clients using an outdated version.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param                   | Type                 | Default           | Description                                                                   |
| ----------------------- | -------------------- | ----------------- | ----------------------------------------------------------------------------- |
| [params]                | <code>object</code>  |                   | An optional object containing parameters.                                     |
| [params.groupName]      | <code>string</code>  |                   | Group name. Defaults to undefined, which matches all groups.                  |
| [params.includeRemoved] | <code>boolean</code> | <code>true</code> | Whether or not clients pending deletion should be included. Defaults to true. |

**Example** _(Get all outdated clients)_

```js
server.getOutdatedClients().then((data) => console.log(data));
```

**Example** _(Get outdated clients in a specific group)_

```js
server
  .getOutdatedClients({ groupName: 'exampleGroup' })
  .then((data) => console.log(data));
```

**Example** _(Get outdated clients, exclude clients marked for removal)_

```js
server
  .getOutdatedClients({ includeRemoved: false })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getConflictingClients"></a>

### urbackupServer.getConflictingClients([params]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of online clients with the same, i.e., conflicting IP address.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param                   | Type                 | Default           | Description                                                                   |
| ----------------------- | -------------------- | ----------------- | ----------------------------------------------------------------------------- |
| [params]                | <code>object</code>  |                   | An optional object containing parameters.                                     |
| [params.includeRemoved] | <code>boolean</code> | <code>true</code> | Whether or not clients pending deletion should be included. Defaults to true. |

**Example** _(Get all online clients with conflicting IP addresses)_

```js
server.getConflictingClients().then((data) => console.log(data));
```

**Example** _(Get online clients with conflicting IP addresses, exclude clients marked for removal)_

```js
server
  .getConflictingClients({ includeRemoved: false })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getUnseenClients"></a>

### urbackupServer.getUnseenClients([params]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>

Retrieves a list of clients who have not been seen for a specified period of time. Defaults to 24 hours.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param                   | Type                 | Default           | Description                                                                                                            |
| ----------------------- | -------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [params]                | <code>object</code>  |                   | An optional object containing parameters.                                                                              |
| [params.groupName]      | <code>string</code>  |                   | Group name. Defaults to undefined, which matches all groups.                                                           |
| [params.includeRemoved] | <code>boolean</code> | <code>true</code> | Whether or not clients pending deletion should be included. Defaults to true.                                          |
| [params.includeBlank]   | <code>boolean</code> | <code>true</code> | Whether or not blank clients should be taken into account when matching clients. Defaults to true.                     |
| [params.timeThreshold]  | <code>number</code>  | <code>1440</code> | A time threshold, measured in minutes, after which a client is considered unseen. Defaults to 1440 minutes (24 hours). |

**Example** _(Get clients not seen for more than 2 days)_

```js
server
  .getUnseenClients({ timeThreshold: 2880 })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getStaleClients"></a>

### urbackupServer.getStaleClients([params]) ⇒ <code>Promise.&lt;Array&gt;</code>

Retrieves a list of clients that are considered "stale" (i.e., have backups older than the specified threshold).
This method fetches all clients within a specified group and filters those that are stale based on their last backup times.
Optionally, it can exclude blank clients (clients with no backups) from the results.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - - A promise that resolves to an array of clients that are considered stale.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

| Param                        | Type                 | Default           | Description                                                                                                |
| ---------------------------- | -------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| [params]                     | <code>object</code>  |                   | An optional object containing parameters.                                                                  |
| [params.groupName]           | <code>string</code>  |                   | Group name. Defaults to undefined, which matches all groups.                                               |
| [params.includeRemoved]      | <code>boolean</code> | <code>true</code> | Whether or not clients pending deletion should be included. Defaults to true.                              |
| [params.includeBlank]        | <code>boolean</code> | <code>true</code> | Whether or not blank clients should be taken into account when matching clients. Defaults to true.         |
| [params.includeFileBackups]  | <code>boolean</code> | <code>true</code> | Whether or not file backups should be taken into account when matching clients. Defaults to true.          |
| [params.includeImageBackups] | <code>boolean</code> | <code>true</code> | Whether or not image backups should be taken into account when matching clients. Defaults to true.         |
| [params.timeThreshold]       | <code>number</code>  | <code>1440</code> | The time threshold (in minutes) for determining if a client is stale. Defaults to 1440 minutes (24 hours). |

**Example** _(Get clients with file backup older than a day, skip blank clients)_

```js
server
  .getStaleClients({
    includeBlank: false,
    includeImageBackups: false,
    timeThreshold: 1440,
  })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+addClient"></a>

### urbackupServer.addClient(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Adds a new client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. If adding the client was not successful, for example if the client already exists, returns false.  
**Throws**:

- <code>Error</code> If the clientName is missing or invalid, if the login fails, or if the API response is missing expected values.

| Param             | Type                | Description                      |
| ----------------- | ------------------- | -------------------------------- |
| params            | <code>object</code> | An object containing parameters. |
| params.clientName | <code>string</code> | The client's name.               |

**Example** _(Add new client)_

```js
server.addClient({ clientName: 'laptop2' }).then((data) => console.log(data));
```

<a name="UrbackupServer+removeClient"></a>

### urbackupServer.removeClient(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Marks the client for removal.
Actual removal occurs during the cleanup time window. Until then, this operation can be reversed with the `cancelRemoveClient` method.
**WARNING:** Removing clients will also delete all their backups stored on the UrBackup server.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. Returns false if the removal was not successful.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid.

| Param             | Type                | Description                                                                                                                   |
| ----------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| params            | <code>object</code> | An object containing parameters.                                                                                              |
| params.clientId   | <code>number</code> | Client's ID. If both `clientId` and `clientName` are defined, the ID takes precedence. Required if `clientName` is undefined. |
| params.clientName | <code>string</code> | Client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.                  |

**Example** _(Remove client by ID)_

```js
server.removeClient({ clientId: 1 }).then((data) => console.log(data));
```

**Example** _(Remove client by name)_

```js
server
  .removeClient({ clientName: 'laptop2' })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+cancelRemoveClient"></a>

### urbackupServer.cancelRemoveClient(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Unmarks the client as ready for removal.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. Returns false if the stopping process was not successful.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid.

| Param             | Type                | Description                                                                                                           |
| ----------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| params            | <code>object</code> | An object containing parameters.                                                                                      |
| params.clientId   | <code>number</code> | Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| params.clientName | <code>string</code> | Client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.          |

**Example** _(Stop the server from removing a client by ID)_

```js
server.cancelRemoveClient({ clientId: 1 }).then((data) => console.log(data));
```

**Example** _(Stop the server from removing a client by name)_

```js
server
  .cancelRemoveClient({ clientName: 'laptop2' })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getClientHints"></a>

### urbackupServer.getClientHints() ⇒ <code>Promise.&lt;Array&gt;</code>

Retrieves a list of client discovery hints, which are also known as extra clients.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - Array of objects representing client hints. Returns an empty array when no matching client hints are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is incorrect.

**Example** _(Get extra clients)_

```js
server.getClientHints().then((data) => console.log(data));
```

<a name="UrbackupServer+addClientHint"></a>

### urbackupServer.addClientHint(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Adds a new client discovery hint, also known as an extra client.
Discovery hints are a way of improving client discovery in local area networks.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. Returns false when adding was not successful.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid, or if the API response is incorrect.

| Param          | Type                | Description                      |
| -------------- | ------------------- | -------------------------------- |
| params         | <code>object</code> | An object containing parameters. |
| params.address | <code>string</code> | Client's IP address or hostname. |

**Example** _(Add new extra client)_

```js
server
  .addClientHint({ address: '192.168.100.200' })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+removeClientHint"></a>

### urbackupServer.removeClientHint(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Removes a specific client discovery hint, also known as an extra client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. Returns false when removing was not successful.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid, or if the API response is incorrect.

| Param          | Type                | Description                      |
| -------------- | ------------------- | -------------------------------- |
| params         | <code>object</code> | An object containing parameters. |
| params.address | <code>string</code> | Client's IP address or hostname. |

**Example** _(Remove extra client)_

```js
server
  .removeClientHint({ address: '192.168.100.200' })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getClientSettings"></a>

### urbackupServer.getClientSettings([params]) ⇒ <code>Promise.&lt;Array&gt;</code>

Retrieves client settings.
Matches all clients by default, but `clientId` or `clientName` can be used to request settings for one particular client.
Clients marked for removal are not excluded from the results.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - An array with objects representing client settings. Returns an empty array if no matching client is found.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid, or if the API response is incorrect.

| Param               | Type                | Description                                                                                                                                                        |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [params]            | <code>object</code> | An optional object containing parameters.                                                                                                                          |
| [params.clientId]   | <code>number</code> | Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined. |
| [params.clientName] | <code>string</code> | Client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.          |

**Example** _(Get settings for all clients)_

```js
server.getClientSettings().then((data) => console.log(data));
```

**Example** _(Get settings for a specific client only)_

```js
server
  .getClientSettings({ clientName: 'laptop1' })
  .then((data) => console.log(data));
server.getClientSettings({ clientId: 3 }).then((data) => console.log(data));
```

<a name="UrbackupServer+setClientSettings"></a>

### urbackupServer.setClientSettings(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Changes one specific element of client settings.
A list of settings can be obtained with the `getClientSettings` method.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. Returns false when the save request was unsuccessful or if the key/value is invalid.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid, or if the API response is incorrect.

| Param             | Type                                                               | Description                                                                                                           |
| ----------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| params            | <code>object</code>                                                | An object containing parameters.                                                                                      |
| params.clientId   | <code>number</code>                                                | Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| params.clientName | <code>string</code>                                                | Client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.          |
| params.key        | <code>string</code>                                                | Settings element to change.                                                                                           |
| params.newValue   | <code>string</code> \| <code>number</code> \| <code>boolean</code> | New value for settings element.                                                                                       |

**Example** _(Set directories to backup to be optional by default)_

```js
server
  .setClientSettings({
    clientName: 'laptop1',
    key: 'backup_dirs_optional',
    newValue: true,
  })
  .then((data) => console.log(data));
server
  .setClientSettings({
    clientId: 3,
    key: 'backup_dirs_optional',
    newValue: true,
  })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getClientGroup"></a>

### urbackupServer.getClientGroup(params) ⇒ <code>Promise.&lt;(object\|null)&gt;</code>

Retrieves the group information for a specific client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;(object\|null)&gt;</code> - A promise that resolves to an object containing the group ID and name, or null if the client or group is not found.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid, if the API response is missing values, or if login fails.

| Param             | Type                | Description                                                                                                               |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| params            | <code>object</code> | An object containing parameters.                                                                                          |
| params.clientId   | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| params.clientName | <code>string</code> | The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.          |

**Example** _(Get client group by client ID)_

```js
server.getClientGroup({ clientId: 1 }).then((data) => console.log(data));
```

**Example** _(Get client group by client name)_

```js
server
  .getClientGroup({ clientName: 'laptop2' })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+setClientGroup"></a>

### urbackupServer.setClientGroup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Sets the group for a specific client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the group was successfully set, or false otherwise.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid, or if the API response is incorrect.

| Param             | Type                | Description                                                                                                           |
| ----------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| params            | <code>object</code> | An object containing parameters.                                                                                      |
| params.clientId   | <code>number</code> | Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| params.clientName | <code>string</code> | Client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.          |
| params.groupId    | <code>number</code> | Group ID.                                                                                                             |

**Example** _(Set client group by client ID)_

```js
server
  .setClientGroup({ clientId: 1, groupId: 123 })
  .then((data) => console.log(data));
```

**Example** _(Set client group by client name)_

```js
server
  .setClientGroup({ clientName: 'laptop2', groupId: 123 })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getClientAuthkey"></a>

### urbackupServer.getClientAuthkey(params) ⇒ <code>Promise.&lt;string&gt;</code>

Retrieves the authentication key for a specified client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;string&gt;</code> - Client's authentication key. Returns an empty string if no matching clients are found.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid, or if the API response is incorrect.

| Param             | Type                | Description                                                                                                           |
| ----------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| params            | <code>object</code> | An object containing parameters.                                                                                      |
| params.clientId   | <code>number</code> | Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| params.clientName | <code>string</code> | Client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.          |

**Example** _(Get authentication key for a specific client)_

```js
server
  .getClientAuthkey({ clientName: 'laptop1' })
  .then((data) => console.log(data));
server.getClientAuthkey({ clientId: 3 }).then((data) => console.log(data));
```

<a name="UrbackupServer+getStatus"></a>

### urbackupServer.getStatus([params]) ⇒ <code>Promise.&lt;Array&gt;</code>

Retrieves backup status.
Matches all clients by default, including clients marked for removal.
Client name or client ID can be passed as an argument in which case only that one client's status is returned.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - Array of objects with status info for matching clients. Returns an empty array if no matching clients are found.  
**Throws**:

- <code>Error</code> If the API response is incorrect or if login fails.

| Param                   | Type                 | Default           | Description                                                                                                                                                      |
| ----------------------- | -------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [params]                | <code>object</code>  |                   | An object containing parameters.                                                                                                                                 |
| [params.clientId]       | <code>number</code>  |                   | Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |
| [params.clientName]     | <code>string</code>  |                   | Client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined.      |
| [params.includeRemoved] | <code>boolean</code> | <code>true</code> | Whether or not clients pending deletion should be included. Defaults to true.                                                                                    |

**Example** _(Get status for all clients)_

```js
server.getStatus().then((data) => console.log(data));
```

**Example** _(Get status for all clients, but skip clients marked for removal)_

```js
server.getStatus({ includeRemoved: false }).then((data) => console.log(data));
```

**Example** _(Get status for a specific client only)_

```js
server.getStatus({ clientName: 'laptop1' }).then((data) => console.log(data));
server.getStatus({ clientId: 3 }).then((data) => console.log(data));
```

<a name="UrbackupServer+getUsage"></a>

### urbackupServer.getUsage([params]) ⇒ <code>Promise.&lt;Array&gt;</code>

Retrieves storage usage.
By default, it matches all clients, but you can use `clientName` or `clientId` to request usage for one particular client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - A promise that resolves to an array of objects with storage usage info for each client. Resolves to an empty array if no matching clients are found.  
**Throws**:

- <code>Error</code> If the API response is missing values or if login fails.

| Param               | Type                | Description                                                                                                                                                            |
| ------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [params]            | <code>object</code> | An optional object containing parameters.                                                                                                                              |
| [params.clientId]   | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined. |
| [params.clientName] | <code>string</code> | The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.          |

**Example** _(Get usage for all clients)_

```js
server.getUsage().then((data) => console.log(data));
```

**Example** _(Get usage for a specific client only)_

```js
server.getUsage({ clientName: 'laptop1' }).then((data) => console.log(data));
server.getUsage({ clientId: 3 }).then((data) => console.log(data));
```

<a name="UrbackupServer+getActivities"></a>

### urbackupServer.getActivities([params]) ⇒ <code>Promise.&lt;object&gt;</code>

Retrieves a list of current and/or last activities.
Matches all clients by default, but `clientName` or `clientId` can be used to request activities for one particular client.
By default, this method returns both current and last activities.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - An object with activities info in two separate arrays (one for current and one for last activities). Returns an object with empty arrays when no matching clients/activities are found.  
**Throws**:

- <code>Error</code> If the API response is missing values or if login fails.

| Param                   | Type                 | Default           | Description                                                                                                                                                          |
| ----------------------- | -------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [params]                | <code>object</code>  |                   | An optional object containing parameters.                                                                                                                            |
| [params.clientId]       | <code>number</code>  |                   | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |
| [params.clientName]     | <code>string</code>  |                   | The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.        |
| [params.includeCurrent] | <code>boolean</code> | <code>true</code> | Whether or not currently running activities should be included. Defaults to true.                                                                                    |
| [params.includeLast]    | <code>boolean</code> | <code>true</code> | Whether or not last activities should be included. Defaults to true.                                                                                                 |
| [params.includePaused]  | <code>boolean</code> | <code>true</code> | Whether or not paused activities should be included. Defaults to true.                                                                                               |

**Example** _(Get current (in progress) activities for all clients)_

```js
server.getActivities({ includeLast: false }).then((data) => console.log(data));
```

**Example** _(Get current (in progress, skip paused) activities for all clients)_

```js
server
  .getActivities({ includeLast: false, includePaused: false })
  .then((data) => console.log(data));
```

**Example** _(Get last activities for all clients)_

```js
server
  .getActivities({ includeCurrent: false })
  .then((data) => console.log(data));
```

**Example** _(Get current (in progress) activities for a specific client only)_

```js
server
  .getActivities({ clientName: 'laptop1', includeLast: false })
  .then((data) => console.log(data));
server
  .getActivities({ clientId: 3, includeLast: false })
  .then((data) => console.log(data));
```

**Example** _(Get all activities for a specific client only)_

```js
server
  .getActivities({ clientName: 'laptop1' })
  .then((data) => console.log(data));
server.getActivities({ clientId: 3 }).then((data) => console.log(data));
```

<a name="UrbackupServer+getCurrentActivities"></a>

### urbackupServer.getCurrentActivities([params]) ⇒ <code>Promise.&lt;Array&gt;</code>

Retrieves a list of current (in progress) activities.
This is only a convenience method that wraps the `getActivities()` method.
Matches all clients by default, but `clientName` or `clientId` can be used to request activities for one particular client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - A promise that resolves to an array of current activities. Returns an empty array when no matching clients/activities are found.  
**Throws**:

- <code>Error</code> If the API response is missing values or if login fails.

| Param                  | Type                 | Default           | Description                                                                                                                                                          |
| ---------------------- | -------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [params]               | <code>object</code>  |                   | An optional object containing parameters.                                                                                                                            |
| [params.clientId]      | <code>number</code>  |                   | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |
| [params.clientName]    | <code>string</code>  |                   | The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.        |
| [params.includePaused] | <code>boolean</code> | <code>true</code> | Whether or not paused activities should be included. Defaults to true.                                                                                               |

**Example** _(Get current activities for all clients)_

```js
server.getCurrentActivities().then((data) => console.log(data));
```

**Example** _(Get current activities for all clients, skip paused activities)_

```js
server
  .getCurrentActivities({ includePaused: false })
  .then((data) => console.log(data));
```

**Example** _(Get current activities for a specific client only)_

```js
server
  .getCurrentActivities({ clientName: 'laptop1' })
  .then((data) => console.log(data));
server.getCurrentActivities({ clientId: 3 }).then((data) => console.log(data));
```

<a name="UrbackupServer+getLastActivities"></a>

### urbackupServer.getLastActivities([params]) ⇒ <code>Promise.&lt;Array&gt;</code>

Retrieves a list of last activities.
This is only a convenience method that wraps the `getActivities()` method.
Matches all clients by default, but `clientName` or `clientId` can be used to request activities for one particular client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - A promise that resolves to an array of last activities. Returns an empty array when no matching clients/activities are found.  
**Throws**:

- <code>Error</code> If the API response is missing values or if login fails.

| Param               | Type                | Description                                                                                                                                                          |
| ------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [params]            | <code>object</code> | An optional object containing parameters.                                                                                                                            |
| [params.clientId]   | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |
| [params.clientName] | <code>string</code> | The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.        |

**Example** _(Get last activities for all clients)_

```js
server.getLastActivities().then((data) => console.log(data));
```

**Example** _(Get last activities for a specific client only)_

```js
server
  .getLastActivities({ clientName: 'laptop1' })
  .then((data) => console.log(data));
server.getLastActivities({ clientId: 3 }).then((data) => console.log(data));
```

<a name="UrbackupServer+getPausedActivities"></a>

### urbackupServer.getPausedActivities([params]) ⇒ <code>Promise.&lt;Array&gt;</code>

Retrieves a list of paused activities.
Matches all clients by default, but `clientName` or `clientId` can be used to request paused activities for a particular client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - A promise that resolves to an array of paused activities. Returns an empty array when no matching clients/activities are found.  
**Throws**:

- <code>Error</code> If the API response is missing values or if login fails.

| Param               | Type                | Description                                                                                                                                                          |
| ------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [params]            | <code>object</code> | An optional object containing parameters.                                                                                                                            |
| [params.clientId]   | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |
| [params.clientName] | <code>string</code> | The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.        |

**Example** _(Get all paused activities)_

```js
server.getPausedActivities().then((data) => console.log(data));
```

**Example** _(Get paused activities for a specific client only)_

```js
server
  .getPausedActivities({ clientName: 'laptop1' })
  .then((data) => console.log(data));
server.getPausedActivities({ clientId: 3 }).then((data) => console.log(data));
```

<a name="UrbackupServer+stopActivity"></a>

### urbackupServer.stopActivity(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Stops one selected activity.
A list of current activities can be obtained with the `getActivities` method.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the activity was stopped successfully, or false if stopping was not successful.  
**Throws**:

- <code>Error</code> If there are missing or invalid parameters, if the API response is missing values, or if login fails.

| Param             | Type                | Description                                                                                                               |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| params            | <code>object</code> | An object containing parameters.                                                                                          |
| params.clientId   | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| params.clientName | <code>string</code> | The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.          |
| params.activityId | <code>number</code> | The activity ID. Required.                                                                                                |

**Example** _(Stop activity)_

```js
server
  .stopActivity({ clientName: 'laptop1', activityId: 42 })
  .then((data) => console.log(data));
server
  .stopActivity({ clientId: 3, activityId: 42 })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getBackups"></a>

### urbackupServer.getBackups(params) ⇒ <code>Promise.&lt;object&gt;</code>

Retrieves a list of file and/or image backups for a specific client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A promise that resolves to an object with backups info in two separate arrays (one for file and one for image backups). Returns an object with empty arrays when no matching clients/backups are found.  
**Throws**:

- <code>Error</code> If there are missing or invalid parameters, if the API response is missing values, or if login fails.

| Param                        | Type                 | Default           | Description                                                                                                               |
| ---------------------------- | -------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| params                       | <code>object</code>  |                   | An object containing parameters.                                                                                          |
| params.clientId              | <code>number</code>  |                   | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| params.clientName            | <code>string</code>  |                   | The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.          |
| [params.includeFileBackups]  | <code>boolean</code> | <code>true</code> | Whether or not file backups should be included. Defaults to true.                                                         |
| [params.includeImageBackups] | <code>boolean</code> | <code>true</code> | Whether or not image backups should be included. Defaults to true.                                                        |

**Example** _(Get all backups for a specific client)_

```js
server.getBackups({ clientName: 'laptop1' }).then((data) => console.log(data));
server.getBackups({ clientId: 3 }).then((data) => console.log(data));
```

**Example** _(Get image backups for a specific client)_

```js
server
  .getBackups({ clientName: 'laptop1', includeFileBackups: false })
  .then((data) => console.log(data));
```

**Example** _(Get file backups for a specific client)_

```js
server
  .getBackups({ clientName: 'laptop1', includeImageBackups: false })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+startFullFileBackup"></a>

### urbackupServer.startFullFileBackup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Starts a full file backup.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.  
**Throws**:

- <code>Error</code> If there are missing or invalid parameters.

| Param             | Type                | Description                                                                                                               |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| params            | <code>object</code> | An object containing parameters.                                                                                          |
| params.clientId   | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| params.clientName | <code>string</code> | The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.          |

**Example** _(Start a full file backup by client name)_

```js
server
  .startFullFileBackup({ clientName: 'laptop1' })
  .then((data) => console.log(data));
```

**Example** _(Start a full file backup by client ID)_

```js
server.startFullFileBackup({ clientId: 3 }).then((data) => console.log(data));
```

<a name="UrbackupServer+startIncrementalFileBackup"></a>

### urbackupServer.startIncrementalFileBackup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Starts an incremental file backup.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.  
**Throws**:

- <code>Error</code> If there are missing or invalid parameters.

| Param             | Type                | Description                                                                                                               |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| params            | <code>object</code> | An object containing parameters.                                                                                          |
| params.clientId   | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| params.clientName | <code>string</code> | The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.          |

**Example** _(Start an incremental file backup by client name)_

```js
server
  .startIncrementalFileBackup({ clientName: 'laptop1' })
  .then((data) => console.log(data));
```

**Example** _(Start an incremental file backup by client ID)_

```js
server
  .startIncrementalFileBackup({ clientId: 3 })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+startFullImageBackup"></a>

### urbackupServer.startFullImageBackup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Starts a full image backup.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.  
**Throws**:

- <code>Error</code> If there are missing or invalid parameters.

| Param             | Type                | Description                                                                                                               |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| params            | <code>object</code> | An object containing parameters.                                                                                          |
| params.clientId   | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| params.clientName | <code>string</code> | The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.          |

**Example** _(Start a full image backup by client name)_

```js
server
  .startFullImageBackup({ clientName: 'laptop1' })
  .then((data) => console.log(data));
```

**Example** _(Start a full image backup by client ID)_

```js
server.startFullImageBackup({ clientId: 3 }).then((data) => console.log(data));
```

<a name="UrbackupServer+startIncrementalImageBackup"></a>

### urbackupServer.startIncrementalImageBackup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Starts an incremental image backup.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.  
**Throws**:

- <code>Error</code> If there are missing or invalid parameters.

| Param             | Type                | Description                                                                                                               |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| params            | <code>object</code> | An object containing parameters.                                                                                          |
| params.clientId   | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| params.clientName | <code>string</code> | The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.          |

**Example** _(Start an incremental image backup by client name)_

```js
server
  .startIncrementalImageBackup({ clientName: 'laptop1' })
  .then((data) => console.log(data));
```

**Example** _(Start an incremental image backup by client ID)_

```js
server
  .startIncrementalImageBackup({ clientId: 3 })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getLiveLog"></a>

### urbackupServer.getLiveLog([params]) ⇒ <code>Promise.&lt;Array&gt;</code>

Retrieves live logs.
Server logs are requested by default, but `clientName` or `clientId` can be used to request logs for one particular client.
Instance property is used internally to keep track of log entries that were previously requested.
When `recentOnly` is set to true, only recent (unfetched) logs are requested.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - A promise that resolves to an array of objects representing log entries. Returns an empty array when no matching clients or logs are found.  
**Throws**:

- <code>Error</code> If there is an API response error or login failure.

| Param               | Type                 | Default            | Description                                                                                                                                                                                                     |
| ------------------- | -------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [params]            | <code>object</code>  |                    | An optional object containing parameters.                                                                                                                                                                       |
| [params.clientId]   | <code>number</code>  |                    | The client's ID. Must be greater than zero. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which means server logs will be requested if `clientId` is also undefined. |
| [params.clientName] | <code>string</code>  |                    | The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which means server logs will be requested if `clientName` is also undefined.                                 |
| [params.recentOnly] | <code>boolean</code> | <code>false</code> | Whether only recent (unfetched) entries should be requested. Defaults to false.                                                                                                                                 |

**Example** _(Get server logs)_

```js
server.getLiveLog().then((data) => console.log(data));
```

**Example** _(Get logs for a specific client only)_

```js
server.getLiveLog({ clientName: 'laptop1' }).then((data) => console.log(data));
server.getLiveLog({ clientId: 3 }).then((data) => console.log(data));
```

**Example** _(Get logs for a specific client only, but skip previously fetched logs)_

```js
server
  .getLiveLog({ clientName: 'laptop1', recentOnly: true })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getGeneralSettings"></a>

### urbackupServer.getGeneralSettings() ⇒ <code>Promise.&lt;object&gt;</code>

Retrieves general settings.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A promise that resolves to an object with general settings.  
**Throws**:

- <code>Error</code> If there is an API response error or login failure.

**Example** _(Get general settings)_

```js
server.getGeneralSettings().then((data) => console.log(data));
```

<a name="UrbackupServer+getMailSettings"></a>

### urbackupServer.getMailSettings() ⇒ <code>Promise.&lt;object&gt;</code>

Retrieves mail settings.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A promise that resolves to an object with mail settings.  
**Throws**:

- <code>Error</code> If there is an API response error or login failure.

**Example** _(Get mail settings)_

```js
server.getMailSettings().then((data) => console.log(data));
```

<a name="UrbackupServer+getLdapSettings"></a>

### urbackupServer.getLdapSettings() ⇒ <code>Promise.&lt;object&gt;</code>

Retrieves LDAP settings.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A promise that resolves to an object with LDAP settings.  
**Throws**:

- <code>Error</code> If there is an API response error or login failure.

**Example** _(Get LDAP settings)_

```js
server.getLdapSettings().then((data) => console.log(data));
```

<a name="UrbackupServer+setGeneralSettings"></a>

### urbackupServer.setGeneralSettings(params) ⇒ <code>Promise.&lt;boolean&gt;</code>

Changes one specific element of general settings.
A list of settings can be obtained with the `getGeneralSettings` method.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true when the settings change is successful, and false if the save request was unsuccessful or the key/value is invalid.  
**Throws**:

- <code>Error</code> If there is a syntax error, API response error, or login failure.

| Param           | Type                                                               | Description                             |
| --------------- | ------------------------------------------------------------------ | --------------------------------------- |
| params          | <code>object</code>                                                | An object containing parameters.        |
| params.key      | <code>string</code>                                                | The settings element to change.         |
| params.newValue | <code>string</code> \| <code>number</code> \| <code>boolean</code> | The new value for the settings element. |

**Example** _(Disable image backups)_

```js
server
  .setGeneralSettings({ key: 'no_images', newValue: true })
  .then((data) => console.log(data));
```

<a name="UrbackupServer+getRawStatus"></a>

### urbackupServer.getRawStatus() ⇒ <code>Promise.&lt;object&gt;</code>

Retrieves the raw response from the 'status' API call.
Property names and values are left unaltered.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A promise that resolves to the raw status response object.  
**Throws**:

- <code>Error</code> If the login fails.

**Example**

```js
urbackup.getRawStatus().then((data) => console.log(data));
```

<a name="UrbackupServer+getRawUsage"></a>

### urbackupServer.getRawUsage() ⇒ <code>Promise.&lt;object&gt;</code>

Retrieves the raw response from the 'usage' API call.
Property names and values are left unaltered.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A promise that resolves to the raw usage response object.  
**Throws**:

- <code>Error</code> If the login fails.

**Example**

```js
const data = await urbackup.getRawUsage();
```

<a name="UrbackupServer+getRawProgress"></a>

### urbackupServer.getRawProgress() ⇒ <code>Promise.&lt;object&gt;</code>

Retrieves the raw response from the 'progress' API call.
Property names and values are left unaltered.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A promise that resolves to the raw progress response object.  
**Throws**:

- <code>Error</code> If the login fails.

**Example**

```js
const data = await urbackup.getRawProgress();
```
