# node-urbackup-server-api

Node.js wrapper for [UrBackup](https://www.urbackup.org/) server web API.

You can use it to interact with UrBackup server installed locally or over the network. It allows you to view and modify settings, add or remove clients, get information about running tasks, clients status, backup jobs, start or stop backups and a lot more.

*This code is still very much a work in progress - some functionality is missing, method signatures are likely to change. I'm targeting Node >= 16 at the moment, but will probably transpile for older versions once the module is ready.*

Installation:

```shell
npm install urbackup-server-api
```

Basic example to print names of clients with failed file backups:

```javascript
const { UrbackupServer } = require('urbackup-server-api');

// When troubleshooting TSL connections with self-signed certificates you may try to disable certificate validation. Keep in mind that it's strongly discouraged for production use.
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const server = new UrbackupServer({ url: 'http://127.0.0.1:55414', username: 'admin', password: 'secretpassword' });

(async () => {
  try {
    const allClients = await server.getStatus();
    console.log('Clients with failed file backups:');
    allClients.filter(client => client.file_ok === false).forEach(client => console.log(client.name));
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
    * [new UrbackupServer([params])](#new_UrbackupServer_new)
    * [.getServerIdentity()](#UrbackupServer+getServerIdentity) ⇒ <code>string</code> \| <code>null</code>
    * [.getUsers()](#UrbackupServer+getUsers) ⇒ <code>Array</code> \| <code>null</code>
    * [.getGroups()](#UrbackupServer+getGroups) ⇒ <code>Array</code> \| <code>null</code>
    * [.getClients([params])](#UrbackupServer+getClients) ⇒ <code>Array</code> \| <code>null</code>
    * [.addClient(params)](#UrbackupServer+addClient) ⇒ <code>boolean</code> \| <code>null</code>
    * [.removeClient(params)](#UrbackupServer+removeClient) ⇒ <code>boolean</code> \| <code>null</code>
    * [.cancelRemoveClient(params)](#UrbackupServer+cancelRemoveClient) ⇒ <code>boolean</code> \| <code>null</code>
    * [.getClientHints()](#UrbackupServer+getClientHints) ⇒ <code>Array</code> \| <code>null</code>
    * [.addClientHint(params)](#UrbackupServer+addClientHint) ⇒ <code>boolean</code> \| <code>null</code>
    * [.removeClientHint(params)](#UrbackupServer+removeClientHint) ⇒ <code>boolean</code> \| <code>null</code>
    * [.getClientSettings([params])](#UrbackupServer+getClientSettings) ⇒ <code>Array</code> \| <code>null</code>
    * [.setClientSetting(params)](#UrbackupServer+setClientSetting) ⇒ <code>boolean</code> \| <code>null</code>
    * [.getClientAuthkey(params)](#UrbackupServer+getClientAuthkey) ⇒ <code>string</code> \| <code>null</code>
    * [.getStatus([params])](#UrbackupServer+getStatus) ⇒ <code>Array</code> \| <code>null</code>
    * [.getUsage([params])](#UrbackupServer+getUsage) ⇒ <code>Array</code> \| <code>null</code>
    * [.getActivities([params])](#UrbackupServer+getActivities) ⇒ <code>Object</code> \| <code>null</code>
    * [.stopActivity(params)](#UrbackupServer+stopActivity) ⇒ <code>boolean</code> \| <code>null</code>
    * [.getBackups(params)](#UrbackupServer+getBackups) ⇒ <code>Object</code> \| <code>null</code>
    * [.startFullFileBackup(params)](#UrbackupServer+startFullFileBackup) ⇒ <code>boolean</code> \| <code>null</code>
    * [.startIncrementalFileBackup(params)](#UrbackupServer+startIncrementalFileBackup) ⇒ <code>boolean</code> \| <code>null</code>
    * [.startFullImageBackup(params)](#UrbackupServer+startFullImageBackup) ⇒ <code>boolean</code> \| <code>null</code>
    * [.startIncrementalImageBackup(params)](#UrbackupServer+startIncrementalImageBackup) ⇒ <code>boolean</code> \| <code>null</code>
    * [.getLiveLog([params])](#UrbackupServer+getLiveLog) ⇒ <code>Array</code> \| <code>null</code>
    * [.getGeneralSettings()](#UrbackupServer+getGeneralSettings) ⇒ <code>Object</code> \| <code>null</code>
    * [.setGeneralSetting(params)](#UrbackupServer+setGeneralSetting) ⇒ <code>boolean</code> \| <code>null</code>

<a name="new_UrbackupServer_new"></a>

### new UrbackupServer([params])

| Param | Type | Description |
| --- | --- | --- |
| [params] | <code>Object</code> | (Optional) An object containing parameters. |
| [params.url] | <code>string</code> | (Optional) Server's URL. Must include protocol, hostname and port. Defaults to http://127.0.0.1:55414. |
| [params.username] | <code>string</code> | (Optional) Username used to log in. Defaults to empty string. Anonymous login is used if userneme is empty or undefined. |
| [params.password] | <code>string</code> | (Optional) Password used to log in. Defaults to empty string. Anonymous login is used if password is empty or undefined. |
| [params.serverName] | <code>string</code> | (optional) Informal server name. Defaults to empty string. |

**Example** *(Connect locally to the built-in server without password)*  
```js
const server = new UrbackupServer();
```
**Example** *(Connect locally with password)*  
```js
const server = new UrbackupServer({ url: 'http://127.0.0.1:55414', username: 'admin', password: 'secretpassword'});
```
**Example** *(Connect over the network)*  
```js
const server = new UrbackupServer({ url: 'https://192.168.0.2:443', username: 'admin', password: 'secretpassword'});
```
<a name="UrbackupServer+getServerIdentity"></a>

### urbackupServer.getServerIdentity() ⇒ <code>string</code> \| <code>null</code>
Retrieves server identity.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>string</code> \| <code>null</code> - When successfull, a string with server identity. Null when API call was unsuccessfull or returned unexpected data.  
**Example** *(Get server identity)*  
```js
server.getServerIdentity().then(data => console.log(data));
```
<a name="UrbackupServer+getUsers"></a>

### urbackupServer.getUsers() ⇒ <code>Array</code> \| <code>null</code>
Retrieves a list of users.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> \| <code>null</code> - When successfull, an array of objects representing users. Empty array when no users found. Null when API call was unsuccessfull or returned unexpected data.  
**Example** *(Get all users)*  
```js
server.getUsers().then(data => console.log(data));
```
<a name="UrbackupServer+getGroups"></a>

### urbackupServer.getGroups() ⇒ <code>Array</code> \| <code>null</code>
Retrieves a list of groups.
By default, UrBackup clients are added to a group named with empty string.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> \| <code>null</code> - When successfull, an array of objects representing groups. Empty array when no groups found. Null when API call was unsuccessfull or returned unexpected data.  
**Example** *(Get all groups)*  
```js
server.getGroups().then(data => console.log(data));
```
<a name="UrbackupServer+getClients"></a>

### urbackupServer.getClients([params]) ⇒ <code>Array</code> \| <code>null</code>
Retrieves a list of clients.
Matches all clients by default, including clients marked for removal.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> \| <code>null</code> - When successfull, an array of objects representing clients matching search criteria. Empty array when no matching clients found. Null when API call was unsuccessfull ar returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| [params] | <code>Object</code> | (Optional) An object containing parameters. |
| [params.groupName] | <code>string</code> | (Optional) Group name, case sensitive. Defaults to undefined, which matches all groups. |
| [params.includeRemoved] | <code>boolean</code> | (Optional) Whether or not clients pending deletion should be included. Defaults to true. |

**Example** *(Get all clients)*  
```js
server.getClients().then(data => console.log(data));
```
**Example** *(Get all clients, but skip clients marked for removal)*  
```js
server.getClients({includeRemoved: false}).then(data => console.log(data));
```
**Example** *(Get all clients belonging to a specific group)*  
```js
server.getClients({groupName: 'office'}).then(data => console.log(data));
```
<a name="UrbackupServer+addClient"></a>

### urbackupServer.addClient(params) ⇒ <code>boolean</code> \| <code>null</code>
Adds a new client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> \| <code>null</code> - When successfull, boolean true. Boolean false when adding was not successfull, for example client already exists. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.clientName | <code>string</code> | (Required) Client's name, case sensitive. Defaults to undefined. |

**Example** *(Add new client)*  
```js
server.addClient({clientName: 'laptop2'}).then(data => console.log(data));
```
<a name="UrbackupServer+removeClient"></a>

### urbackupServer.removeClient(params) ⇒ <code>boolean</code> \| <code>null</code>
Marks the client for removal.
Actual removing happens during the cleanup in the cleanup time window. Until then, this operation can be reversed with ```cancelRemoveClient``` method.
Using client ID should be preferred to client name for repeated method calls.
WARNING: removing clients will also delete all their backups.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> \| <code>null</code> - When successfull, boolean true. Boolean false when removing was not successfull. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Remove client)*  
```js
server.removeClient({clientId: 1}).then(data => console.log(data));
server.removeClient({clientName: 'laptop2'}).then(data => console.log(data));
```
<a name="UrbackupServer+cancelRemoveClient"></a>

### urbackupServer.cancelRemoveClient(params) ⇒ <code>boolean</code> \| <code>null</code>
Unmarks the client as ready for removal.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> \| <code>null</code> - When successfull, boolean true. Boolean false when stopping was not successfull. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
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

### urbackupServer.getClientHints() ⇒ <code>Array</code> \| <code>null</code>
Retrieves a list of client discovery hints, also known as extra clients.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> \| <code>null</code> - When successfull, an array of objects representing client hints. Empty array when no matching client hints found. Null when API call was unsuccessfull ar returned unexpected data.  
**Example** *(Get extra clients)*  
```js
server.getClientHints().then(data => console.log(data));
```
<a name="UrbackupServer+addClientHint"></a>

### urbackupServer.addClientHint(params) ⇒ <code>boolean</code> \| <code>null</code>
Adds a new client discovery hint, also known as extra client.
Discovery hints are a way of improving client discovery in local area networks.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> \| <code>null</code> - When successfull, boolean true. Boolean false when adding was not successfull. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.address | <code>string</code> | (Required) Client's IP address or hostname, case sensitive. Defaults to undefined. |

**Example** *(Add new extra client)*  
```js
server.addClientHint({address: '192.168.100.200'}).then(data => console.log(data));
```
<a name="UrbackupServer+removeClientHint"></a>

### urbackupServer.removeClientHint(params) ⇒ <code>boolean</code> \| <code>null</code>
Removes specific client discovery hint, also known as extra client.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> \| <code>null</code> - When successfull, boolean true. Boolean false when removing was not successfull. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.address | <code>string</code> | (Required) Client's IP address or hostname, case sensitive. Defaults to undefined. |

**Example** *(Remove extra client)*  
```js
server.removeClientHint({address: '192.168.100.200'}).then(data => console.log(data));
```
<a name="UrbackupServer+getClientSettings"></a>

### urbackupServer.getClientSettings([params]) ⇒ <code>Array</code> \| <code>null</code>
Retrieves client settings.
Matches all clients by default, but ```clientId``` or ```clientName``` can be used to request settings for one particular client.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> \| <code>null</code> - When successfull, an array with objects represeting client settings. Empty array when no matching client found. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| [params] | <code>Object</code> | (Optional) An object containing parameters. |
| [params.clientId] | <code>number</code> | (Optional) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| [params.clientName] | <code>string</code> | (Optional) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Get settings for all clients)*  
```js
server.getClientSettings().then(data => console.log(data));
```
**Example** *(Get settings for a specific client only)*  
```js
server.getClientSettings({clientName: 'laptop1'}).then(data => console.log(data));
server.getClientSettings({clientId: 3}).then(data => console.log(data));
```
<a name="UrbackupServer+setClientSetting"></a>

### urbackupServer.setClientSetting(params) ⇒ <code>boolean</code> \| <code>null</code>
Changes one specific element of client settings.
A list of settings can be obtained with ```getClientSettings``` method.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> \| <code>null</code> - When successfull, boolean true. Boolean false when save request was unsuccessfull or invalid key/value. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.key | <code>string</code> | (Required) Settings element to change. Defaults to undefined. |
| params.newValue | <code>string</code> \| <code>number</code> \| <code>boolean</code> | (Required) New value for settings element. Defaults to undefined. |

**Example** *(Set directories to backup to be optional by default)*  
```js
server.setClientSetting({clientName: 'laptop1', key: 'backup_dirs_optional', newValue: true}).then(data => console.log(data));
server.setClientSetting({clientId: 3, key: 'backup_dirs_optional', newValue: true}).then(data => console.log(data));
```
<a name="UrbackupServer+getClientAuthkey"></a>

### urbackupServer.getClientAuthkey(params) ⇒ <code>string</code> \| <code>null</code>
Retrieves authentication key for a specified client.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>string</code> \| <code>null</code> - When successfull, a string with client's authentication key. Empty string when no matching clients found. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Get authentication key for a specific client)*  
```js
server.getClientAuthkey({clientName: 'laptop1'}).then(data => console.log(data));
server.getClientAuthkey({clientId: 3}).then(data => console.log(data));
```
<a name="UrbackupServer+getStatus"></a>

### urbackupServer.getStatus([params]) ⇒ <code>Array</code> \| <code>null</code>
Retrieves backup status.
Matches all clients by default, including clients marked for removal.
Client name or client ID can be passed as an argument in which case only that one client's status is returned.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> \| <code>null</code> - When successfull, an array of objects with status info for matching clients. Empty array when no matching clients found. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| [params] | <code>Object</code> | (Optional) An object containing parameters. |
| [params.clientId] | <code>number</code> | (Optional) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientId``` is also undefined. |
| [params.clientName] | <code>string</code> | (Optional) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientName``` is also undefined. |
| [params.includeRemoved] | <code>boolean</code> | (Optional) Whether or not clients pending deletion should be included. Defaults to true. |

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

### urbackupServer.getUsage([params]) ⇒ <code>Array</code> \| <code>null</code>
Retrieves storage usage.
Matches all clients by default, but ```clientName``` OR ```clientId``` can be used to request usage for one particular client.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> \| <code>null</code> - When successfull, an array of objects with storage usage info for each client. Empty array when no matching clients found. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| [params] | <code>Object</code> | (Optional) An object containing parameters. |
| [params.clientId] | <code>number</code> | (Optional) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientId``` is also undefined. |
| [params.clientName] | <code>string</code> | (Optional) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientName``` is also undefined. |

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

### urbackupServer.getActivities([params]) ⇒ <code>Object</code> \| <code>null</code>
Retrieves a list of current and/or past activities.
Matches all clients by default, but ```clientName``` or ```clientId``` can be used to request activities for one particular client.
By default this method returns only activities that are currently in progress and skips last activities.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Object</code> \| <code>null</code> - When successfull, an object with activities info. Object with empty array when no matching clients/activities found. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| [params] | <code>Object</code> | (Optional) An object containing parameters. |
| [params.clientId] | <code>number</code> | (Optional) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientId``` is also undefined. |
| [params.clientName] | <code>string</code> | (Optional) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which matches all clients if ```clientName``` is also undefined. |
| [params.includeCurrent] | <code>boolean</code> | (Optional) Whether or not currently running activities should be included. Defaults to true. |
| [params.includePast] | <code>boolean</code> | (Optional) Whether or not past activities should be included. Defaults to false. |

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

### urbackupServer.stopActivity(params) ⇒ <code>boolean</code> \| <code>null</code>
Stops one activity.
A list of current activities can be obtained with ```getActivities``` method.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> \| <code>null</code> - When successfull, boolean true. Boolean false when stopping was not successfull. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.activityId | <code>number</code> | (Required) Activity ID. Defaults to undefined. |

**Example** *(Stop activity)*  
```js
server.stopActivity({clientName: 'laptop1', activityId: 42}).then(data => console.log(data));
server.stopActivity({clientId: 3, activityId: 42}).then(data => console.log(data));
```
<a name="UrbackupServer+getBackups"></a>

### urbackupServer.getBackups(params) ⇒ <code>Object</code> \| <code>null</code>
Retrieves a list of file and/or image backups for a specific client.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Object</code> \| <code>null</code> - When successfull, an object with backups info. Object with empty arrays when no matching clients/backups found. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| [params.includeFileBackups] | <code>boolean</code> | (Optional) Whether or not file backups should be included. Defaults to true. |
| [params.includeImageBackups] | <code>boolean</code> | (Optional) Whether or not image backups should be included. Defaults to true. |

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

### urbackupServer.startFullFileBackup(params) ⇒ <code>boolean</code> \| <code>null</code>
Starts full file backup.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> \| <code>null</code> - When successfull, boolean true. Boolean false when starting was not successfull. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Start backup)*  
```js
server.startFullFileBackup({clientName: 'laptop1').then(data => console.log(data));
server.startFullFileBackup({clientId: 3).then(data => console.log(data));
```
<a name="UrbackupServer+startIncrementalFileBackup"></a>

### urbackupServer.startIncrementalFileBackup(params) ⇒ <code>boolean</code> \| <code>null</code>
Starts incremental file backup.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> \| <code>null</code> - When successfull, boolean true. Boolean false when starting was not successfull. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Start backup)*  
```js
server.startIncrementalFileBackup({clientName: 'laptop1').then(data => console.log(data));
server.startIncrementalFileBackup({clientId: 3).then(data => console.log(data));
```
<a name="UrbackupServer+startFullImageBackup"></a>

### urbackupServer.startFullImageBackup(params) ⇒ <code>boolean</code> \| <code>null</code>
Starts full image backup.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> \| <code>null</code> - When successfull, boolean true. Boolean false when starting was not successfull. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Start backup)*  
```js
server.startFullImageBackup({clientName: 'laptop1').then(data => console.log(data));
server.startFullImageBackup({clientId: 3).then(data => console.log(data));
```
<a name="UrbackupServer+startIncrementalImageBackup"></a>

### urbackupServer.startIncrementalImageBackup(params) ⇒ <code>boolean</code> \| <code>null</code>
Starts incremental image backup.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> \| <code>null</code> - When successfull, boolean true. Boolean false when starting was not successfull. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.clientId | <code>number</code> | (Required if clientName is undefined) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |
| params.clientName | <code>string</code> | (Required if clientId is undefined) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined. |

**Example** *(Start backup)*  
```js
server.startIncrementalImageBackup({clientName: 'laptop1').then(data => console.log(data));
server.startIncrementalImageBackup({clientId: 3).then(data => console.log(data));
```
<a name="UrbackupServer+getLiveLog"></a>

### urbackupServer.getLiveLog([params]) ⇒ <code>Array</code> \| <code>null</code>
Retrieves live logs.
Server logs are requested by default, but ```clientName``` or ```clientId``` can be used to request logs for one particular client.
Instance property is being used internally to keep track of log entries that were previously requested.
When ```recentOnly``` is set to true, then only recent (unfetched) logs are requested.
Using client ID should be preferred to client name for repeated method calls.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Array</code> \| <code>null</code> - When successfull, an array of objects representing log entries. Empty array when no matching clients or logs found. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| [params] | <code>Object</code> | (Optional) An object containing parameters. |
| [params.clientId] | <code>number</code> | (Optional) Client's ID. Takes precedence if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which means server logs will be requested if ```clientId``` is also undefined. |
| [params.clientName] | <code>string</code> | (Optional) Client's name, case sensitive. Ignored if both ```clientId``` and ```clientName``` are defined. Defaults to undefined, which means server logs will be requested if ```clientName``` is also undefined. |
| [params.recentOnly] | <code>boolean</code> | (Optional) Whether or not only recent (unfetched) entries should be requested. Defaults to false. |

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

### urbackupServer.getGeneralSettings() ⇒ <code>Object</code> \| <code>null</code>
Retrieves general settings.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>Object</code> \| <code>null</code> - When successfull, an object with general settings. Null when API call was unsuccessfull or returned unexpected data.  
**Example** *(Get general settings)*  
```js
server.getGeneralSettings().then(data => console.log(data));
```
<a name="UrbackupServer+setGeneralSetting"></a>

### urbackupServer.setGeneralSetting(params) ⇒ <code>boolean</code> \| <code>null</code>
Changes one specific element of general settings.
A list of settings can be obtained with ```getGeneralSettings``` method.

**Kind**: instance method of [<code>UrbackupServer</code>](#UrbackupServer)  
**Returns**: <code>boolean</code> \| <code>null</code> - When successfull, boolean true. Boolean false when save request was unsuccessfull or invalid key/value. Null when API call was unsuccessfull or returned unexpected data.  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> | (Required) An object containing parameters. |
| params.key | <code>string</code> | (Required) Settings element to change. Defaults to undefined. |
| params.newValue | <code>string</code> \| <code>number</code> \| <code>boolean</code> | (Required) New value for settings element. Defaults to undefined. |

**Example** *(Disable image backups)*  
```js
server.setGeneralSetting({key: 'no_images', newValue: true}).then(data => console.log(data));
```
