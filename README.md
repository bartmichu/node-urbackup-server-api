# node-urbackup-server-api

This module provides a Node.js interface for interacting with the UrBackup server's web API, whether the server is installed locally or accessed over a network. It aims to simplify the programmatic automation, control, and monitoring of UrBackup Server operations. Currently implemented methods:

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
import { UrbackupServer } from "urbackup-server-api";

// When troubleshooting TSL connections with self-signed certificates you may try to disable certificate validation. Keep in mind that it's strongly discouraged for production use.
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const server = new UrbackupServer({
  url: "http://127.0.0.1:55414",
  username: "admin",
  password: "secretpassword",
});

(async () => {
  try {
    // Check if server is currently busy
    const activities = await urbackup.getCurrentActivities();
    console.log(`Busy: ${activities.length > 0}`);

    // Get a list of production clients
    const prodClients = await urbackup
      .getGroupMembers({ groupName: "prod" })
      .then((data) => console.log(data));

    // Get production clients with failed image backup
    const failedClients = await urbackup
      .getFailedClients({ groupName: "prod", includeFileBackups: false })
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

## Implemented methods

Full documentation of all methods is included in the source file in the form of JSDoc comments.

- getServerIdentity
- getServerVersion
- isServerOutdated
- getUsers
- getCurrentUser
- addUser
- removeUser
- setUserPassword
- getUserRights
- setUserRights
- getGroups
- addGroup
- removeGroup
- getGroupMembers
- getClients
- getRemovedClients
- getOnlineClients
- getOfflineClients
- getActiveClients
- getBlankClients
- getFailedClients
- getOkClients
- getOutdatedClients
- getConflictingClients
- getUnseenClients
- getStaleClients
- addClient
- removeClient
- cancelRemoveClient
- getClientHints
- addClientHint
- removeClientHint
- getClientSettings
- setClientSettings
- getClientGroup
- setClientGroup
- getClientAuthenticationKey
- getStatus
- getUsage
- getActivities
- getCurrentActivities
- getLastActivities
- getPausedActivities
- stopClientActivity
- getBackups
- startFullFileBackup
- startIncrementalFileBackup
- startFullImageBackup
- startIncrementalImageBackup
- getLiveLog
- getGeneralSettings
- getMailSettings
- getLdapSettings
- setGeneralSettings
- getRawStatus
- getRawUsage
- getRawProgress

## Example implementation

**urbstat** <https://github.com/bartmichu/urbstat/>

The missing command-line tool for UrBackup Server. It provides valuable insights into the utilization of data, clients' status and activities, and helps administrator to identify, troubleshoot and resolve issues that may arise within the system.
