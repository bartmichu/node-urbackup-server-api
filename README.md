# node-urbackup-server-api

Node.js wrapper for [UrBackup](https://www.urbackup.org/) server web API.

You can use it to interact with UrBackup server installed locally or over the network. It allows you to view and modify settings, add or remove clients, get information about running tasks, clients status, backup jobs, start or stop backups and more.

*Please note that this code is still a work in progress - some functionality is missing. Non-private method signatures are unlikely to change but it is possible. Please read the CHANGELOG.txt before updating to prepare for possible breaking changes.*

Requirements:
- Active LTS or Maintenance LTS version of Node.js (<https://nodejs.org/en/about/previous-releases>)

Installation:

```shell
npm install urbackup-server-api
```

Example script implementing this module, used to display the names of clients with failed file backups:

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

<a name="UrbackupServer"></a>

## UrbackupServer
Represents a UrBackup Server.

**Kind**: global class  

* [UrbackupServer](#UrbackupServer)
    * [new UrbackupServer(params)](#new_UrbackupServer_new)
    * [.getServerIdentity()](#UrbackupServer+getServerIdentity) ⇒ <code>string</code>
    * [.getUsers()](#UrbackupServer+getUsers) ⇒ <code>Array</code>
    * [.getGroups()](#UrbackupServer+getGroups) ⇒ <code>Array</code>
    * [.addGroup(params)](#UrbackupServer+addGroup) ⇒ <code>boolean</code>
    * [.removeGroup(params)](#UrbackupServer+removeGroup) ⇒ <code>boolean</code>
    * [.getGroupMembers(params)](#UrbackupServer+getGroupMembers) ⇒ <code>Array</code>
    * [.getClients(params)](#UrbackupServer+getClients) ⇒ <code>Array</code>
    * [.addClient(params)](#UrbackupServer+addClient) ⇒ <code>boolean</code>
    * [.removeClient(params)](#UrbackupServer+removeClient) ⇒ <code>boolean</code>
    * [.cancelRemoveClient(params)](#UrbackupServer+cancelRemoveClient) ⇒ <code>boolean</code>
    * [.getClientHints()](#UrbackupServer+getClientHints) ⇒ <code>Array</code>
    * [.addClientHint(params)](#UrbackupServer+addClientHint) ⇒ <code>boolean</code>
    * [.removeClientHint(params)](#UrbackupServer+removeClientHint) ⇒ <code>boolean</code>
    * [.getClientSettings(params)](#UrbackupServer+getClientSettings) ⇒ <code>Array</code>
    * [.setClientSettings(params)](#UrbackupServer+setClientSettings) ⇒ <code>boolean</code>
    * [.getClientAuthkey(params)](#UrbackupServer+getClientAuthkey) ⇒ <code>string</code>
    * [.getStatus(params)](#UrbackupServer+getStatus) ⇒ <code>Array</code>
    * [.getUsage(params)](#UrbackupServer+getUsage) ⇒ <code>Array</code>
    * [.getActivities(params)](#UrbackupServer+getActivities) ⇒ <code>object</code>
    * [.stopActivity(params)](#UrbackupServer+stopActivity) ⇒ <code>boolean</code>
    * [.getBackups(params)](#UrbackupServer+getBackups) ⇒ <code>object</code>
    * [.startFullFileBackup(params)](#UrbackupServer+startFullFileBackup) ⇒ <code>boolean</code>
    * [.startIncrementalFileBackup(params)](#UrbackupServer+startIncrementalFileBackup) ⇒ <code>boolean</code>
    * [.startFullImageBackup(params)](#UrbackupServer+startFullImageBackup) ⇒ <code>boolean</code>
    * [.startIncrementalImageBackup(params)](#UrbackupServer+startIncrementalImageBackup) ⇒ <code>boolean</code>
    * [.getLiveLog(params)](#UrbackupServer+getLiveLog) ⇒ <code>Array</code>
    * [.getGeneralSettings()](#UrbackupServer+getGeneralSettings) ⇒ <code>object</code>
    * [.setGeneralSettings(params)](#UrbackupServer+setGeneralSettings) ⇒ <code>boolean</code>

<a name="new_UrbackupServer_new"></a>

### new UrbackupServer(params)
This is a constructor.


| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Optional) An object containing parameters. |
| params.url | <code>string</code> | (Optional) The URL of the server, must include the protocol, hostname, and port. If not specified, it will default to http://127.0.0.1:55414. |
| params.username | <code>string</code> | (Optional) The username used for logging in. If empty, anonymous login method will be used. The default value is an empty string. |
| params.password | <code>string</code> | (Optional) The password used to log in. The default value is an empty string. |

**Example** *(Connect to the built-in server locally without a password)*  
```js
const server = new UrbackupServer();
```
**Example** *(Connect locally with a specified password)*  
```js
const server = new UrbackupServer({ url: 'http://127.0.0.1:55414', username: 'admin', password: 'secretpassword'});
```
**Example** *(Connect over the network)*  
```js
const server = new UrbackupServer({ url: 'https://192.168.0.2:443', username: 'admin', password: 'secretpassword'});
```
<a name="UrbackupServer+getServerIdentity"></a>

### urbackupServer.getServerIdentity() ⇒ <code>string</code>
Retrieves server identity.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>string</code> - Server identity.  
**Example** *(Get server identity)*  
```js
server.getServerIdentity().then(data => console.log(data));
```
<a name="UrbackupServer+getUsers"></a>

### urbackupServer.getUsers() ⇒ <code>Array</code>
Retrieves a list of users.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> - An array of objects representing users. If no users are found, it returns an empty array.  
**Example** *(Get all users)*  
```js
server.getUsers().then(data => console.log(data));
```
<a name="UrbackupServer+getGroups"></a>

### urbackupServer.getGroups() ⇒ <code>Array</code>
Retrieves a list of groups.
By default, UrBackup clients are added to a group ID 0 with empty name (empty string).

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> - An array of objects representing groups. If no groups are found, it returns an empty array.  
**Example** *(Get all groups)*  
```js
server.getGroups().then(data => console.log(data));
```
<a name="UrbackupServer+addGroup"></a>

### urbackupServer.addGroup(params) ⇒ <code>boolean</code>
Adds a new group.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, a Boolean value of true is returned. If the group already exists, or adding the group was not successful for any reason, then a Boolean value of false is returned.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.groupName | <code>string</code> | (Required) The group name, case-sensitive. Must be unique and cannot be an empty string. By default, UrBackup clients are added to a group with ID 0 and name '' (empty string). Defaults to undefined. |

**Example** *(Add new group)*  
```js
server.addGroup({groupName: 'prod'}).then(data => console.log(data));
```
<a name="UrbackupServer+removeGroup"></a>

### urbackupServer.removeGroup(params) ⇒ <code>boolean</code>
Removes the group.
All clients in this group will be reassigned to the default group. Does not allow removal of the default group (ID: 0, name: '').
The use of group ID is preferred over group name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When the removal is successful, the method returns a Boolean value of true. If the removal is not successful, the method returns a Boolean value of false.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.groupId | <code>number</code> | (Required if groupName is undefined) Group ID. Must be greater than 0. Takes precedence if both ```groupId``` and ```groupName``` are defined. Defaults to undefined. |
| params.groupName | <code>string</code> | (Required if groupId is undefined) Group name, case sensitive. Must be different than '' (empty string). Ignored if both ```groupId``` and ```groupName``` are defined. Defaults to undefined. |

**Example** *(Remove group)*  
```js
server.removeGroup({groupId: 1}).then(data => console.log(data));
server.removeGroup({groupName: 'prod'}).then(data => console.log(data));
```
<a name="UrbackupServer+getGroupMembers"></a>

### urbackupServer.getGroupMembers(params) ⇒ <code>Array</code>
Retrieves a list of clients who are members of a given group.
This is only a convenienance method that wraps the getClients() method.
The use of group name is preferred over group name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> - Array of objects representing clients matching search criteria. Empty array when no matching clients found.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.groupId | <code>number</code> | (Required if groupName is undefined) Group ID. Ignored if both ```groupId``` and ```groupName``` are defined. Defaults to undefined. |
| params.groupName | <code>string</code> | (Required if groupId is undefined) Group name, case sensitive. Takes precedence if both ```groupId``` and ```groupName``` are defined. Defaults to undefined. |

**Example** *(Get members of default group)*  
```js
server.get>GroupMembers({groupId: 0}).then(data => console.log(data));
```
**Example** *(Get all clients belonging to a specific group)*  
```js
server.getGroupMembers({groupName: 'office'}).then(data => console.log(data));
```
<a name="UrbackupServer+getClients"></a>

### urbackupServer.getClients(params) ⇒ <code>Array</code>
Retrieves a list of clients.
By default, this method matches all clients, including those marked for removal.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> - Array of objects representing clients matching search criteria. Empty array when no matching clients found.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Optional) An object containing parameters. |
| params.groupName | <code>string</code> | (Optional) Group name, case sensitive. By default, UrBackup clients are added to group ID 0 with name '' (empty string). Defaults to undefined, which matches all groups. |
| params.includeRemoved | <code>boolean</code> | (Optional) Whether or not clients pending deletion should be included. Defaults to true. |

**Example** *(Get all clients)*  
```js
server.getClients().then(data => console.log(data));
```
**Example** *(Get all clients, but exclude clients marked for removal)*  
```js
server.getClients({includeRemoved: false}).then(data => console.log(data));
```
**Example** *(Get all clients belonging to a specific group)*  
```js
server.getClients({groupName: 'office'}).then(data => console.log(data));
```
<a name="UrbackupServer+addClient"></a>

### urbackupServer.addClient(params) ⇒ <code>boolean</code>
Adds a new client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, it returns a Boolean value of true. If adding the client was not successful, for example if the client already exists, it returns false.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.clientName | <code>string</code> | (Required) Client's name, case sensitive. Defaults to undefined. |

**Example** *(Add new client)*  
```js
server.addClient({clientName: 'laptop2'}).then(data => console.log(data));
```
<a name="UrbackupServer+removeClient"></a>

### urbackupServer.removeClient(params) ⇒ <code>boolean</code>
Marks the client for removal.
Actual removing happens during the cleanup in the cleanup time window. Until then, this operation can be reversed with ```cancelRemoveClient``` method.
The use of client ID is preferred over client name for repeated method calls.
WARNING: Removing clients will also delete all their backups stored on the UrBackup server.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, returns Boolean true. Returns Boolean false when removing was not successful.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. If both clientId and clientName are defined, the ID takes precedence. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Remove client)*  
```js
server.removeClient({clientId: 1}).then(data => console.log(data));
server.removeClient({clientName: 'laptop2'}).then(data => console.log(data));
```
<a name="UrbackupServer+cancelRemoveClient"></a>

### urbackupServer.cancelRemoveClient(params) ⇒ <code>boolean</code>
Unmarks the client as ready for removal.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, returns a Boolean value of true. Returns Boolean false when the stopping process was not successful.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Stop the server from removing a client by ID)*  
```js
server.cancelRemoveClient({clientId: 1}).then(data => console.log(data));
```
**Example** *(Stop the server from removing a client by name)*  
```js
server.cancelRemoveClient({clientName: 'laptop2'}).then(data => console.log(data));
```
<a name="UrbackupServer+getClientHints"></a>

### urbackupServer.getClientHints() ⇒ <code>Array</code>
Retrieves a list of client discovery hints, which are also known as extra clients.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> - Array of objects representing client hints. Empty array when no matching client hints found.  
**Example** *(Get extra clients)*  
```js
server.getClientHints().then(data => console.log(data));
```
<a name="UrbackupServer+addClientHint"></a>

### urbackupServer.addClientHint(params) ⇒ <code>boolean</code>
Adds a new client discovery hint, also known as extra client.
Discovery hints are a way of improving client discovery in local area networks.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, Boolean true. Boolean false when adding was not successful.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.address | <code>string</code> | (Required) Client's IP address or hostname, case sensitive. Defaults to undefined. |

**Example** *(Add new extra client)*  
```js
server.addClientHint({address: '192.168.100.200'}).then(data => console.log(data));
```
<a name="UrbackupServer+removeClientHint"></a>

### urbackupServer.removeClientHint(params) ⇒ <code>boolean</code>
Removes specific client discovery hint, also known as extra client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, Boolean true. Boolean false when removing was not successful.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.address | <code>string</code> | (Required) Client's IP address or hostname, case sensitive. Defaults to undefined. |

**Example** *(Remove extra client)*  
```js
server.removeClientHint({address: '192.168.100.200'}).then(data => console.log(data));
```
<a name="UrbackupServer+getClientSettings"></a>

### urbackupServer.getClientSettings(params) ⇒ <code>Array</code>
Retrieves client settings.
Matches all clients by default, but ```clientId``` or ```clientName``` can be used to request settings for one particular client.
Clients marked for removal are not excluded from the results.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> - An array with objects representing client settings. Returns an empty array if no matching client is found.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Optional) An object containing parameters. |
| params.clientId | <code>number</code> | (Optional) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientName``` is also undefined. |
| params.clientName | <code>string</code> | (Optional) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientId``` is also undefined. |

**Example** *(Get settings for all clients)*  
```js
server.getClientSettings().then(data => console.log(data));
```
**Example** *(Get settings for a specific client only)*  
```js
server.getClientSettings({clientName: 'laptop1'}).then(data => console.log(data));
server.getClientSettings({clientId: 3}).then(data => console.log(data));
```
<a name="UrbackupServer+setClientSettings"></a>

### urbackupServer.setClientSettings(params) ⇒ <code>boolean</code>
Changes one specific element of client settings.
A list of settings can be obtained with ```getClientSettings``` method.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, Boolean true. Boolean false when save request was unsuccessful or invalid key/value.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.key | <code>string</code> | (Required) Settings element to change. Defaults to undefined. |
| params.newValue | <code>string</code> \| <code>number</code> \| <code>boolean</code> | (Required) New value for settings element. Defaults to undefined. |

**Example** *(Set directories to backup to be optional by default)*  
```js
server.setClientSettings({clientName: 'laptop1', key: 'backup_dirs_optional', newValue: true}).then(data => console.log(data));
server.setClientSettings({clientId: 3, key: 'backup_dirs_optional', newValue: true}).then(data => console.log(data));
```
<a name="UrbackupServer+getClientAuthkey"></a>

### urbackupServer.getClientAuthkey(params) ⇒ <code>string</code>
Retrieves authentication key for a specified client.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>string</code> - Client's authentication key. Empty string if no matching clients are found.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Get authentication key for a specific client)*  
```js
server.getClientAuthkey({clientName: 'laptop1'}).then(data => console.log(data));
server.getClientAuthkey({clientId: 3}).then(data => console.log(data));
```
<a name="UrbackupServer+getStatus"></a>

### urbackupServer.getStatus(params) ⇒ <code>Array</code>
Retrieves backup status.
Matches all clients by default, including clients marked for removal.
Client name or client ID can be passed as an argument in which case only that one client's status is returned.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> - Array of objects with status info for matching clients. Empty array when no matching clients found.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Optional) An object containing parameters. |
| params.clientId | <code>number</code> | (Optional) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientId``` is also undefined. |
| params.clientName | <code>string</code> | (Optional) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientName``` is also undefined. |
| params.includeRemoved | <code>boolean</code> | (Optional) Whether or not clients pending deletion should be included. Defaults to true. |

**Example** *(Get status for all clients)*  
```js
server.getStatus().then(data => console.log(data));
```
**Example** *(Get status for all clients, but skip clients marked for removal)*  
```js
server.getStatus({includeRemoved: false}).then(data => console.log(data));
```
**Example** *(Get status for a specific client only)*  
```js
server.getStatus({clientName: 'laptop1'}).then(data => console.log(data));
server.getStatus({clientId: 3}).then(data => console.log(data));
```
<a name="UrbackupServer+getUsage"></a>

### urbackupServer.getUsage(params) ⇒ <code>Array</code>
Retrieves storage usage.
By default, it matches all clients, but you can use clientName or clientId to request usage for a particular client.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> - Array of objects with storage usage info for each client. Empty array when no matching clients found.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Optional) An object containing parameters. |
| params.clientId | <code>number</code> | (Optional) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientId``` is also undefined. |
| params.clientName | <code>string</code> | (Optional) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientName``` is also undefined. |

**Example** *(Get usage for all clients)*  
```js
server.getUsage().then(data => console.log(data));
```
**Example** *(Get usage for a specific client only)*  
```js
server.getUsage({clientName: 'laptop1'}).then(data => console.log(data));
server.getUsage({clientId: 3}).then(data => console.log(data));
```
<a name="UrbackupServer+getActivities"></a>

### urbackupServer.getActivities(params) ⇒ <code>object</code>
Retrieves a list of current and/or past activities.
Matches all clients by default, but ```clientName``` or ```clientId``` can be used to request activities for one particular client.
By default this method returns only activities that are currently in progress and skips last activities.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>object</code> - Object with activities info in two separate arrays (one for current and one for past activities). Object with empty arrays when no matching clients/activities found.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Optional) An object containing parameters. |
| params.clientId | <code>number</code> | (Optional) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientId``` is also undefined. |
| params.clientName | <code>string</code> | (Optional) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientName``` is also undefined. |
| params.includeCurrent | <code>boolean</code> | (Optional) Whether or not currently running activities should be included. Defaults to true. |
| params.includePast | <code>boolean</code> | (Optional) Whether or not past activities should be included. Defaults to false. |

**Example** *(Get current (in progress) activities for all clients)*  
```js
server.getActivities().then(data => console.log(data));
```
**Example** *(Get past activities for all clients)*  
```js
server.getActivities({includeCurrent: false, includePast: true}).then(data => console.log(data));
```
**Example** *(Get current (in progress) activities for a specific client only)*  
```js
server.getActivities({clientName: 'laptop1'}).then(data => console.log(data));
server.getActivities({clientId: 3}).then(data => console.log(data));
```
**Example** *(Get all activities for a specific client only)*  
```js
server.getActivities({clientName: 'laptop1', includeCurrent: true, includePast: true}).then(data => console.log(data));
server.getActivities({clientId: '3', includeCurrent: true, includePast: true}).then(data => console.log(data));
```
<a name="UrbackupServer+stopActivity"></a>

### urbackupServer.stopActivity(params) ⇒ <code>boolean</code>
Stops one activity.
A list of current activities can be obtained with ```getActivities``` method.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, Boolean true. Boolean false when stopping was not successful.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.activityId | <code>number</code> | (Required) Activity ID. Defaults to undefined. |

**Example** *(Stop activity)*  
```js
server.stopActivity({clientName: 'laptop1', activityId: 42}).then(data => console.log(data));
server.stopActivity({clientId: 3, activityId: 42}).then(data => console.log(data));
```
<a name="UrbackupServer+getBackups"></a>

### urbackupServer.getBackups(params) ⇒ <code>object</code>
Retrieves a list of file and/or image backups for a specific client.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>object</code> - Object with backups info. Object with empty arrays when no matching clients/backups found.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.includeFileBackups | <code>boolean</code> | (Optional) Whether or not file backups should be included. Defaults to true. |
| params.includeImageBackups | <code>boolean</code> | (Optional) Whether or not image backups should be included. Defaults to true. |

**Example** *(Get all backups for a specific client)*  
```js
server.getBackups({clientName: 'laptop1'}).then(data => console.log(data));
server.getBackups({clientId: 3}).then(data => console.log(data));
```
**Example** *(Get image backups for a specific client)*  
```js
server.getBackups({clientName: 'laptop1', includeFileBackups: false}).then(data => console.log(data));
```
**Example** *(Get file backups for a specific client)*  
```js
server.getBackups({clientName: 'laptop1', includeImageBackups: false}).then(data => console.log(data));
```
<a name="UrbackupServer+startFullFileBackup"></a>

### urbackupServer.startFullFileBackup(params) ⇒ <code>boolean</code>
Starts full file backup.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, Boolean true. Boolean false when starting was not successful.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Start backup)*  
```js
server.startFullFileBackup({clientName: 'laptop1').then(data => console.log(data));
server.startFullFileBackup({clientId: 3).then(data => console.log(data));
```
<a name="UrbackupServer+startIncrementalFileBackup"></a>

### urbackupServer.startIncrementalFileBackup(params) ⇒ <code>boolean</code>
Starts incremental file backup.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, Boolean true. Boolean false when starting was not successful.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Start backup)*  
```js
server.startIncrementalFileBackup({clientName: 'laptop1').then(data => console.log(data));
server.startIncrementalFileBackup({clientId: 3).then(data => console.log(data));
```
<a name="UrbackupServer+startFullImageBackup"></a>

### urbackupServer.startFullImageBackup(params) ⇒ <code>boolean</code>
Starts full image backup.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, Boolean true. Boolean false when starting was not successful.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Start backup)*  
```js
server.startFullImageBackup({clientName: 'laptop1').then(data => console.log(data));
server.startFullImageBackup({clientId: 3).then(data => console.log(data));
```
<a name="UrbackupServer+startIncrementalImageBackup"></a>

### urbackupServer.startIncrementalImageBackup(params) ⇒ <code>boolean</code>
Starts incremental image backup.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, Boolean true. Boolean false when starting was not successful.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Start backup)*  
```js
server.startIncrementalImageBackup({clientName: 'laptop1').then(data => console.log(data));
server.startIncrementalImageBackup({clientId: 3).then(data => console.log(data));
```
<a name="UrbackupServer+getLiveLog"></a>

### urbackupServer.getLiveLog(params) ⇒ <code>Array</code>
Retrieves live logs.
Server logs are requested by default, but ```clientName``` or ```clientId``` can be used to request logs for one particular client.
Instance property is being used internally to keep track of log entries that were previously requested.
When ```recentOnly``` is set to true, then only recent (unfetched) logs are requested.
The use of client ID is preferred over client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> - Array of objects representing log entries. Empty array when no matching clients or logs found.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Optional) An object containing parameters. |
| params.clientId | <code>number</code> | (Optional) Client's ID. Must be greater than zero. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which means server logs will be requested if ```clientId``` is also undefined. |
| params.clientName | <code>string</code> | (Optional) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which means server logs will be requested if ```clientName``` is also undefined. |
| params.recentOnly | <code>boolean</code> | (Optional) Whether or not only recent (unfetched) entries should be requested. Defaults to false. |

**Example** *(Get server logs)*  
```js
server.getLiveLog().then(data => console.log(data));
```
**Example** *(Get logs for a specific client only)*  
```js
server.getLiveLog({clientName: 'laptop1'}).then(data => console.log(data));
server.getLiveLog({clientId: 3}).then(data => console.log(data));
```
**Example** *(Get logs for a specific client only, but skip previously fetched logs)*  
```js
server.getLiveLog({clientName: 'laptop1', recentOnly: true}).then(data => console.log(data));
```
<a name="UrbackupServer+getGeneralSettings"></a>

### urbackupServer.getGeneralSettings() ⇒ <code>object</code>
Retrieves general settings.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>object</code> - Object with general settings.  
**Example** *(Get general settings)*  
```js
server.getGeneralSettings().then(data => console.log(data));
```
<a name="UrbackupServer+setGeneralSettings"></a>

### urbackupServer.setGeneralSettings(params) ⇒ <code>boolean</code>
Changes one specific element of general settings.
A list of settings can be obtained with ```getGeneralSettings``` method.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> - When successful, Boolean true. Boolean false when save request was unsuccessful or invalid key/value.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | (Required) An object containing parameters. |
| params.key | <code>string</code> | (Required) Settings element to change. Defaults to undefined. |
| params.newValue | <code>string</code> \| <code>number</code> \| <code>boolean</code> | (Required) New value for settings element. Defaults to undefined. |

**Example** *(Disable image backups)*  
```js
server.setGeneralSettings({key: 'no_images', newValue: true}).then(data => console.log(data));
```
