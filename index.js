const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('url');
const crypto = require('crypto');
const Semaphore = require('async-mutex').Semaphore;

/**
 * Represents a UrBackup Server.
 * @class
 */
class UrbackupServer {
  #isLoggedIn = false;
  #lastLogId = new Map();
  #password;
  #semaphore = new Semaphore(1);
  #sessionId = '';
  #url;
  #username;
  #messages = {
    failedAnonymousLogin: 'Anonymous login failed.',
    failedFetch: 'Fetch request failed: response status is not in the range 200-299.',
    failedLogin: 'Login failed: invalid username or password.',
    failedLoginUnknown: 'Login failed: unknown reason.',
    invalidCategory: 'Syntax error: invalid category name.',
    missingClientData: 'API response error: missing client data. Make sure the UrBackup user has appropriate rights.',
    missingGroupData: 'API response error: missing group data. Make sure the UrBackup user has appropriate rights.',
    missingParameters: 'Syntax error: missing or invalid parameters.',
    missingServerIdentity: 'API response error: missing server identity. Make sure the UrBackup user has appropriate rights.',
    missingUserData: 'API response error: missing user data. Make sure the UrBackup user has appropriate rights.',
    missingValues: 'API response error: some values are missing. Make sure the UrBackup user has appropriate rights.',
    syntaxClientId: 'Syntax error: clientId must be a number.',
    syntaxClientName: 'Syntax error: clientName must be a string.',
    syntaxGroupId: 'Syntax error: groupId must be a number.',
    syntaxGroupName: 'Syntax error: groupName must be a string.'
  };

  /**
   * This is a constructor.
   * @param {object} [params={}] - An object containing parameters.
   * @param {string} [params.url='http://127.0.0.1:55414'] - The URL of the server, must include the protocol, hostname, and port. If not specified, it will default to http://127.0.0.1:55414.
   * @param {string} [params.username=''] - The username used for logging in. If empty, anonymous login method will be used. The default value is an empty string.
   * @param {string} [params.password=''] - The password used to log in. The default value is an empty string.
   * @example <caption>Connect to the built-in server locally without a password</caption>
   * const server = new UrbackupServer();
   * @example <caption>Connect locally with a specified password</caption>
   * const server = new UrbackupServer({ url: 'http://127.0.0.1:55414', username: 'admin', password: 'secretpassword' });
   * @example <caption>Connect over the network</caption>
   * const server = new UrbackupServer({ url: 'https://192.168.0.2:443', username: 'admin', password: 'secretpassword' });
   */
  constructor({ url = 'http://127.0.0.1:55414', username = '', password = '' } = {}) {
    this.#url = new URL(url);
    this.#url.pathname = 'x';
    this.#username = username;
    this.#password = password;
  }

  /**
   * Clears the session ID and logged-in flag.
   * This method is intended for internal use only and should not be called outside the class.
   * @private
   * @example
   * this.#clearLoginStatus();
   */
  #clearLoginStatus() {
    this.#sessionId = '';
    this.#isLoggedIn = false;
  }

  /**
   * Normalizes the client object.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {object} statusResponseItem - An object representing a client as returned by the `status` API call.
   * @returns {object} Normalized client object.
   * @private
   * @example
   * const data = (await this.#fetchJson('status')).map(client => this.#normalizeClient(client));
   */
  #normalizeClient(statusResponseItem) {
    return (function ({
      delete_pending, groupname, id, name, online, uid, ip, client_version_string, os_simple, os_version_string
    }) {
      return {
        clientId: id,
        clientName: name,
        groupName: groupname,
        deletePending: delete_pending,
        online: online,
        uid: uid,
        ip: ip,
        clientVersion: client_version_string,
        osFamily: os_simple,
        osVersion: os_version_string
      };
    })(statusResponseItem);
  }

  /**
   * Makes an API call to the server.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {string} action - The action to perform.
   * @param {object} bodyParams - The parameters for the action.
   * @returns {Promise<object>} The response body text parsed as JSON.
   * @throws {Error} If the fetch request is unsuccessful.
   * @private
   * @example
   * const response = await this.#fetchJson('status');
   */
  async #fetchJson(action = '', bodyParams = {}) {
    this.#url.searchParams.set('a', action);

    if (this.#sessionId.length > 0) {
      bodyParams.ses = this.#sessionId;
    }

    const response = await fetch(this.#url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: new URLSearchParams(bodyParams)
    });

    if (response?.ok === true) {
      return response.json();
    } else {
      throw new Error(this.#messages.failedFetch);
    }
  }

  /**
   * Hashes the user password.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {string} salt - PBKDF2 salt value as stored on the server.
   * @param {number} rounds - PBKDF2 iterations number.
   * @param {string} randomKey - Random key generated by the server for each session.
   * @returns {Promise<string>} The hashed password.
   * @private
   * @example
   * const hashedPassword = await this.#hashPassword(saltResponse.salt, saltResponse.pbkdf2_rounds, saltResponse.rnd);
   */
  async #hashPassword(salt = '', rounds = 10000, randomKey = '') {
    /**
     * Async PBKDF2 wrapper.
     * @param {Buffer} passwordHash - The hashed password.
     * @returns {Promise<Buffer>} The derived key.
     * @example
     * const hashedPassword = await this.#hashPassword(saltResponse.salt, saltResponse.pbkdf2_rounds, saltResponse.rnd);
     */
    function pbkdf2Async(passwordHash) {
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(passwordHash, salt, rounds, 32, 'sha256', (error, key) => {
          return error ? reject(error) : resolve(key);
        });
      });
    }

    let passwordHash = crypto.createHash('md5')
      .update(salt + this.#password, 'utf8')
      .digest();

    let derivedKey;
    if (rounds > 0) {
      derivedKey = await pbkdf2Async(passwordHash);
    }

    passwordHash = crypto.createHash('md5')
      .update(randomKey + (rounds > 0 ? derivedKey.toString('hex') : passwordHash), 'utf8')
      .digest('hex');

    return passwordHash;
  }

  /**
   * Logs in to the server.
   * This method is intended for internal use only and should not be called outside the class.
   * If the username is empty, then the anonymous login method is used.
   * @returns {Promise<boolean>} Boolean value true if the login was successful or if the user was already logged in.
   * @throws {Error} If the login fails.
   * @private
   * @example
   * const login = await this.#login();
   */
  async #login() {
    // NOTE: Use a semaphore to prevent race conditions with the login status, i.e., this.#sessionId
    // eslint-disable-next-line no-unused-vars
    const [value, release] = await this.#semaphore.acquire();
    try {
      if (this.#isLoggedIn === true && this.#sessionId.length > 0) {
        return true;
      }

      if (this.#username.length === 0) {
        const anonymousLoginResponse = await this.#fetchJson('login');

        if (anonymousLoginResponse?.success === true) {
          this.#sessionId = anonymousLoginResponse.session;
          this.#isLoggedIn = true;
          return true;
        } else {
          this.#clearLoginStatus();
          throw new Error(this.#messages.failedAnonymousLogin);
        }
      } else {
        const saltResponse = await this.#fetchJson('salt', { username: this.#username });

        if (typeof saltResponse?.salt === 'string') {
          this.#sessionId = saltResponse.ses;
          const hashedPassword = await this.#hashPassword(saltResponse.salt, saltResponse.pbkdf2_rounds, saltResponse.rnd);
          const userLoginResponse = await this.#fetchJson('login', { username: this.#username, password: hashedPassword });

          if (userLoginResponse?.success === true) {
            this.#isLoggedIn = true;
            return true;
          } else {
            // NOTE: Invalid password
            this.#clearLoginStatus();
            throw new Error(this.#messages.failedLogin);
          }
        } else {
          // NOTE: Invalid username
          this.#clearLoginStatus();
          throw new Error(this.#messages.failedLogin);
        }
      }
    } finally {
      release();
    }
  }

  /**
   * Maps client name to client ID.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {string} clientName - The client's name.
   * @returns {Promise<number | null>} The client's ID or null if no matching clients are found.
   * @throws {Error} If the clientName is not a string.
   * @private
   * @example
   * const clientId = await this.#getClientId('dbserver');
   */
  async #getClientId(clientName) {
    if (typeof clientName !== 'string') {
      throw new Error(this.#messages.syntaxClientName);
    }

    const fallbackReturnValue = null;
    const clients = await this.getClients({ includeRemoved: true });
    const clientId = clients.find((client) => client.clientName === clientName)?.clientId;

    return typeof clientId === 'undefined' ? fallbackReturnValue : clientId;
  }

  /**
   * Maps client ID to client name.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {number} clientId - The client's ID.
   * @returns {Promise<string | null>} The client's name or null if no matching clients are found.
   * @throws {Error} If the clientId is not a number.
   * @private
   * @example
   * const clientName = await this.#getClientName(42);
   */
  async #getClientName(clientId) {
    if (typeof clientId !== 'number') {
      throw new Error(this.#messages.syntaxClientId);
    }

    const fallbackReturnValue = null;

    const clients = await this.getClients({ includeRemoved: true });
    const clientName = clients.find((client) => client.clientId === clientId)?.clientName;

    return typeof clientName === 'undefined' ? fallbackReturnValue : clientName;
  }

  /**
   * Maps group name to group ID.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {string} groupName - The group's name.
   * @returns {Promise<number | null>} The group's ID or null if no matching groups are found.
   * @throws {Error} If the groupName is not a string.
   * @private
   * @example
   * const groupId = await this.#getGroupId('hr');
   */
  async #getGroupId(groupName) {
    if (typeof groupName !== 'string') {
      throw new Error(this.#messages.syntaxGroupName);
    }

    const fallbackReturnValue = null;

    const groups = await this.getGroups();
    const groupId = groups.find((group) => group.name === groupName)?.id;

    return typeof groupId === 'undefined' ? fallbackReturnValue : groupId;
  }

  /**
   * Maps group ID to group name.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {number} groupId - The group's ID.
   * @returns {Promise<string | null>} The group's name or null if no matching groups are found.
   * @throws {Error} If the groupId is not a number.
   * @private
   * @example
   * const groupName = await this.#getGroupName(2);
   */
  async #getGroupName(groupId) {
    if (typeof groupId !== 'number') {
      throw new Error(this.#messages.syntaxGroupId);
    }

    const fallbackReturnValue = null;

    const groups = await this.getGroups();
    const groupName = groups.find((group) => group.id === groupId)?.name;

    return typeof groupName === 'undefined' ? fallbackReturnValue : groupName;
  }

  /**
   * Retrieves server identity.
   * @returns {Promise<string>} The server identity.
   * @throws {Error} If the API response is missing required values or if the login fails.
   * @example <caption>Get server identity</caption>
   * server.getServerIdentity().then(data => console.log(data));
   */
  async getServerIdentity() {
    const login = await this.#login();

    if (login === true) {
      const statusResponse = await this.#fetchJson('status');

      if (typeof statusResponse?.server_identity === 'string') {
        return statusResponse.server_identity;
      } else {
        throw new Error(this.#messages.missingServerIdentity);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves a list of users.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing users. If no users are found, it returns an empty array.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all users</caption>
   * server.getUsers().then(data => console.log(data));
   */
  async getUsers() {
    const login = await this.#login();

    if (login === true) {
      const usersResponse = await this.#fetchJson('settings', { sa: 'listusers' });

      if (Array.isArray(usersResponse?.users)) {
        return usersResponse.users;
      } else {
        throw new Error(this.#messages.missingUserData);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves the rights of a specific user.
   * @param {object} [params={}] - An object containing parameters.
   * @param {string} [params.userId] - The user's ID. Takes precedence if both `userId` and `userName` are defined.
   * @param {string} [params.userName=this.#username] - The user's name. Ignored if `userId` is defined. Defaults to the username of the current session.
   * @returns {Promise<Array|null>} A promise that resolves to an array of user rights, or null if the user is not found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get user rights of the current session user</caption>
   * server.getUserRights().then(data => console.log(data));
   * @example <caption>Get user rights by user ID</caption>
   * server.getUserRights({ userId: '12345' }).then(data => console.log(data));
   * @example <caption>Get user rights by user name</caption>
   * server.getUserRights({ userName: 'john_doe' }).then(data => console.log(data));
   */
  async getUserRights({ userId, userName = this.#username } = {}) {
    const login = await this.#login();

    if (login === true) {
      const fallbackReturnValue = null;
      const allUsers = await this.getUsers();

      let userRights;
      if (typeof userId === 'string') {
        userRights = allUsers.find(user => user.id === userId)?.rights;
      } else if (typeof userName === 'string') {
        userRights = allUsers.find(user => user.name === userName)?.rights;
      } else {
        return fallbackReturnValue;
      }

      return Array.isArray(userRights) ? userRights : fallbackReturnValue;
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves a list of groups.
   * By default, UrBackup clients are added to a group with ID 0 and an empty name (empty string).
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing groups. If no groups are found, it returns an empty array.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all groups</caption>
   * server.getGroups().then(data => console.log(data));
   */
  async getGroups() {
    const login = await this.#login();

    if (login === true) {
      const settingsResponse = await this.#fetchJson('settings');

      if (Array.isArray(settingsResponse?.navitems?.groups)) {
        return settingsResponse.navitems.groups;
      } else {
        throw new Error(this.#messages.missingGroupData);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Adds a new group.
   * @param {object} params - An object containing parameters.
   * @param {string} params.groupName - The group name. Must be unique and cannot be an empty string. By default, UrBackup clients are added to a group with ID 0 and name '' (empty string). Defaults to undefined.
   * @returns {Promise<boolean>} When successful, returns true. If the group already exists, or adding the group was not successful for any reason, returns false.
   * @throws {Error} If the groupName is missing or invalid, or if the API response is missing expected values.
   * @example <caption>Add new group</caption>
   * server.addGroup({ groupName: 'prod' }).then(data => console.log(data));
   */
  async addGroup({ groupName } = {}) {
    if (typeof groupName === 'undefined') {
      throw new Error(this.#messages.missingParameters);
    }

    // NOTE: Fail early due to a possible UrBackup bug (server does not allow adding multiple groups with the same name,
    // but allows '' (empty string) which is the same as default group name)
    if (groupName === '') {
      return false;
    }

    const login = await this.#login();

    if (login === true) {
      const response = await this.#fetchJson('settings', { sa: 'groupadd', name: groupName });

      if ('add_ok' in response || 'already_exists' in response) {
        return response?.add_ok === true;
      } else {
        throw new Error(this.#messages.missingGroupData);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Removes a group.
   * All clients in this group will be reassigned to the default group. Does not allow removal of the default group (ID: 0, name: '').
   * @param {object} params - An object containing parameters.
   * @param {number} [params.groupId] - Group ID. Must be greater than 0. Takes precedence if both `groupId` and `groupName` are defined.
   * @param {string} [params.groupName] - Group name. Must be different than '' (empty string). Ignored if both `groupId` and `groupName` are defined.
   * @returns {Promise<boolean>} When the removal is successful, the method returns true. If the removal is not successful, the method returns false.
   * @throws {Error} If both `groupId` and `groupName` are missing or invalid, or if the login fails.
   * @example <caption>Remove group</caption>
   * server.removeGroup({ groupId: 1 }).then(data => console.log(data));
   * server.removeGroup({ groupName: 'prod' }).then(data => console.log(data));
   */
  async removeGroup({ groupId, groupName } = {}) {
    if (typeof groupId === 'undefined' && typeof groupName === 'undefined') {
      throw new Error(this.#messages.missingParameters);
    }

    if (groupId === 0 || groupName === '') {
      return false;
    }

    const login = await this.#login();

    if (login === true) {
      let mappedGroupId;

      if (typeof groupId === 'undefined') {
        mappedGroupId = await this.#getGroupId(groupName);
        if (mappedGroupId === 0 || mappedGroupId === null) {
          return false;
        }
      } else {
        // NOTE: Fail early due to a possible UrBackup bug where the server returns delete_ok:true even when
        // attempting to delete a non-existent group ID
        const mappedGroupName = await this.#getGroupName(groupId);
        if (mappedGroupName === null) {
          return false;
        }
      }

      const response = await this.#fetchJson('settings', { sa: 'groupremove', id: groupId ?? mappedGroupId });
      return response?.delete_ok === true;
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves a list of clients who are members of a given group.
   * This is only a convenience method that wraps the `getClients()` method.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.groupId] - Group ID. Ignored if both `groupId` and `groupName` are defined.
   * @param {string} [params.groupName] - Group name. Takes precedence if both `groupId` and `groupName` are defined.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients matching the search criteria. Returns an empty array when no matching clients are found.
   * @throws {Error} If both `groupId` and `groupName` are missing or invalid.
   * @example <caption>Get members of default group</caption>
   * server.getGroupMembers({ groupId: 0 }).then(data => console.log(data));
   * @example <caption>Get all clients belonging to a specific group</caption>
   * server.getGroupMembers({ groupName: 'office' }).then(data => console.log(data));
   */
  async getGroupMembers({ groupId, groupName } = {}) {
    if (typeof groupId === 'undefined' && typeof groupName === 'undefined') {
      throw new Error(this.#messages.missingParameters);
    }

    const fallbackReturnValue = [];
    let mappedGroupName;
    if (typeof groupName === 'undefined') {
      mappedGroupName = await this.#getGroupName(groupId);
      if (mappedGroupName === null) {
        return fallbackReturnValue;
      }
    }

    const groupMembers = await this.getClients({ groupName: groupName ?? mappedGroupName });

    return groupMembers;
  }

  /**
   * Retrieves a list of clients.
   * By default, this method matches all clients, including those marked for removal.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.groupName] - Group name. By default, UrBackup clients are added to group ID 0 with name '' (empty string). Defaults to undefined, which matches all groups.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients matching the search criteria. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all clients</caption>
   * server.getClients().then(data => console.log(data));
   * @example <caption>Get all clients, but exclude clients marked for removal</caption>
   * server.getClients({ includeRemoved: false }).then(data => console.log(data));
   * @example <caption>Get all clients belonging to a specific group</caption>
   * server.getClients({ groupName: 'office' }).then(data => console.log(data));
   */
  async getClients({ groupName, includeRemoved = true } = {}) {
    const clients = [];
    const login = await this.#login();

    if (login === true) {
      const statusResponse = await this.#fetchJson('status');

      if (Array.isArray(statusResponse?.status)) {
        for (const client of statusResponse.status) {
          if (typeof groupName !== 'undefined' && groupName !== client.groupname) {
            continue;
          }

          if (includeRemoved === false && client.delete_pending === '1') {
            continue;
          }

          clients.push(this.#normalizeClient(client));
        }

        return clients;
      } else {
        throw new Error(this.#messages.missingClientData);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves a list of clients marked for removal.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get clients marked for removal</caption>
   * server.getRemovedClients().then(data => console.log(data));
   */
  async getRemovedClients() {
    const removedClients = [];
    const allClients = await this.getClients({ includeRemoved: true });

    allClients.forEach(client => {
      if (client.deletePending === '1') {
        removedClients.push(client);
      }
    });

    return removedClients;
  }

  /**
   * Retrieves a list of online clients.
   * @param {object} [params] - An optional object containing parameters.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all online clients</caption>
   * server.getOnlineClients().then(data => console.log(data));
   */
  async getOnlineClients({ includeRemoved = true } = {}) {
    return (await this.getClients({ includeRemoved })).filter(client => client.online === true);
  }

  /**
   * Retrieves a list of offline clients.
   * @param {object} [params] - An optional object containing parameters.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all offline clients</caption>
   * server.getOfflineClients().then(data => console.log(data));
   * @example <caption>Get offline clients, skip clients marked for removal</caption>
   * server.getOfflineClients({includeRemoved: false}).then(data => console.log(data));
   */
  async getOfflineClients({ includeRemoved = true } = {}) {
    return (await this.getClients({ includeRemoved })).filter(client => client.online === false);
  }

  /**
   * Adds a new client.
   * @param {object} params - An object containing parameters.
   * @param {string} params.clientName - The client's name.
   * @returns {Promise<boolean>} When successful, returns true. If adding the client was not successful, for example if the client already exists, returns false.
   * @throws {Error} If the clientName is missing or invalid, if the login fails, or if the API response is missing expected values.
   * @example <caption>Add new client</caption>
   * server.addClient({ clientName: 'laptop2' }).then(data => console.log(data));
   */
  async addClient({ clientName } = {}) {
    if (typeof clientName === 'undefined') {
      throw new Error(this.#messages.missingParameters);
    }

    if (clientName === '') {
      return false;
    }

    const login = await this.#login();

    if (login === true) {
      const addClientResponse = await this.#fetchJson('add_client', { clientname: clientName });

      if (addClientResponse?.ok === true) {
        return addClientResponse.added_new_client === true;
      } else {
        throw new Error(this.#messages.missingClientData);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Marks or unmarks a client as ready for removal.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.clientId] - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined.
   * @param {string} [params.clientName] - Client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined.
   * @param {boolean} params.stopRemove - Whether it's a 'remove' or 'cancel remove' operation.
   * @returns {Promise<boolean>} When successful, the method returns true. If the operation to stop the removal was not successful, it returns false.
   * @throws {Error} If parameters are missing or invalid, or if API response is incorrect.
   * @example
   * const operationStatus = await this.#removeClientCommon({ clientId: 123, stopRemove: true });
   */
  async #removeClientCommon({ clientId, clientName, stopRemove } = {}) {
    if ((typeof clientId === 'undefined' && typeof clientName === 'undefined') || typeof stopRemove === 'undefined') {
      throw new Error(this.#messages.missingParameters);
    }

    if (clientName === '') {
      return false;
    }

    const fallbackReturnValue = false;
    const login = await this.#login();

    if (login === true) {
      let mappedClientId;

      if (typeof clientId === 'undefined') {
        mappedClientId = await this.#getClientId(clientName);
        if (mappedClientId === null) {
          return fallbackReturnValue;
        }
      }

      const apiCallParameters = { remove_client: clientId ?? mappedClientId };
      if (stopRemove === true) {
        apiCallParameters.stop_remove_client = true;
      }

      const statusResponse = await this.#fetchJson('status', apiCallParameters);

      if (Array.isArray(statusResponse?.status)) {
        return statusResponse.status.find((client) =>
          client.id === (clientId ?? mappedClientId)
        )?.delete_pending === (stopRemove === true ? '0' : '1');
      } else {
        throw new Error(this.#messages.missingValues);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Marks the client for removal.
   * Actual removal occurs during the cleanup time window. Until then, this operation can be reversed with the `cancelRemoveClient` method.
   * **WARNING:** Removing clients will also delete all their backups stored on the UrBackup server.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.clientId] - Client's ID. If both `clientId` and `clientName` are defined, the ID takes precedence. Defaults to undefined.
   * @param {string} [params.clientName] - Client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined.
   * @returns {Promise<boolean>} When successful, returns true. Returns false if the removal was not successful.
   * @throws {Error} If parameters are missing or invalid.
   * @example <caption>Remove client by ID</caption>
   * server.removeClient({ clientId: 1 }).then(data => console.log(data));
   * @example <caption>Remove client by name</caption>
   * server.removeClient({ clientName: 'laptop2' }).then(data => console.log(data));
   */
  async removeClient({ clientId, clientName } = {}) {
    const operationStatus = await this.#removeClientCommon({ clientId, clientName, stopRemove: false });
    return operationStatus;
  }

  /**
   * Unmarks the client as ready for removal.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.clientId] - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined.
   * @param {string} [params.clientName] - Client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined.
   * @returns {Promise<boolean>} When successful, returns true. Returns false if the stopping process was not successful.
   * @throws {Error} If parameters are missing or invalid.
   * @example <caption>Stop the server from removing a client by ID</caption>
   * server.cancelRemoveClient({ clientId: 1 }).then(data => console.log(data));
   * @example <caption>Stop the server from removing a client by name</caption>
   * server.cancelRemoveClient({ clientName: 'laptop2' }).then(data => console.log(data));
   */
  async cancelRemoveClient({ clientId, clientName } = {}) {
    const operationStatus = await this.#removeClientCommon({ clientId, clientName, stopRemove: true });
    return operationStatus;
  }

  /**
   * Retrieves a list of client discovery hints, which are also known as extra clients.
   * @returns {Promise<Array>} Array of objects representing client hints. Returns an empty array when no matching client hints are found.
   * @throws {Error} If the login fails or the API response is incorrect.
   * @example <caption>Get extra clients</caption>
   * server.getClientHints().then(data => console.log(data));
   */
  async getClientHints() {
    const login = await this.#login();

    if (login === true) {
      const statusResponse = await this.#fetchJson('status');

      if (Array.isArray(statusResponse?.extra_clients)) {
        return statusResponse.extra_clients;
      } else {
        throw new Error(this.#messages.missingValues);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Adds a new client discovery hint, also known as an extra client.
   * Discovery hints are a way of improving client discovery in local area networks.
   * @param {object} params - An object containing parameters.
   * @param {string} params.address - Client's IP address or hostname.
   * @returns {Promise<boolean>} When successful, returns true. Returns false when adding was not successful.
   * @throws {Error} If parameters are missing or invalid, or if the API response is incorrect.
   * @example <caption>Add new extra client</caption>
   * server.addClientHint({ address: '192.168.100.200' }).then(data => console.log(data));
   */
  async addClientHint({ address } = {}) {
    if (typeof address === 'undefined' || address === '') {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();

    if (login === true) {
      const statusResponse = await this.#fetchJson('status', {
        hostname: address
      });

      if (Array.isArray(statusResponse?.extra_clients)) {
        return statusResponse.extra_clients.some((extraClient) =>
          extraClient.hostname === address
        );
      } else {
        throw new Error(this.#messages.missingValues);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Removes a specific client discovery hint, also known as an extra client.
   * @param {object} params - An object containing parameters.
   * @param {string} params.address - Client's IP address or hostname.
   * @returns {Promise<boolean>} When successful, returns true. Returns false when removing was not successful.
   * @throws {Error} If parameters are missing or invalid, or if the API response is incorrect.
   * @example <caption>Remove extra client</caption>
   * server.removeClientHint({ address: '192.168.100.200' }).then(data => console.log(data));
   */
  async removeClientHint({ address } = {}) {
    if (typeof address === 'undefined' || address === '') {
      throw new Error(this.#messages.missingParameters);
    }

    let operationStatus = false;
    const login = await this.#login();

    if (login === true) {
      const extraClients = await this.getClientHints();

      if (Array.isArray(extraClients)) {
        const matchingClient = extraClients.find((extraClient) => extraClient.hostname === address);

        if (typeof matchingClient !== 'undefined') {
          const statusResponse = await this.#fetchJson('status', { hostname: matchingClient.id, remove: true });

          if (Array.isArray(statusResponse?.extra_clients)) {
            if (typeof statusResponse.extra_clients.find((extraClient) => extraClient.hostname === address) === 'undefined') {
              operationStatus = true;
            }
          } else {
            throw new Error(this.#messages.missingValues);
          }
        }

        return operationStatus;
      } else {
        throw new Error(this.#messages.missingValues);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves client settings.
   * Matches all clients by default, but `clientId` or `clientName` can be used to request settings for one particular client.
   * Clients marked for removal are not excluded from the results.
   * @param {object} [params] - An object containing parameters.
   * @param {number} [params.clientId] - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined.
   * @param {string} [params.clientName] - Client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @returns {Promise<Array>} An array with objects representing client settings. Returns an empty array if no matching client is found.
   * @throws {Error} If parameters are missing or invalid, or if the API response is incorrect.
   * @example <caption>Get settings for all clients</caption>
   * server.getClientSettings().then(data => console.log(data));
   * @example <caption>Get settings for a specific client only</caption>
   * server.getClientSettings({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getClientSettings({ clientId: 3 }).then(data => console.log(data));
   */
  async getClientSettings({ clientId, clientName } = {}) {
    if (typeof clientId !== 'undefined' && typeof clientId !== 'number') {
      throw new Error(this.#messages.missingParameters);
    }

    const clientSettings = [];

    if (clientName === '') {
      return clientSettings;
    }

    const login = await this.#login();

    if (login === true) {
      const clientIds = [];
      const allClients = await this.getClients({ includeRemoved: true });

      if (allClients.some((client) => typeof client.clientId === 'undefined')) {
        throw new Error(this.#messages.missingValues);
      }

      if (typeof clientId === 'undefined') {
        for (const client of allClients) {
          if (typeof clientName === 'undefined') {
            clientIds.push(client.clientId);
          } else {
            if (client.clientName === clientName) {
              clientIds.push(client.clientId);
              break;
            }
          }
        }
      } else {
        // NOTE: Need to make sure that given clientId really exists because 'clientsettings' API call
        // returns settings even when called with an invalid ID
        if (allClients.some((client) => client.clientId === clientId)) {
          clientIds.push(clientId);
        }
      }

      for (const id of clientIds) {
        const settingsResponse = await this.#fetchJson('settings', { sa: 'clientsettings', t_clientid: id });

        if (typeof settingsResponse?.settings === 'object') {
          clientSettings.push(settingsResponse.settings);
        } else {
          throw new Error(this.#messages.missingValues);
        }
      }

      return clientSettings;
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Changes one specific element of client settings.
   * A list of settings can be obtained with the `getClientSettings` method.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.clientId] - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined.
   * @param {string} [params.clientName] - Client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined.
   * @param {string} params.key - Settings element to change.
   * @param {string|number|boolean} params.newValue - New value for settings element.
   * @returns {Promise<boolean>} When successful, returns true. Returns false when the save request was unsuccessful or if the key/value is invalid.
   * @throws {Error} If parameters are missing or invalid, or if the API response is incorrect.
   * @example <caption>Set directories to backup to be optional by default</caption>
   * server.setClientSettings({ clientName: 'laptop1', key: 'backup_dirs_optional', newValue: true }).then(data => console.log(data));
   * server.setClientSettings({ clientId: 3, key: 'backup_dirs_optional', newValue: true }).then(data => console.log(data));
   */
  async setClientSettings({ clientId, clientName, key, newValue } = {}) {
    if ((typeof clientId === 'undefined' && typeof clientName === 'undefined') || typeof key === 'undefined' || typeof newValue === 'undefined') {
      throw new Error(this.#messages.missingParameters);
    }

    let operationStatus = false;

    if (clientName === '') {
      return operationStatus;
    }

    const login = await this.#login();

    if (login === true) {
      const clientSettings = await this.getClientSettings(typeof clientId === 'undefined' ? { clientName: clientName } : { clientId: clientId });

      if (Array.isArray(clientSettings) && clientSettings.length > 0) {
        if (Object.keys(clientSettings[0]).includes(key)) {
          clientSettings[0][key] = newValue;
          clientSettings[0].overwrite = true;
          clientSettings[0].sa = 'clientsettings_save';
          clientSettings[0].t_clientid = clientSettings[0].clientid;

          const saveSettingsResponse = await this.#fetchJson('settings', clientSettings[0]);

          if (typeof saveSettingsResponse?.saved_ok === 'boolean') {
            operationStatus = saveSettingsResponse.saved_ok === true;
          } else {
            throw new Error(this.#messages.missingValues);
          }
        }

        return operationStatus;
      } else {
        throw new Error(this.#messages.missingValues);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves the authentication key for a specified client.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.clientId] - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined.
   * @param {string} [params.clientName] - Client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined.
   * @returns {Promise<string>} Client's authentication key. Returns an empty string if no matching clients are found.
   * @throws {Error} If parameters are missing or invalid, or if the API response is incorrect.
   * @example <caption>Get authentication key for a specific client</caption>
   * server.getClientAuthkey({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getClientAuthkey({ clientId: 3 }).then(data => console.log(data));
   */
  async getClientAuthkey({ clientId, clientName } = {}) {
    if (typeof clientId === 'undefined' && typeof clientName === 'undefined') {
      throw new Error(this.#messages.missingParameters);
    }

    let authKey = '';

    if (clientName === '') {
      return authKey;
    }

    const login = await this.#login();

    if (login === true) {
      const clientSettings = await this.getClientSettings(typeof clientId === 'undefined' ? { clientName: clientName } : { clientId: clientId });

      if (Array.isArray(clientSettings)) {
        if (clientSettings.length > 0) {
          if (typeof clientSettings[0]?.internet_authkey?.value === 'string') {
            authKey = clientSettings[0].internet_authkey.value.toString();
          }
        }

        return authKey;
      } else {
        throw new Error(this.#messages.missingValues);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves backup status.
   * Matches all clients by default, including clients marked for removal.
   * Client name or client ID can be passed as an argument in which case only that one client's status is returned.
   * @param {object} [params] - An object containing parameters.
   * @param {number} [params.clientId] - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @param {string} [params.clientName] - Client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @returns {Promise<Array>} Array of objects with status info for matching clients. Returns an empty array if no matching clients are found.
   * @throws {Error} If the API response is incorrect or if login fails.
   * @example <caption>Get status for all clients</caption>
   * server.getStatus().then(data => console.log(data));
   * @example <caption>Get status for all clients, but skip clients marked for removal</caption>
   * server.getStatus({ includeRemoved: false }).then(data => console.log(data));
   * @example <caption>Get status for a specific client only</caption>
   * server.getStatus({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getStatus({ clientId: 3 }).then(data => console.log(data));
   */
  async getStatus({ clientId, clientName, includeRemoved = true } = {}) {
    const fallbackReturnValue = [];

    if (clientName === '') {
      return fallbackReturnValue;
    }

    const login = await this.#login();

    if (login === true) {
      const statusResponse = await this.#fetchJson('status');

      if (Array.isArray(statusResponse?.status)) {
        if (typeof clientId === 'undefined' && typeof clientName === 'undefined') {
          if (includeRemoved === false) {
            return statusResponse.status.filter((client) => client.delete_pending !== '1');
          } else {
            return statusResponse.status;
          }
        } else {
          const clientStatus = statusResponse.status.find((client) =>
            typeof clientId !== 'undefined' ? client.id === clientId : client.name === clientName
          );

          if (typeof clientStatus !== 'undefined') {
            return (includeRemoved === false && clientStatus.delete_pending === '1')
              ? fallbackReturnValue
              : [clientStatus];
          } else {
            return fallbackReturnValue;
          }
        }
      } else {
        throw new Error(this.#messages.missingValues);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves the server version in both number and string representation.
   * @returns {Promise<object>} An object containing the server version number and string.
   * @throws {Error} If the API response is missing required values or if the login fails.
   * @example <caption>Get server version number</caption>
   * server.getServerVersion().then(data => console.log(data.number));
   * @example <caption>Get server version string</caption>
   * server.getServerVersion().then(data => console.log(data.string));
   */
  async getServerVersion() {
    const login = await this.#login();

    if (login === true) {
      const serverVersion = { number: 0, string: '' };

      const statusResponse = await this.#fetchJson('status');

      if (typeof statusResponse?.curr_version_num === 'number') {
        serverVersion.number = statusResponse.curr_version_num;
      } else {
        throw new Error(this.#messages.missingValues);
      }

      if (typeof statusResponse?.curr_version_str === 'string') {
        serverVersion.string = statusResponse.curr_version_str;
      } else {
        throw new Error(this.#messages.missingValues);
      }

      return serverVersion;
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves storage usage.
   * By default, it matches all clients, but you can use `clientName` or `clientId` to request usage for one particular client.
   * @param {object} [params={}] - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @returns {Promise<Array>} A promise that resolves to an array of objects with storage usage info for each client. Resolves to an empty array if no matching clients are found.
   * @throws {Error} If the API response is missing values or if login fails.
   * @example <caption>Get usage for all clients</caption>
   * server.getUsage().then(data => console.log(data));
   * @example <caption>Get usage for a specific client only</caption>
   * server.getUsage({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getUsage({ clientId: 3 }).then(data => console.log(data));
   */
  async getUsage({ clientId, clientName } = {}) {
    const fallbackReturnValue = [];

    const login = await this.#login();

    if (login === true) {
      const usageResponse = await this.#fetchJson('usage');

      if (Array.isArray(usageResponse?.usage)) {
        if (typeof clientId === 'undefined' && typeof clientName === 'undefined') {
          return usageResponse.usage;
        } else {
          let mappedClientName;
          if (typeof clientId !== 'undefined') {
            // NOTE: Usage response does not contain a property with client ID so translation to client name is needed
            mappedClientName = await this.#getClientName(clientId);
            if (mappedClientName === null) {
              return fallbackReturnValue;
            }
          }
          return usageResponse.usage.find((client) =>
            typeof clientId !== 'undefined'
              ? client.name === mappedClientName
              : client.name === clientName
          ) ?? fallbackReturnValue;
        }
      } else {
        throw new Error(this.#messages.missingValues);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves a list of current and/or last activities.
   * Matches all clients by default, but `clientName` or `clientId` can be used to request activities for one particular client.
   * By default, this method returns both current and last activities.
   * @param {object} [params={}] - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @param {boolean} [params.includeCurrent=true] - Whether or not currently running activities should be included. Defaults to true.
   * @param {boolean} [params.includeLast=true] - Whether or not last activities should be included. Defaults to true.
   * @returns {Promise<object>} An object with activities info in two separate arrays (one for current and one for last activities). Returns an object with empty arrays when no matching clients/activities are found.
   * @throws {Error} If the API response is missing values or if login fails.
   * @example <caption>Get current (in progress) activities for all clients</caption>
   * server.getActivities({ includeLast: false }).then(data => console.log(data));
   * @example <caption>Get last activities for all clients</caption>
   * server.getActivities({ includeCurrent: false }).then(data => console.log(data));
   * @example <caption>Get current (in progress) activities for a specific client only</caption>
   * server.getActivities({ clientName: 'laptop1', includeLast: false }).then(data => console.log(data));
   * server.getActivities({ clientId: 3, includeLast: false }).then(data => console.log(data));
   * @example <caption>Get all activities for a specific client only</caption>
   * server.getActivities({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getActivities({ clientId: 3 }).then(data => console.log(data));
   */
  async getActivities({ clientId, clientName, includeCurrent = true, includeLast = true } = {}) {
    const activities = { current: [], last: [] };

    if (clientName === '') {
      return activities;
    }

    if (includeCurrent === false && includeLast === false) {
      return activities;
    }

    const login = await this.#login();

    if (login === true) {
      const activitiesResponse = await this.#fetchJson('progress');

      if (Array.isArray(activitiesResponse?.progress) && Array.isArray(activitiesResponse?.lastacts)) {
        if (includeCurrent === true) {
          if (typeof clientId === 'undefined' && typeof clientName === 'undefined') {
            activities.current = activitiesResponse.progress;
          } else {
            activities.current = activitiesResponse.progress.filter((activity) =>
              typeof clientId !== 'undefined'
                ? activity.clientid === clientId
                : activity.name === clientName
            );
          }
        }

        if (includeLast === true) {
          if (typeof clientId === 'undefined' && typeof clientName === 'undefined') {
            activities.last = activitiesResponse.lastacts;
          } else {
            activities.last = activitiesResponse.lastacts.filter((activity) =>
              typeof clientId !== 'undefined'
                ? activity.clientid === clientId
                : activity.name === clientName
            );
          }
        }

        return activities;
      } else {
        throw new Error(this.#messages.missingValues);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves a list of current (in progress) activities.
   * This is only a convenience method that wraps the `getActivities()` method.
   * Matches all clients by default, but `clientName` or `clientId` can be used to request activities for one particular client.
   * @param {object} [params={}] - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @returns {Promise<Array>} A promise that resolves to an array of current activities. Returns an empty array when no matching clients/activities are found.
   * @throws {Error} If the API response is missing values or if login fails.
   * @example <caption>Get current activities for all clients</caption>
   * server.getCurrentActivities().then(data => console.log(data));
   * @example <caption>Get current activities for a specific client only</caption>
   * server.getCurrentActivities({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getCurrentActivities({ clientId: 3 }).then(data => console.log(data));
   */
  async getCurrentActivities({ clientId, clientName } = {}) {
    const currentActivities = await this.getActivities({ clientId, clientName, includeCurrent: true, includeLast: false });
    return currentActivities.current;
  }

  /**
   * Retrieves a list of last activities.
   * This is only a convenience method that wraps the `getActivities()` method.
   * Matches all clients by default, but `clientName` or `clientId` can be used to request activities for one particular client.
   * @param {object} [params={}] - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @returns {Promise<Array>} A promise that resolves to an array of last activities. Returns an empty array when no matching clients/activities are found.
   * @throws {Error} If the API response is missing values or if login fails.
   * @example <caption>Get last activities for all clients</caption>
   * server.getLastActivities().then(data => console.log(data));
   * @example <caption>Get last activities for a specific client only</caption>
   * server.getLastActivities({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getLastActivities({ clientId: 3 }).then(data => console.log(data));
   */
  async getLastActivities({ clientId, clientName } = {}) {
    const lastActivities = await this.getActivities({ clientId, clientName, includeCurrent: false, includeLast: true });
    return lastActivities.last;
  }

  /**
   * Retrieves a list of paused activities.
   * Matches all clients by default, but `clientName` or `clientId` can be used to request paused activities for a particular client.
   * @param {object} [params={}] - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @returns {Promise<Array>} A promise that resolves to an array of paused activities. Returns an empty array when no matching clients/activities are found.
   * @throws {Error} If the API response is missing values or if login fails.
   * @example <caption>Get all paused activities</caption>
   * server.getPausedActivities().then(data => console.log(data));
   * @example <caption>Get paused activities for a specific client only</caption>
   * server.getPausedActivities({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getPausedActivities({ clientId: 3 }).then(data => console.log(data));
   */
  async getPausedActivities({ clientId, clientName } = {}) {
    const pausedActivities = [];
    const activities = await this.getActivities({ clientId, clientName, includeCurrent: true, includeLast: false });

    activities.current.forEach(activity => {
      if (activity.paused === true) {
        pausedActivities.push(activity);
      }
    });

    return pausedActivities;
  }

  /**
   * Stops one activity.
   * A list of current activities can be obtained with the `getActivities` method.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @param {number} params.activityId - The activity ID. Required.
   * @returns {Promise<boolean>} A promise that resolves to true if the activity was stopped successfully, or false if stopping was not successful.
   * @throws {Error} If there are missing or invalid parameters, if the API response is missing values, or if login fails.
   * @example <caption>Stop activity</caption>
   * server.stopActivity({ clientName: 'laptop1', activityId: 42 }).then(data => console.log(data));
   * server.stopActivity({ clientId: 3, activityId: 42 }).then(data => console.log(data));
   */
  async stopActivity({ clientId, clientName, activityId } = {}) {
    if ((typeof clientId === 'undefined' && typeof clientName === 'undefined') || typeof activityId === 'undefined' || activityId <= 0) {
      throw new Error(this.#messages.missingParameters);
    }

    if (clientName === '') {
      return false;
    }

    const login = await this.#login();

    if (login === true) {
      let mappedClientId;
      if (typeof clientId === 'undefined' && typeof clientName !== 'undefined') {
        mappedClientId = await this.#getClientId(clientName);
      }

      if (typeof clientId !== 'undefined' || (typeof mappedClientId !== 'undefined' && mappedClientId !== null)) {
        const activitiesResponse = await this.#fetchJson('progress', { stop_clientid: clientId ?? mappedClientId, stop_id: activityId });

        if (Array.isArray(activitiesResponse?.progress) && Array.isArray(activitiesResponse?.lastacts)) {
          return true;
        } else {
          throw new Error(this.#messages.missingValues);
        }
      } else {
        return false;
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves a list of file and/or image backups for a specific client.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @param {boolean} [params.includeFileBackups=true] - Whether or not file backups should be included. Defaults to true.
   * @param {boolean} [params.includeImageBackups=true] - Whether or not image backups should be included. Defaults to true.
   * @returns {Promise<object>} A promise that resolves to an object with backups info. Returns an object with empty arrays when no matching clients/backups are found.
   * @throws {Error} If there are missing or invalid parameters, if the API response is missing values, or if login fails.
   * @example <caption>Get all backups for a specific client</caption>
   * server.getBackups({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getBackups({ clientId: 3 }).then(data => console.log(data));
   * @example <caption>Get image backups for a specific client</caption>
   * server.getBackups({ clientName: 'laptop1', includeFileBackups: false }).then(data => console.log(data));
   * @example <caption>Get file backups for a specific client</caption>
   * server.getBackups({ clientName: 'laptop1', includeImageBackups: false }).then(data => console.log(data));
   */
  async getBackups({ clientId, clientName, includeFileBackups = true, includeImageBackups = true } = {}) {
    if ((typeof clientId === 'undefined' && typeof clientName === 'undefined') || (includeFileBackups === false && includeImageBackups === false)) {
      throw new Error(this.#messages.missingParameters);
    }

    const backups = { file: [], image: [] };

    if (clientName === '') {
      return backups;
    }

    const login = await this.#login();

    if (login === true) {
      let mappedClientId;

      if (typeof clientId === 'undefined' && typeof clientName !== 'undefined') {
        mappedClientId = await this.#getClientId(clientName);
      }

      if (typeof clientId !== 'undefined' || (typeof mappedClientId !== 'undefined' && mappedClientId !== null)) {
        const backupsResponse = await this.#fetchJson('backups', { sa: 'backups', clientid: clientId ?? mappedClientId });

        if (Array.isArray(backupsResponse?.backup_images) && Array.isArray(backupsResponse?.backups)) {
          if (includeFileBackups === true) {
            backups.file = backupsResponse.backups;
          }

          if (includeImageBackups === true) {
            backups.image = backupsResponse.backup_images;
          }

          return backups;
        } else {
          throw new Error(this.#messages.missingValues);
        }
      } else {
        throw new Error(this.#messages.missingValues);
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Starts a backup job.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @param {string} params.backupType - The backup type. Must be one of `full_file`, `incr_file`, `full_image`, or `incr_image`. Required.
   * @returns {Promise<boolean>} A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.
   * @throws {Error} If there are missing or invalid parameters, if the API response is missing values, or if login fails.
   * @example
   * const startStatus = await this.#startBackupCommon({ clientId: 3, backupType: 'full_file' });
   * @example
   * const startStatus = await this.#startBackupCommon({ clientName: 'laptop1', backupType: 'incr_file' });
   */
  async #startBackupCommon({ clientId, clientName, backupType } = {}) {
    const backupTypes = ['full_file', 'incr_file', 'full_image', 'incr_image'];

    if ((typeof clientId === 'undefined' && typeof clientName === 'undefined') || !backupTypes.includes(backupType)) {
      throw new Error(this.#messages.missingParameters);
    }

    if (clientName === '') {
      return false;
    }

    const login = await this.#login();

    if (login === true) {
      let mappedClientId;
      if (typeof clientId === 'undefined' && typeof clientName !== 'undefined') {
        mappedClientId = await this.#getClientId(clientName);
      }

      if (typeof clientId !== 'undefined' || (typeof mappedClientId !== 'undefined' && mappedClientId !== null)) {
        const backupResponse = await this.#fetchJson('start_backup', { start_client: clientId ?? mappedClientId, start_type: backupType });

        if (Array.isArray(backupResponse.result) && backupResponse.result.filter((element) => Object.keys(element).includes('start_ok')).length !== 1) {
          return !!backupResponse.result[0].start_ok;
        } else {
          throw new Error(this.#messages.missingValues);
        }
      } else {
        return false;
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Starts a full file backup.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @returns {Promise<boolean>} A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.
   * @throws {Error} If there are missing or invalid parameters.
   * @example <caption>Start a full file backup by client name</caption>
   * server.startFullFileBackup({clientName: 'laptop1'}).then(data => console.log(data));
   * @example <caption>Start a full file backup by client ID</caption>
   * server.startFullFileBackup({clientId: 3}).then(data => console.log(data));
   */
  async startFullFileBackup({ clientId, clientName } = {}) {
    const operationStatus = await this.#startBackupCommon({
      clientId: clientId,
      clientName: clientName,
      backupType: 'full_file'
    });
    return operationStatus;
  }

  /**
   * Starts an incremental file backup.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @returns {Promise<boolean>} A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.
   * @throws {Error} If there are missing or invalid parameters.
   * @example <caption>Start an incremental file backup by client name</caption>
   * server.startIncrementalFileBackup({clientName: 'laptop1'}).then(data => console.log(data));
   * @example <caption>Start an incremental file backup by client ID</caption>
   * server.startIncrementalFileBackup({clientId: 3}).then(data => console.log(data));
   */
  async startIncrementalFileBackup({ clientId, clientName } = {}) {
    const operationStatus = await this.#startBackupCommon({
      clientId: clientId,
      clientName: clientName,
      backupType: 'incr_file'
    });
    return operationStatus;
  }

  /**
   * Starts a full image backup.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @returns {Promise<boolean>} A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.
   * @throws {Error} If there are missing or invalid parameters.
   * @example <caption>Start a full image backup by client name</caption>
   * server.startFullImageBackup({clientName: 'laptop1'}).then(data => console.log(data));
   * @example <caption>Start a full image backup by client ID</caption>
   * server.startFullImageBackup({clientId: 3}).then(data => console.log(data));
   */
  async startFullImageBackup({ clientId, clientName } = {}) {
    const operationStatus = await this.#startBackupCommon({
      clientId: clientId,
      clientName: clientName,
      backupType: 'full_image'
    });
    return operationStatus;
  }

  /**
   * Starts an incremental image backup.
   * @param {object} params - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @returns {Promise<boolean>} A promise that resolves to true if the backup job was started successfully, or false if starting was not successful.
   * @throws {Error} If there are missing or invalid parameters.
   * @example <caption>Start an incremental image backup by client name</caption>
   * server.startIncrementalImageBackup({ clientName: 'laptop1' }).then(data => console.log(data));
   * @example <caption>Start an incremental image backup by client ID</caption>
   * server.startIncrementalImageBackup({ clientId: 3 }).then(data => console.log(data));
   */
  async startIncrementalImageBackup({ clientId, clientName } = {}) {
    const operationStatus = await this.#startBackupCommon({
      clientId: clientId,
      clientName: clientName,
      backupType: 'incr_image'
    });
    return operationStatus;
  }

  /**
   * Retrieves live logs.
   * Server logs are requested by default, but `clientName` or `clientId` can be used to request logs for one particular client.
   * Instance property is used internally to keep track of log entries that were previously requested.
   * When `recentOnly` is set to true, only recent (unfetched) logs are requested.
   * @param {object} [params] - An object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Must be greater than zero. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which means server logs will be requested if `clientId` is also undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which means server logs will be requested if `clientName` is also undefined.
   * @param {boolean} [params.recentOnly=false] - Whether only recent (unfetched) entries should be requested. Defaults to false.
   * @returns {Promise<Array>} A promise that resolves to an array of objects representing log entries. Returns an empty array when no matching clients or logs are found.
   * @throws {Error} If there is an API response error or login failure.
   * @example <caption>Get server logs</caption>
   * server.getLiveLog().then(data => console.log(data));
   * @example <caption>Get logs for a specific client only</caption>
   * server.getLiveLog({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getLiveLog({ clientId: 3 }).then(data => console.log(data));
   * @example <caption>Get logs for a specific client only, but skip previously fetched logs</caption>
   * server.getLiveLog({ clientName: 'laptop1', recentOnly: true }).then(data => console.log(data));
   */
  async getLiveLog({ clientId, clientName, recentOnly = false } = {}) {
    let livelog = [];

    if (clientName === '') {
      return livelog;
    }

    const login = await this.#login();

    if (login === true) {
      let mappedClientId;

      if (typeof clientId === 'undefined' && typeof clientName !== 'undefined') {
        mappedClientId = await this.#getClientId(clientName);
      }

      if (clientId === 0 || mappedClientId === null) {
        // NOTE: Fail early to distinguish this case because 0 (zero) is a valid parameter value
        // for 'livelog' call which should be used when both clientId and clientName are undefined
        return livelog;
      }

      // NOTE: Use semaphore to prevent race condition with this.#lastLogId
      // eslint-disable-next-line no-unused-vars
      const [value, release] = await this.#semaphore.acquire();
      try {
        const logResponse = await this.#fetchJson('livelog', {
          clientid: clientId ?? mappedClientId ?? 0,
          lastid: recentOnly === false ? 0 : this.#lastLogId.get(clientId)
        });

        if (Array.isArray(logResponse.logdata)) {
          const lastId = logResponse.logdata.slice(-1)[0]?.id;
          if (typeof lastId !== 'undefined') {
            this.#lastLogId.set(clientId, lastId);
          }

          livelog = logResponse.logdata;
        } else {
          throw new Error(this.#messages.missingValues);
        }
      } finally {
        release();
      }

      return livelog;
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }

  /**
   * Retrieves server settings of the given category.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {string} category - Name of the settings category.
   * @returns {Promise<object>} A promise that resolves to an object with the settings of the specified category.
   * @throws {Error} If there is a syntax error, API response error, or login failure.
   * @example <caption>Get general settings</caption>
   * this.#getServerSettings('general').then(data => console.log(data));
   */
  async #getServerSettings(category) {
    const validCategories = ['general', 'ldap', 'mail'];

    if (typeof category === 'string' && validCategories.includes(category)) {
      const login = await this.#login();

      if (login === true) {
        const settingsResponse = await this.#fetchJson('settings', { sa: category });

        if (typeof settingsResponse?.settings === 'object') {
          return settingsResponse.settings;
        } else {
          throw new Error(this.#messages.missingValues);
        }
      } else {
        throw new Error(this.#messages.failedLoginUnknown);
      }
    } else {
      throw new Error(this.#messages.invalidCategory);
    }
  }

  /**
   * Retrieves general settings.
   * @returns {Promise<object>} A promise that resolves to an object with general settings.
   * @throws {Error} If there is an API response error or login failure.
   * @example <caption>Get general settings</caption>
   * server.getGeneralSettings().then(data => console.log(data));
   */
  async getGeneralSettings() {
    const generalSettings = this.#getServerSettings('general');
    return generalSettings;
  }

  /**
   * Retrieves mail settings.
   * @returns {Promise<object>} A promise that resolves to an object with mail settings.
   * @throws {Error} If there is an API response error or login failure.
   * @example <caption>Get mail settings</caption>
   * server.getMailSettings().then(data => console.log(data));
   */
  async getMailSettings() {
    const mailSettings = this.#getServerSettings('mail');
    return mailSettings;
  }

  /**
   * Retrieves LDAP settings.
   * @returns {Promise<object>} A promise that resolves to an object with LDAP settings.
   * @throws {Error} If there is an API response error or login failure.
   * @example <caption>Get LDAP settings</caption>
   * server.getLdapSettings().then(data => console.log(data));
   */
  async getLdapSettings() {
    const ldapSettings = this.#getServerSettings('ldap');
    return ldapSettings;
  }

  /**
   * Changes one specific element of general settings.
   * A list of settings can be obtained with the `getGeneralSettings` method.
   * @param {object} params - (Required) An object containing parameters.
   * @param {string} params.key - (Required) The settings element to change.
   * @param {string|number|boolean} params.newValue - (Required) The new value for the settings element.
   * @returns {Promise<boolean>} A promise that resolves to true when the settings change is successful, and false if the save request was unsuccessful or the key/value is invalid.
   * @throws {Error} If there is a syntax error, API response error, or login failure.
   * @example <caption>Disable image backups</caption>
   * server.setGeneralSettings({ key: 'no_images', newValue: true }).then(data => console.log(data));
   */
  async setGeneralSettings({ key, newValue } = {}) {
    if (typeof key === 'undefined' || typeof newValue === 'undefined') {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();

    if (login === true) {
      const settings = await this.getGeneralSettings();

      if (Object.keys(settings).includes(key)) {
        settings[key] = newValue;
        settings.sa = 'general_save';

        const saveSettingsResponse = await this.#fetchJson('settings', settings);

        if (typeof saveSettingsResponse?.saved_ok === 'boolean') {
          return saveSettingsResponse.saved_ok;
        } else {
          throw new Error(this.#messages.missingValues);
        }
      } else {
        return false;
      }
    } else {
      throw new Error(this.#messages.failedLoginUnknown);
    }
  }
}

module.exports.UrbackupServer = UrbackupServer;
