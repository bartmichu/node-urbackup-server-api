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

*Please note that this module is still under active development. While most public method signatures are stable, some functionality might be missing or subject to change. Always check the CHANGELOG.md file before updating to understand any potential breaking changes.*

## Requirements

To use this module, ensure you have the following:

  - Node.js: An Active LTS or Maintenance LTS version (https://nodejs.org/en/about/previous-releases)
  - UrBackup Server: A current release of the UrBackup Server

## Installation

To install the module, use npm:

```shell
npm install urbackup-server-api
```

## Usage Example

Here's a basic example to get you started. A script to display the names of clients with failed file backups:

```javascript
const { UrbackupServer } = require('urbackup-server-api');

// When troubleshooting TSL connections with self-signed certificates you may try to disable certificate validation. Keep in mind that it's strongly discouraged for production use.
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const server = new UrbackupServer({ url: 'http://127.0.0.1:55414', username: 'admin', password: 'secretpassword' });

(async () => {
  try {
    const allClients = await server.getStatus();

    console.log('Clients with failed file backups:');

    allClients.filter(client => client.file_ok === false)
      .forEach(client => console.log(client.name));
  } catch (error) {
    // Deal with it
  }
})();
```

---

## Below is an automatically generated reference from JSDoc.

<a name="UrbackupServer"></a>

## UrbackupServer
Represents a UrBackup Server.

**Kind**: global class  

* [UrbackupServer](#UrbackupServer)
    * [new UrbackupServer([params])](#new_UrbackupServer_new)
    * [.getServerIdentity()](#UrbackupServer+getServerIdentity) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.getUsers()](#UrbackupServer+getUsers) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [.getGroups()](#UrbackupServer+getGroups) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [.addGroup(params)](#UrbackupServer+addGroup) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.removeGroup(params)](#UrbackupServer+removeGroup) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.getGroupMembers(params)](#UrbackupServer+getGroupMembers) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [.getClients([params])](#UrbackupServer+getClients) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [.addClient(params)](#UrbackupServer+addClient) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.removeClient(params)](#UrbackupServer+removeClient) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.cancelRemoveClient(params)](#UrbackupServer+cancelRemoveClient) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.getClientHints()](#UrbackupServer+getClientHints) ⇒ <code>Promise.&lt;Array&gt;</code>
    * [.addClientHint(params)](#UrbackupServer+addClientHint) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.removeClientHint(params)](#UrbackupServer+removeClientHint) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.getClientSettings([params])](#UrbackupServer+getClientSettings) ⇒ <code>Promise.&lt;Array&gt;</code>
    * [.setClientSettings(params)](#UrbackupServer+setClientSettings) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.getClientAuthkey(params)](#UrbackupServer+getClientAuthkey) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.getStatus([params])](#UrbackupServer+getStatus) ⇒ <code>Promise.&lt;Array&gt;</code>
    * [.getUsage([params])](#UrbackupServer+getUsage) ⇒ <code>Promise.&lt;Array&gt;</code>
    * [.getActivities([params])](#UrbackupServer+getActivities) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.getCurrentActivities([params])](#UrbackupServer+getCurrentActivities) ⇒ <code>Promise.&lt;Array&gt;</code>
    * [.getLastActivities([params])](#UrbackupServer+getLastActivities) ⇒ <code>Promise.&lt;Array&gt;</code>
    * [.stopActivity(params)](#UrbackupServer+stopActivity) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.getBackups(params)](#UrbackupServer+getBackups) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.startFullFileBackup(params)](#UrbackupServer+startFullFileBackup) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.startIncrementalFileBackup(params)](#UrbackupServer+startIncrementalFileBackup) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.startFullImageBackup(params)](#UrbackupServer+startFullImageBackup) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.startIncrementalImageBackup(params)](#UrbackupServer+startIncrementalImageBackup) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.getLiveLog([params])](#UrbackupServer+getLiveLog) ⇒ <code>Promise.&lt;Array&gt;</code>
    * [.getGeneralSettings()](#UrbackupServer+getGeneralSettings) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.getMailSettings()](#UrbackupServer+getMailSettings) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.getLdapSettings()](#UrbackupServer+getLdapSettings) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.setGeneralSettings(params)](#UrbackupServer+setGeneralSettings) ⇒ <code>Promise.&lt;boolean&gt;</code>

<a name="new_UrbackupServer_new"></a>

### new UrbackupServer([params])
This is a constructor.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [params] | <code>object</code> | <code>{}</code> | An object containing parameters. |
| [params.url] | <code>string</code> | <code>&quot;&#x27;http://127.0.0.1:55414&#x27;&quot;</code> | The URL of the server, must include the protocol, hostname, and port. If not specified, it will default to http://127.0.0.1:55414. |
| [params.username] | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code> | The username used for logging in. If empty, anonymous login method will be used. The default value is an empty string. |
| [params.password] | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code> | The password used to log in. The default value is an empty string. |

**Example** *(Connect to the built-in server locally without a password)*  
```js
const server = new UrbackupServer();
```
**Example** *(Connect locally with a specified password)*  
```js
const server = new UrbackupServer({ url: 'http://127.0.0.1:55414', username: 'admin', password: 'secretpassword' });
```
**Example** *(Connect over the network)*  
```js
const server = new UrbackupServer({ url: 'https://192.168.0.2:443', username: 'admin', password: 'secretpassword' });
```
<a name="UrbackupServer+getServerIdentity"></a>

### urbackupServer.getServerIdentity() ⇒ <code>Promise.&lt;string&gt;</code>
Retrieves server identity.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;string&gt;</code> - The server identity.  
**Throws**:

- <code>Error</code> If the API response is missing required values or if the login fails.

**Example** *(Get server identity)*  
```js
server.getServerIdentity().then(data => console.log(data));
```
<a name="UrbackupServer+getUsers"></a>

### urbackupServer.getUsers() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Retrieves a list of users.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing users. If no users are found, it returns an empty array.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

**Example** *(Get all users)*  
```js
server.getUsers().then(data => console.log(data));
```
<a name="UrbackupServer+getGroups"></a>

### urbackupServer.getGroups() ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Retrieves a list of groups.
By default, UrBackup clients are added to a group with ID 0 and an empty name (empty string).

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - A promise that resolves to an array of objects representing groups. If no groups are found, it returns an empty array.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.

**Example** *(Get all groups)*  
```js
server.getGroups().then(data => console.log(data));
```
<a name="UrbackupServer+addGroup"></a>

### urbackupServer.addGroup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Adds a new group.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. If the group already exists, or adding the group was not successful for any reason, returns false.  
**Throws**:

- <code>Error</code> If the groupName is missing or invalid, or if the API response is missing expected values.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| params.groupName | <code>string</code> | The group name, case-sensitive. Must be unique and cannot be an empty string. By default, UrBackup clients are added to a group with ID 0 and name '' (empty string). Defaults to undefined. |

**Example** *(Add new group)*  
```js
server.addGroup({ groupName: 'prod' }).then(data => console.log(data));
```
<a name="UrbackupServer+removeGroup"></a>

### urbackupServer.removeGroup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Removes a group.
All clients in this group will be reassigned to the default group. Does not allow removal of the default group (ID: 0, name: '').
The use of group ID is preferred over group name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When the removal is successful, the method returns true. If the removal is not successful, the method returns false.  
**Throws**:

- <code>Error</code> If both `groupId` and `groupName` are missing or invalid, or if the login fails.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| [params.groupId] | <code>number</code> | Group ID. Must be greater than 0. Takes precedence if both `groupId` and `groupName` are defined. |
| [params.groupName] | <code>string</code> | Group name, case-sensitive. Must be different than '' (empty string). Ignored if both `groupId` and `groupName` are defined. |

**Example** *(Remove group)*  
```js
server.removeGroup({ groupId: 1 }).then(data => console.log(data));
server.removeGroup({ groupName: 'prod' }).then(data => console.log(data));
```
<a name="UrbackupServer+getGroupMembers"></a>

### urbackupServer.getGroupMembers(params) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Retrieves a list of clients who are members of a given group.
This is only a convenience method that wraps the `getClients()` method.
The use of group name is preferred over group name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - An array of objects representing clients matching the search criteria. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If both `groupId` and `groupName` are missing or invalid.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| [params.groupId] | <code>number</code> | Group ID. Ignored if both `groupId` and `groupName` are defined. |
| [params.groupName] | <code>string</code> | Group name, case-sensitive. Takes precedence if both `groupId` and `groupName` are defined. |

**Example** *(Get members of default group)*  
```js
server.getGroupMembers({ groupId: 0 }).then(data => console.log(data));
```
**Example** *(Get all clients belonging to a specific group)*  
```js
server.getGroupMembers({ groupName: 'office' }).then(data => console.log(data));
```
<a name="UrbackupServer+getClients"></a>

### urbackupServer.getClients([params]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Retrieves a list of clients.
By default, this method matches all clients, including those marked for removal.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - An array of objects representing clients matching the search criteria. Returns an empty array when no matching clients are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is missing expected values.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [params] | <code>object</code> |  | An optional object containing parameters. |
| [params.groupName] | <code>string</code> |  | Group name, case-sensitive. By default, UrBackup clients are added to group ID 0 with name '' (empty string). Defaults to undefined, which matches all groups. |
| [params.includeRemoved] | <code>boolean</code> | <code>true</code> | Whether or not clients pending deletion should be included. Defaults to true. |

**Example** *(Get all clients)*  
```js
server.getClients().then(data => console.log(data));
```
**Example** *(Get all clients, but exclude clients marked for removal)*  
```js
server.getClients({ includeRemoved: false }).then(data => console.log(data));
```
**Example** *(Get all clients belonging to a specific group)*  
```js
server.getClients({ groupName: 'office' }).then(data => console.log(data));
```
<a name="UrbackupServer+addClient"></a>

### urbackupServer.addClient(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Adds a new client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. If adding the client was not successful, for example if the client already exists, returns false.  
**Throws**:

- <code>Error</code> If the clientName is missing or invalid, if the login fails, or if the API response is missing expected values.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| params.clientName | <code>string</code> | The client's name, case-sensitive. |

**Example** *(Add new client)*  
```js
server.addClient({ clientName: 'laptop2' }).then(data => console.log(data));
```
<a name="UrbackupServer+removeClient"></a>

### urbackupServer.removeClient(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Marks the client for removal.
Actual removal occurs during the cleanup time window. Until then, this operation can be reversed with the `cancelRemoveClient` method.
The use of client ID is preferred over client name for repeated method calls.
**WARNING:** Removing clients will also delete all their backups stored on the UrBackup server.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. Returns false if the removal was not successful.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> | Client's ID. If both `clientId` and `clientName` are defined, the ID takes precedence. Defaults to undefined. |
| [params.clientName] | <code>string</code> | Client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined. |

**Example** *(Remove client by ID)*  
```js
server.removeClient({ clientId: 1 }).then(data => console.log(data));
```
**Example** *(Remove client by name)*  
```js
server.removeClient({ clientName: 'laptop2' }).then(data => console.log(data));
```
<a name="UrbackupServer+cancelRemoveClient"></a>

### urbackupServer.cancelRemoveClient(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Unmarks the client as ready for removal.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. Returns false if the stopping process was not successful.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> | Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined. |
| [params.clientName] | <code>string</code> | Client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined. |

**Example** *(Stop the server from removing a client by ID)*  
```js
server.cancelRemoveClient({ clientId: 1 }).then(data => console.log(data));
```
**Example** *(Stop the server from removing a client by name)*  
```js
server.cancelRemoveClient({ clientName: 'laptop2' }).then(data => console.log(data));
```
<a name="UrbackupServer+getClientHints"></a>

### urbackupServer.getClientHints() ⇒ <code>Promise.&lt;Array&gt;</code>
Retrieves a list of client discovery hints, which are also known as extra clients.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - Array of objects representing client hints. Returns an empty array when no matching client hints are found.  
**Throws**:

- <code>Error</code> If the login fails or the API response is incorrect.

**Example** *(Get extra clients)*  
```js
server.getClientHints().then(data => console.log(data));
```
<a name="UrbackupServer+addClientHint"></a>

### urbackupServer.addClientHint(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Adds a new client discovery hint, also known as an extra client.
Discovery hints are a way of improving client discovery in local area networks.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. Returns false when adding was not successful.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid, or if the API response is incorrect.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| params.address | <code>string</code> | Client's IP address or hostname, case sensitive. |

**Example** *(Add new extra client)*  
```js
server.addClientHint({ address: '192.168.100.200' }).then(data => console.log(data));
```
<a name="UrbackupServer+removeClientHint"></a>

### urbackupServer.removeClientHint(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Removes a specific client discovery hint, also known as an extra client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. Returns false when removing was not successful.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid, or if the API response is incorrect.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| params.address | <code>string</code> | Client's IP address or hostname, case sensitive. |

**Example** *(Remove extra client)*  
```js
server.removeClientHint({ address: '192.168.100.200' }).then(data => console.log(data));
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


| Param | Type | Description |
| --- | --- | --- |
| [params] | <code>object</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> | Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined. |
| [params.clientName] | <code>string</code> | Client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |

**Example** *(Get settings for all clients)*  
```js
server.getClientSettings().then(data => console.log(data));
```
**Example** *(Get settings for a specific client only)*  
```js
server.getClientSettings({ clientName: 'laptop1' }).then(data => console.log(data));
server.getClientSettings({ clientId: 3 }).then(data => console.log(data));
```
<a name="UrbackupServer+setClientSettings"></a>

### urbackupServer.setClientSettings(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Changes one specific element of client settings.
A list of settings can be obtained with the `getClientSettings` method.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - When successful, returns true. Returns false when the save request was unsuccessful or if the key/value is invalid.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid, or if the API response is incorrect.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> | Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined. |
| [params.clientName] | <code>string</code> | Client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined. |
| params.key | <code>string</code> | Settings element to change. |
| params.newValue | <code>string</code> \| <code>number</code> \| <code>boolean</code> | New value for settings element. |

**Example** *(Set directories to backup to be optional by default)*  
```js
server.setClientSettings({ clientName: 'laptop1', key: 'backup_dirs_optional', newValue: true }).then(data => console.log(data));
server.setClientSettings({ clientId: 3, key: 'backup_dirs_optional', newValue: true }).then(data => console.log(data));
```
<a name="UrbackupServer+getClientAuthkey"></a>

### urbackupServer.getClientAuthkey(params) ⇒ <code>Promise.&lt;string&gt;</code>
Retrieves the authentication key for a specified client.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;string&gt;</code> - Client's authentication key. Returns an empty string if no matching clients are found.  
**Throws**:

- <code>Error</code> If parameters are missing or invalid, or if the API response is incorrect.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> | Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined. |
| [params.clientName] | <code>string</code> | Client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined. |

**Example** *(Get authentication key for a specific client)*  
```js
server.getClientAuthkey({ clientName: 'laptop1' }).then(data => console.log(data));
server.getClientAuthkey({ clientId: 3 }).then(data => console.log(data));
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


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [params] | <code>object</code> |  | An object containing parameters. |
| [params.clientId] | <code>number</code> |  | Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |
| [params.clientName] | <code>string</code> |  | Client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined. |
| [params.includeRemoved] | <code>boolean</code> | <code>true</code> | Whether or not clients pending deletion should be included. Defaults to true. |

**Example** *(Get status for all clients)*  
```js
server.getStatus().then(data => console.log(data));
```
**Example** *(Get status for all clients, but skip clients marked for removal)*  
```js
server.getStatus({ includeRemoved: false }).then(data => console.log(data));
```
**Example** *(Get status for a specific client only)*  
```js
server.getStatus({ clientName: 'laptop1' }).then(data => console.log(data));
server.getStatus({ clientId: 3 }).then(data => console.log(data));
```
<a name="UrbackupServer+getUsage"></a>

### urbackupServer.getUsage([params]) ⇒ <code>Promise.&lt;Array&gt;</code>
Retrieves storage usage.
By default, it matches all clients, but you can use clientName or clientId to request usage for a particular client.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - A promise that resolves to an array of objects with storage usage info for each client. Resolves to an empty array if no matching clients are found.  
**Throws**:

- <code>Error</code> If the API response is missing values or if login fails.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [params] | <code>object</code> | <code>{}</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> |  | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined. |
| [params.clientName] | <code>string</code> |  | The client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |

**Example** *(Get usage for all clients)*  
```js
server.getUsage().then(data => console.log(data));
```
**Example** *(Get usage for a specific client only)*  
```js
server.getUsage({ clientName: 'laptop1' }).then(data => console.log(data));
server.getUsage({ clientId: 3 }).then(data => console.log(data));
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


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [params] | <code>object</code> | <code>{}</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> |  | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |
| [params.clientName] | <code>string</code> |  | The client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |
| [params.includeCurrent] | <code>boolean</code> | <code>true</code> | Whether or not currently running activities should be included. Defaults to true. |
| [params.includeLast] | <code>boolean</code> | <code>true</code> | Whether or not last activities should be included. Defaults to true. |

**Example** *(Get current (in progress) activities for all clients)*  
```js
server.getActivities({ includeLast: false }).then(data => console.log(data));
```
**Example** *(Get last activities for all clients)*  
```js
server.getActivities({ includeCurrent: false }).then(data => console.log(data));
```
**Example** *(Get current (in progress) activities for a specific client only)*  
```js
server.getActivities({ clientName: 'laptop1', includeLast: false }).then(data => console.log(data));
server.getActivities({ clientId: 3, includeLast: false }).then(data => console.log(data));
```
**Example** *(Get all activities for a specific client only)*  
```js
server.getActivities({ clientName: 'laptop1' }).then(data => console.log(data));
server.getActivities({ clientId: 3 }).then(data => console.log(data));
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


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [params] | <code>object</code> | <code>{}</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> |  | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |
| [params.clientName] | <code>string</code> |  | The client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |

**Example** *(Get current activities for all clients)*  
```js
server.getCurrentActivities().then(data => console.log(data));
```
**Example** *(Get current activities for a specific client only)*  
```js
server.getCurrentActivities({ clientName: 'laptop1' }).then(data => console.log(data));
server.getCurrentActivities({ clientId: 3 }).then(data => console.log(data));
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


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [params] | <code>object</code> | <code>{}</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> |  | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |
| [params.clientName] | <code>string</code> |  | The client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined. |

**Example** *(Get last activities for all clients)*  
```js
server.getLastActivities().then(data => console.log(data));
```
**Example** *(Get last activities for a specific client only)*  
```js
server.getLastActivities({ clientName: 'laptop1' }).then(data => console.log(data));
server.getLastActivities({ clientId: 3 }).then(data => console.log(data));
```
<a name="UrbackupServer+stopActivity"></a>

### urbackupServer.stopActivity(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Stops one activity.
A list of current activities can be obtained with the `getActivities` method.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the activity was stopped successfully, or false if stopping was not successful.  
**Throws**:

- <code>Error</code> If there are missing or invalid parameters, if the API response is missing values, or if login fails.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| [params.clientName] | <code>string</code> | The client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined. |
| params.activityId | <code>number</code> | The activity ID. Required. |

**Example** *(Stop activity)*  
```js
server.stopActivity({ clientName: 'laptop1', activityId: 42 }).then(data => console.log(data));
server.stopActivity({ clientId: 3, activityId: 42 }).then(data => console.log(data));
```
<a name="UrbackupServer+getBackups"></a>

### urbackupServer.getBackups(params) ⇒ <code>Promise.&lt;object&gt;</code>
Retrieves a list of file and/or image backups for a specific client.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A promise that resolves to an object with backups info. Returns an object with empty arrays when no matching clients/backups are found.  
**Throws**:

- <code>Error</code> If there are missing or invalid parameters, if the API response is missing values, or if login fails.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params | <code>object</code> |  | An object containing parameters. |
| [params.clientId] | <code>number</code> |  | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| [params.clientName] | <code>string</code> |  | The client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined. |
| [params.includeFileBackups] | <code>boolean</code> | <code>true</code> | Whether or not file backups should be included. Defaults to true. |
| [params.includeImageBackups] | <code>boolean</code> | <code>true</code> | Whether or not image backups should be included. Defaults to true. |

**Example** *(Get all backups for a specific client)*  
```js
server.getBackups({ clientName: 'laptop1' }).then(data => console.log(data));
server.getBackups({ clientId: 3 }).then(data => console.log(data));
```
**Example** *(Get image backups for a specific client)*  
```js
server.getBackups({ clientName: 'laptop1', includeFileBackups: false }).then(data => console.log(data));
```
**Example** *(Get file backups for a specific client)*  
```js
server.getBackups({ clientName: 'laptop1', includeImageBackups: false }).then(data => console.log(data));
```
<a name="UrbackupServer+startFullFileBackup"></a>

### urbackupServer.startFullFileBackup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Starts a full file backup.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.  
**Throws**:

- <code>Error</code> If there are missing or invalid parameters.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| [params.clientName] | <code>string</code> | The client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined. |

**Example** *(Start a full file backup by client name)*  
```js
server.startFullFileBackup({clientName: 'laptop1'}).then(data => console.log(data));
```
**Example** *(Start a full file backup by client ID)*  
```js
server.startFullFileBackup({clientId: 3}).then(data => console.log(data));
```
<a name="UrbackupServer+startIncrementalFileBackup"></a>

### urbackupServer.startIncrementalFileBackup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Starts an incremental file backup.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.  
**Throws**:

- <code>Error</code> If there are missing or invalid parameters.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| [params.clientName] | <code>string</code> | The client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined. |

**Example** *(Start an incremental file backup by client name)*  
```js
server.startIncrementalFileBackup({clientName: 'laptop1'}).then(data => console.log(data));
```
**Example** *(Start an incremental file backup by client ID)*  
```js
server.startIncrementalFileBackup({clientId: 3}).then(data => console.log(data));
```
<a name="UrbackupServer+startFullImageBackup"></a>

### urbackupServer.startFullImageBackup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Starts a full image backup.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.  
**Throws**:

- <code>Error</code> If there are missing or invalid parameters.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| [params.clientName] | <code>string</code> | The client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined. |

**Example** *(Start a full image backup by client name)*  
```js
server.startFullImageBackup({clientName: 'laptop1'}).then(data => console.log(data));
```
**Example** *(Start a full image backup by client ID)*  
```js
server.startFullImageBackup({clientId: 3}).then(data => console.log(data));
```
<a name="UrbackupServer+startIncrementalImageBackup"></a>

### urbackupServer.startIncrementalImageBackup(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Starts an incremental image backup.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.  
**Throws**:

- <code>Error</code> If there are missing or invalid parameters.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | An object containing parameters. |
| [params.clientId] | <code>number</code> | The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined. |
| [params.clientName] | <code>string</code> | The client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined. |

**Example** *(Start an incremental image backup by client name)*  
```js
server.startIncrementalImageBackup({ clientName: 'laptop1' }).then(data => console.log(data));
```
**Example** *(Start an incremental image backup by client ID)*  
```js
server.startIncrementalImageBackup({ clientId: 3 }).then(data => console.log(data));
```
<a name="UrbackupServer+getLiveLog"></a>

### urbackupServer.getLiveLog([params]) ⇒ <code>Promise.&lt;Array&gt;</code>
Retrieves live logs.
Server logs are requested by default, but `clientName` or `clientId` can be used to request logs for a particular client.
Instance property is used internally to keep track of log entries that were previously requested.
When `recentOnly` is set to true, only recent (unfetched) logs are requested.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - A promise that resolves to an array of objects representing log entries. Returns an empty array when no matching clients or logs are found.  
**Throws**:

- <code>Error</code> If there is an API response error or login failure.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [params] | <code>object</code> |  | An object containing parameters. |
| [params.clientId] | <code>number</code> |  | The client's ID. Must be greater than zero. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which means server logs will be requested if `clientId` is also undefined. |
| [params.clientName] | <code>string</code> |  | The client's name, case sensitive. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which means server logs will be requested if `clientName` is also undefined. |
| [params.recentOnly] | <code>boolean</code> | <code>false</code> | Whether only recent (unfetched) entries should be requested. Defaults to false. |

**Example** *(Get server logs)*  
```js
server.getLiveLog().then(data => console.log(data));
```
**Example** *(Get logs for a specific client only)*  
```js
server.getLiveLog({ clientName: 'laptop1' }).then(data => console.log(data));
server.getLiveLog({ clientId: 3 }).then(data => console.log(data));
```
**Example** *(Get logs for a specific client only, but skip previously fetched logs)*  
```js
server.getLiveLog({ clientName: 'laptop1', recentOnly: true }).then(data => console.log(data));
```
<a name="UrbackupServer+getGeneralSettings"></a>

### urbackupServer.getGeneralSettings() ⇒ <code>Promise.&lt;object&gt;</code>
Retrieves general settings.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A promise that resolves to an object with general settings.  
**Throws**:

- <code>Error</code> If there is an API response error or login failure.

**Example** *(Get general settings)*  
```js
server.getGeneralSettings().then(data => console.log(data));
```
<a name="UrbackupServer+getMailSettings"></a>

### urbackupServer.getMailSettings() ⇒ <code>Promise.&lt;object&gt;</code>
Retrieves mail settings.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A promise that resolves to an object with mail settings.  
**Throws**:

- <code>Error</code> If there is an API response error or login failure.

**Example** *(Get mail settings)*  
```js
server.getMailSettings().then(data => console.log(data));
```
<a name="UrbackupServer+getLdapSettings"></a>

### urbackupServer.getLdapSettings() ⇒ <code>Promise.&lt;object&gt;</code>
Retrieves LDAP settings.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;object&gt;</code> - A promise that resolves to an object with LDAP settings.  
**Throws**:

- <code>Error</code> If there is an API response error or login failure.

**Example** *(Get LDAP settings)*  
```js
server.getLdapSettings().then(data => console.log(data));
```
<a name="UrbackupServer+setGeneralSettings"></a>

### urbackupServer.setGeneralSettings(params) ⇒ <code>Promise.&lt;boolean&gt;</code>
Changes one specific element of general settings.
A list of settings can be obtained with the `getGeneralSettings` method.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - A promise that resolves to true when the settings change is successful, and false if the save request was unsuccessful or the key/value is invalid.  
**Throws**:

- <code>Error</code> If there is a syntax error, API response error, or login failure.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.key | <code>string</code> | (Required) The settings element to change. |
| params.newValue | <code>string</code> \| <code>number</code> \| <code>boolean</code> | (Required) The new value for the settings element. |

**Example** *(Disable image backups)*  
```js
server.setGeneralSettings({ key: 'no_images', newValue: true }).then(data => console.log(data));
```
