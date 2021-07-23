const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('url');
const crypto = require('crypto');
const Semaphore = require('async-mutex').Semaphore;

/**
 * Represents a UrBackup Server.
 */
class UrbackupServer {
  #semaphore = new Semaphore(1);
  #url;
  #username;
  #password;
  #sessionId = '';
  #isLoggedIn = false;
  #lastLogId = new Map();

  /**
   * @class
   * @param {Object} [params] - (Optional) An object containing parameters.
   * @param {string} [params.url] - (Optional) Server's URL. Must include protocol, hostname and port. Defaults to http://127.0.0.1:55414.
   * @param {string} [params.username] - (Optional) Username used to log in. Defaults to empty string. Anonymous login is used if userneme is empty or undefined.
   * @param {string} [params.password] - (Optional) Password used to log in. Defaults to empty string. Anonymous login is used if password is empty or undefined.
   * @example <caption>Connect locally to the built-in server without password</caption>
   * const server = new UrbackupServer();
   * @example <caption>Connect locally with password</caption>
   * const server = new UrbackupServer({ url: 'http://127.0.0.1:55414', username: 'admin', password: 'secretpassword'});
   * @example <caption>Connect over the network</caption>
   * const server = new UrbackupServer({ url: 'https://192.168.0.2:443', username: 'admin', password: 'secretpassword'});
   */
  constructor ({ url = 'http://127.0.0.1:55414', username = '', password = '' } = {}) {
    this.#url = new URL(url);
    this.#url.pathname = 'x';
    this.#username = username;
    this.#password = password;
  }

  /**
   * This method is not meant to be used outside the class.
   * Used internally to clear session ID and logged-in flag.
   */
  #clearLoginStatus () {
    this.#sessionId = '';
    this.#isLoggedIn = false;
  }

  /**
   * This method is not meant to be used outside the class.
   * Used internally to make API call to the server.
   *
   * @param {string} action - Action.
   * @param {Object} [bodyParams] - Action parameters.
   * @returns {Object} When successfull, a json response. Null when API call was unsuccessfull.
   */
  async #fetchJson (action = '', bodyParams = {}) {
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

    return response?.ok === true ? response.json() : null;
  }

  /**
   * This method is not meant to be used outside the class.
   * Used internally to hash user password.
   *
   * @param {string} salt - PBKDF2 salt value as stored on the server.
   * @param {number} rounds - PBKDF2 iterations number.
   * @param {string} randomKey - Random key generated by the server for each session.
   * @returns {string} A string representation of password hash.
   */
  async #hashPassword (salt = '', rounds = 10000, randomKey = '') {
    /**
     * @param {string} password - A password.
     * @returns {Buffer} Derived key.
     */
    function pbkdf2Async (password) {
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, rounds, 32, 'sha256', (error, key) => {
          return error ? reject(error) : resolve(key);
        });
      });
    }

    let passwordHash = crypto.createHash('md5').update(salt + this.#password, 'utf8').digest();

    if (rounds > 0) {
      const derivedKey = await pbkdf2Async(passwordHash);
      passwordHash = crypto.createHash('md5').update(randomKey + derivedKey.toString('hex'), 'utf8').digest('hex');
    } else {
      passwordHash = crypto.createHash('md5').update(randomKey + passwordHash, 'utf8').digest('hex');
    }

    return passwordHash;
  }

  /**
   * This method is not meant to be used outside the class.
   * Used internally to log in to the server.
   * If username or password is undefined or empty then anonymous login is tried.
   *
   * @returns {boolean} Boolean true if logged in successfully or was already logged in, boolean false otherwise.
   */
  async #login () {
    const [value, release] = await this.#semaphore.acquire();
    try {
      if (this.#isLoggedIn === true && this.#sessionId.length > 0) {
        return true;
      }

      if (this.#username.length === 0 || this.#password.length === 0) {
        const anonymousLoginResponse = await this.#fetchJson('login');

        if (anonymousLoginResponse?.success === true) {
          this.#sessionId = anonymousLoginResponse.session;
          this.#isLoggedIn = true;
          return true;
        } else {
          this.#clearLoginStatus();
          return false;
        }
      } else {
        const saltResponse = await this.#fetchJson('salt', { username: this.#username });

        if (saltResponse === null || typeof saltResponse?.salt === 'undefined') {
          this.#clearLoginStatus();
          return false;
        } else {
          this.#sessionId = saltResponse.ses;
          const hashedPassword = await this.#hashPassword(saltResponse.salt, saltResponse.pbkdf2_rounds, saltResponse.rnd);

          const userLoginResponse = await this.#fetchJson('login', { username: this.#username, password: hashedPassword });

          if (userLoginResponse?.success === true) {
            this.#isLoggedIn = true;
            return true;
          } else {
            this.#clearLoginStatus();
            return false;
          }
        }
      }
    } catch (error) {
    } finally {
      release();
    }
  }

  /**
   * This method is not meant to be used outside the class.
   * Used internally to translate client name to client ID.
   *
   * @param {string} clientName - Client's name.
   * @returns {number|null} When successfull, a number representing client's ID. 0 (zero) when no matching clients found. Null when API call was unsuccessfull or returned unexpected data.
   */
  async #getClientId (clientName) {
    let returnValue = 0;

    if (typeof clientName === 'undefined' || clientName === '') {
      return returnValue;
    }

    const clientsResponse = await this.getClients({ includeRemoved: true });
    if (clientsResponse === null) {
      return null;
    }

    const clientId = clientsResponse.find(client => client.name === clientName)?.id;
    returnValue = typeof clientId === 'undefined' ? 0 : clientId;

    return returnValue;
  }

  /**
   * Retrieves server identity.
   *
   * @returns {string|null} When successfull, a string with server identity. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Get server identity</caption>
   * server.getServerIdentity().then(data => console.log(data));
   */
  async getServerIdentity () {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const statusResponse = await this.#fetchJson('status');
    if (statusResponse === null || typeof statusResponse?.server_identity === 'undefined') {
      return null;
    }

    return statusResponse.server_identity.toString();
  }

  /**
   * Retrieves a list of users.
   *
   * @returns {Array|null} When successfull, an array of objects representing users. Empty array when no users found. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Get all users</caption>
   * server.getUsers().then(data => console.log(data));
   */
  async getUsers () {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const usersResponse = await this.#fetchJson('settings', { sa: 'listusers' });
    if (usersResponse === null || typeof usersResponse?.users === 'undefined') {
      return null;
    }

    return usersResponse.users;
  }

  /**
   * Retrieves a list of groups.
   * By default, UrBackup clients are added to a group named with empty string.
   *
   * @returns {Array|null} When successfull, an array of objects representing groups. Empty array when no groups found. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Get all groups</caption>
   * server.getGroups().then(data => console.log(data));
   */
  async getGroups () {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const settingsResponse = await this.#fetchJson('settings');
    if (settingsResponse === null || typeof settingsResponse?.navitems?.groups === 'undefined') {
      return null;
    }

    return settingsResponse.navitems.groups;
  }

  /**
   * Retrieves a list of clients.
   * Matches all clients by default, including clients marked for removal.
   *
   * @param {Object} [params] - (Optional) An object containing parameters.
   * @param {string} [params.groupName] - (Optional) Group name, case sensitive. Defaults to undefined, which matches all groups.
   * @param {boolean} [params.includeRemoved] - (Optional) Whether or not clients pending deletion should be included. Defaults to true.
   * @returns {Array|null} When successfull, an array of objects representing clients matching search criteria. Empty array when no matching clients found. Null when API call was unsuccessfull ar returned unexpected data.
   * @example <caption>Get all clients</caption>
   * server.getClients().then(data => console.log(data));
   * @example <caption>Get all clients, but skip clients marked for removal</caption>
   * server.getClients({includeRemoved: false}).then(data => console.log(data));
   * @example <caption>Get all clients belonging to a specific group</caption>
   * server.getClients({groupName: 'office'}).then(data => console.log(data));
   */
  async getClients ({ groupName, includeRemoved = true } = {}) {
    const returnValue = [];

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const statusResponse = await this.#fetchJson('status');
    if (statusResponse === null || typeof statusResponse?.status === 'undefined') {
      return null;
    }

    for (const client of statusResponse.status) {
      if (typeof groupName !== 'undefined' && groupName !== client.groupname) {
        continue;
      }

      if (includeRemoved === false && client.delete_pending === '1') {
        continue;
      }

      returnValue.push({ id: client.id, name: client.name, group: client.groupname, deletePending: client.delete_pending });
    }

    return returnValue;
  }

  /**
   * Adds a new client.
   *
   * @param {Object} params - (Required) An object containing parameters.
   * @param {string} params.clientName - (Required) Client's name, case sensitive. Defaults to undefined.
   * @returns {boolean|null} When successfull, boolean true. Boolean false when adding was not successfull, for example client already exists. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Add new client</caption>
   * server.addClient({clientName: 'laptop2'}).then(data => console.log(data));
   */
  async addClient ({ clientName } = {}) {
    let returnValue = false;

    if (typeof clientName === 'undefined' || clientName === '') {
      return returnValue;
    }

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const addResponse = await this.#fetchJson('add_client', { clientname: clientName });
    if (addResponse === null) {
      return null;
    }

    returnValue = addResponse.added_new_client === true;

    return returnValue;
  }

  /**
   * Marks the client for removal.
   * Actual removing happens during the cleanup in the cleanup time window. Until then, this operation can be reversed with ```cancelRemovingClient``` method.
   * WARNING: removing clients will also delete all their backups.
   *
   * @param {Object} params - (Required) An object containing parameters.
   * @param {string} params.clientName - (Required) Client's name, case sensitive. Defaults to undefined.
   * @returns {boolean|null} When successfull, boolean true. Boolean false when removing was not successfull. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Remove client</caption>
   * server.removeClient({clientName: 'laptop2'}).then(data => console.log(data));
   */
  async removeClient ({ clientName } = {}) {
    let returnValue = false;

    if (typeof clientName === 'undefined' || clientName === '') {
      return returnValue;
    }

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const clients = await this.getClients();
    if (clients === null) {
      return null;
    }

    const matchingClient = clients.find(client => client.name === clientName);

    if (typeof matchingClient !== 'undefined') {
      const statusResponse = await this.#fetchJson('status', { remove_client: matchingClient.id });

      if (statusResponse === null || typeof statusResponse?.status === 'undefined') {
        return null;
      }

      if (statusResponse.status.find(client => client.name === clientName)?.delete_pending === '1') {
        returnValue = true;
      }
    }

    return returnValue;
  }

  /**
   * Unmarks the client as ready for removal.
   *
   * @param {Object} params - (Required) An object containing parameters.
   * @param {string} params.clientName - (Required) Client's name, case sensitive. Defaults to undefined.
   * @returns {boolean|null} When successfull, boolean true. Boolean false when stopping was not successfull. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Stop the server from removing a client</caption>
   * server.cancelRemovingClient({clientName: 'laptop2'}).then(data => console.log(data));
   */
  async cancelRemovingClient ({ clientName } = {}) {
    let returnValue = false;

    if (typeof clientName === 'undefined' || clientName === '') {
      return returnValue;
    }

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const clients = await this.getClients();
    if (clients === null) {
      return null;
    }

    const matchingClient = clients.find(client => (client.name === clientName && client.deletePending === '1'));

    if (typeof matchingClient !== 'undefined') {
      const statusResponse = await this.#fetchJson('status', { remove_client: matchingClient.id, stop_remove_client: true });

      if (statusResponse === null || typeof statusResponse?.status === 'undefined') {
        return null;
      }

      if (statusResponse.status.find(client => client.name === clientName)?.delete_pending === '0') {
        returnValue = true;
      }
    }

    return returnValue;
  }

  /**
   * Retrieves a list of client discovery hints, also known as extra clients.
   *
   * @returns {Array|null} When successfull, an array of objects representing client hints. Empty array when no matching client hints found. Null when API call was unsuccessfull ar returned unexpected data.
   * @example <caption>Get extra clients</caption>
   * server.getClientHints().then(data => console.log(data));
   */
  async getClientHints () {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const statusResponse = await this.#fetchJson('status');
    if (statusResponse === null || typeof statusResponse?.extra_clients === 'undefined') {
      return null;
    }

    return statusResponse.extra_clients;
  }

  /**
   * Adds a new client discovery hint, also known as extra client.
   * Discovery hints are a way of improving client discovery in local area networks.
   *
   * @param {Object} params - (Required) An object containing parameters.
   * @param {string} params.address - (Required) Client's IP address or hostname, case sensitive. Defaults to undefined.
   * @returns {boolean|null} When successfull, boolean true. Boolean false when adding was not successfull. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Add new extra client</caption>
   * server.addClientHint({address: '192.168.100.200'}).then(data => console.log(data));
   */
  async addClientHint ({ address } = {}) {
    let returnValue = false;

    if (typeof address === 'undefined' || address === '') {
      return returnValue;
    };

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const statusResponse = await this.#fetchJson('status', { hostname: address });
    if (statusResponse === null || typeof statusResponse?.extra_clients === 'undefined') {
      return null;
    }

    returnValue = statusResponse.extra_clients.some(extraClient => extraClient.hostname === address);

    return returnValue;
  }

  /**
   * Removes specific client discovery hint, also known as extra client.
   *
   * @param {Object} params - (Required) An object containing parameters.
   * @param {string} params.address - (Required) Client's IP address or hostname, case sensitive. Defaults to undefined.
   * @returns {boolean|null} When successfull, boolean true. Boolean false when removing was not successfull. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Remove extra client</caption>
   * server.removeClientHint({address: '192.168.100.200'}).then(data => console.log(data));
   */
  async removeClientHint ({ address } = {}) {
    let returnValue = false;

    if (typeof address === 'undefined' || address === '') {
      return returnValue;
    };

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const extraClients = await this.getClientHints();
    if (extraClients === null) {
      return null;
    }

    const matchingClient = extraClients.find(extraClient => extraClient.hostname === address);
    if (typeof matchingClient !== 'undefined') {
      const statusResponse = await this.#fetchJson('status', { hostname: matchingClient.id, remove: true });
      if (statusResponse === null || typeof statusResponse?.extra_clients === 'undefined') {
        return null;
      }

      if (typeof statusResponse.extra_clients.find(extraClient => extraClient.hostname === address) === 'undefined') {
        returnValue = true;
      }
    }

    return returnValue;
  }

  /**
   * Retrieves client settings.
   * Matches all clients by default, but ```clientName``` can be used to request settings for one particular client.
   *
   * @param {Object} [params] - (Optional) An object containing parameters.
   * @param {string} [params.clientName] - (Optional) Client's name, case sensitive. Defaults to undefined which matches all clients.
   * @returns {Array|null} When successfull, an array with objects represeting client settings. Empty array when no matching client found. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Get settings for all clients</caption>
   * server.getClientSettings().then(data => console.log(data));
   * @example <caption>Get settings for a specific client only</caption>
   * server.getClientSettings({clientName: 'laptop1'}).then(data => console.log(data));
   */
  async getClientSettings ({ clientName } = {}) {
    const returnValue = [];

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    let clients = await this.getClients({ includeRemoved: true });

    if (clients === null || clients.some(client => typeof client.id === 'undefined')) {
      return null;
    }

    if (typeof clientName !== 'undefined') {
      clients = clients.filter(client => client.name === clientName);
    }

    for (const client of clients) {
      const settingsResponse = await this.#fetchJson('settings', { sa: 'clientsettings', t_clientid: client.id });

      if (settingsResponse === null || typeof settingsResponse?.settings === 'undefined') {
        return null;
      }

      returnValue.push(settingsResponse.settings);
    }

    return returnValue;
  }

  /**
   * Changes one specific element of client settings.
   * A list of settings can be obtained with ```getClientSettings``` method.
   *
   * @param {Object} params - (Required) An object containing parameters.
   * @param {string} params.clientName - (Required) Client's name, case sensitive. Defaults to undefined.
   * @param {string} params.key - (Required) Settings element to change. Defaults to undefined.
   * @param {string|number|boolean} params.newValue - (Required) New value for settings element. Defaults to undefined.
   * @returns {boolean|null} When successfull, boolean true. Boolean false when save request was unsuccessfull or invalid key/value. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Set directories to backup to be optional by default</caption>
   * server.setClientSetting({clientName: 'laptop1', key: 'backup_dirs_optional', newValue: true}).then(data => console.log(data));
   */
  async setClientSetting ({ clientName, key, newValue } = {}) {
    let returnValue = false;

    if (typeof clientName === 'undefined' || typeof key === 'undefined' || typeof newValue === 'undefined') {
      return returnValue;
    }

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const settings = await this.getClientSettings({ clientName: clientName });

    if (settings === null) {
      return null;
    }

    if (settings.length > 0 && Object.keys(settings[0]).includes(key)) {
      settings[0][key] = newValue;
      settings[0].overwrite = true;
      settings[0].sa = 'clientsettings_save';
      settings[0].t_clientid = settings[0].clientid;

      const saveResponse = await this.#fetchJson('settings', settings[0]);
      if (saveResponse === null) {
        return null;
      }

      returnValue = saveResponse.saved_ok === true;
    }

    return returnValue;
  }

  /**
   * Retrieves authentication key for a specified client.
   *
   * @param {Object} params - (Required) An object containing parameters.
   * @param {string} params.clientName - (Required) Client's name, case sensitive. Defaults to undefined.
   * @returns {string|null} When successfull, a string with client's authentication key. Empty string when no matching clients found. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Get authentication key for a specific client</caption>
   * server.getClientAuthkey({clientName: 'laptop1'}).then(data => console.log(data));
   */
  async getClientAuthkey ({ clientName } = {}) {
    if (typeof clientName === 'undefined') {
      return '';
    }

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const settingsResponse = await this.getClientSettings({ clientName: clientName });
    if (settingsResponse === null) {
      return null;
    }

    return settingsResponse.length === 0 ? '' : (settingsResponse[0].internet_authkey.toString() || null);
  }

  /**
   * Retrieves backup status.
   * Matches all clients by default, including clients marked for removal.
   * Client name can be passed as an argument in which case only that one client's status is returned.
   *
   * @param {Object} [params] - (Optional) An object containing parameters.
   * @param {string} [params.clientName] - (Optional) Client's name, case sensitive. Defaults to undefined, which matches all clients.
   * @param {boolean} [params.includeRemoved] - (Optional) Whether or not clients pending deletion should be included. Defaults to true.
   * @returns {Array|null} When successfull, an array of objects with status info for matching clients. Empty array when no matching clients found. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Get status for all clients</caption>
   * server.getStatus().then(data => console.log(data));
   * @example <caption>Get status for all clients, but skip clients marked for removal</caption>
   * server.getStatus({includeRemoved: false}).then(data => console.log(data));
   * @example <caption>Get status for a specific client only</caption>
   * server.getStatus({clientName: 'laptop1'}).then(data => console.log(data));
   */
  async getStatus ({ clientName, includeRemoved = true } = {}) {
    let returnValue = [];

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const statusResponse = await this.#fetchJson('status');
    if (statusResponse === null || typeof statusResponse?.status === 'undefined') {
      return null;
    }

    if (typeof clientName === 'undefined') {
      if (includeRemoved === false) {
        return statusResponse.status.filter(client => client.delete_pending !== '1');
      } else {
        return statusResponse.status;
      }
    } else {
      const clientStatus = statusResponse.status.find(client => client.name === clientName);
      if (typeof clientStatus !== 'undefined') {
        returnValue = (includeRemoved === false && clientStatus.delete_pending === '1') ? returnValue : [clientStatus];
      }
    }

    return returnValue;
  }

  /**
   * Retrieves storage usage.
   * Matches all clients by default, but ```clientName``` can be used to request usage for one particular client.
   *
   * @param {Object} [params] - (Optional) An object containing parameters.
   * @param {string} [params.clientName] - (Optional) Client's name, case sensitive. Defaults to undefined, which matches all clients.
   * @returns {Array|null} When successfull, an array of objects with storage usage info for each client. Empty array when no matching clients found. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Get usage for all clients</caption>
   * server.getUsage().then(data => console.log(data));
   * @example <caption>Get usage for a specific client only</caption>
   * server.getUsage({clientName: 'laptop1'}).then(data => console.log(data));
   */
  async getUsage ({ clientName } = {}) {
    let returnValue = [];

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const usageResponse = await this.#fetchJson('usage');
    if (usageResponse === null || typeof usageResponse?.usage === 'undefined') {
      return null;
    }

    returnValue = typeof clientName === 'undefined' ? usageResponse.usage : usageResponse.usage.filter(client => client.name === clientName);

    return returnValue;
  }

  /**
   * Retrieves a list of current and/or past activities.
   * Matches all clients by default, but ```clientName``` can be used to request activities for one particular client.
   * By default this method returns only activities that are currently in progress ans skips last activities.
   *
   * @param {Object} [params] - (Optional) An object containing parameters.
   * @param {string} [params.clientName] - (Optional) Client's name, case sensitive. Defaults to undefined, which matches all clients.
   * @param {boolean} [params.includeCurrent] - (Optional) Whether or not currently running activities should be included. Defaults to true.
   * @param {boolean} [params.includePast] - (Optional) Whether or not past activities should be included. Defaults to false.
   * @returns {Object|null} When successfull, an object with activities info. Object with empty array when no matching clients/activities found. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Get current (in progress) activities for all clients</caption>
   * server.getActivities().then(data => console.log(data));
   * @example <caption>Get past activities for all clients</caption>
   * server.getActivities({includeCurrent: false, includePast: true}).then(data => console.log(data));
   * @example <caption>Get current (in progress) activities for a specific client only</caption>
   * server.getActivities({clientName: 'laptop1'}).then(data => console.log(data));
   * @example <caption>Get all activities for a specific client only</caption>
   * server.getActivities({clientName: 'laptop1', includeCurrent: true, includePast: true}).then(data => console.log(data));
   */
  async getActivities ({ clientName, includeCurrent = true, includePast = false } = {}) {
    const returnValue = { current: [], past: [] };

    if (includeCurrent === false && includePast === false) {
      return returnValue;
    }

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const activitiesResponse = await this.#fetchJson('progress');
    if (activitiesResponse === null || typeof activitiesResponse?.progress === 'undefined' || typeof activitiesResponse?.lastacts === 'undefined') {
      return null;
    }

    if (includeCurrent === true) {
      returnValue.current = typeof clientName === 'undefined' ? activitiesResponse.progress : activitiesResponse.progress.filter(activity => activity.name === clientName);
    }

    if (includePast === true) {
      returnValue.past = typeof clientName === 'undefined' ? activitiesResponse.lastacts : activitiesResponse.lastacts.filter(activity => activity.name === clientName);
    }

    return returnValue;
  }

  /**
   * Stops one activity.
   * A list of current activities can be obtained with ```getActivities``` method.
   *
   * @param {Object} params - (Required) An object containing parameters.
   * @param {string} params.clientName - (Required) Client's name, case sensitive. Defaults to undefined.
   * @param {number} params.activityId - (Required) Activity ID. Defaults to undefined.
   * @returns {boolean|null} When successfull, boolean true. Boolean false when stopping was not successfull. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Stop activity</caption>
   * server.stopActivity({clientName: 'laptop1', activityId: 42}).then(data => console.log(data));
   */
  async stopActivity ({ clientName, activityId } = {}) {
    let returnValue = false;

    if (typeof clientName === 'undefined' || clientName === '' || typeof activityId === 'undefined' || activityId === 0) {
      return returnValue;
    }

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const clientId = await this.#getClientId(clientName);
    if (clientId === null) {
      return null;
    }

    if (clientId > 0) {
      const activitiesResponse = await this.#fetchJson('progress', { stop_clientid: clientId, stop_id: activityId });
      if (activitiesResponse === null || typeof activitiesResponse?.progress === 'undefined' || typeof activitiesResponse?.lastacts === 'undefined') {
        return null;
      }

      returnValue = true;
    }

    return returnValue;
  }

  /**
   * Retrieves a list of file and/or image backups for a specific client.
   *
   * @param {Object} params - (Required) An object containing parameters.
   * @param {string} params.clientName - (Required) Client's name, case sensitive. Defaults to undefined.
   * @param {boolean} [params.includeFileBackups] - (Optional) Whether or not file backups should be included. Defaults to true.
   * @param {boolean} [params.includeImageBackups] - (Optional) Whether or not image backups should be included. Defaults to true.
   * @returns {Object|null} When successfull, an object with backups info. Object with empty arrays when no matching clients/backups found. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Get all backups for a specific client</caption>
   * server.getBackups({clientName: 'laptop1'}).then(data => console.log(data));
   * @example <caption>Get image backups for a specific client</caption>
   * server.getBackups({clientName: 'laptop1', includeFileBackups: false}).then(data => console.log(data));
   * @example <caption>Get file backups for a specific client</caption>
   * server.getBackups({clientName: 'laptop1', includeImageBackups: false}).then(data => console.log(data));
   */
  async getBackups ({ clientName, includeFileBackups = true, includeImageBackups = true } = {}) {
    const returnValue = { file: [], image: [] };

    if (typeof clientName === 'undefined' || (includeFileBackups === false && includeImageBackups === false)) {
      return returnValue;
    }

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const clientId = await this.#getClientId(clientName);
    if (clientId === null) {
      return null;
    }

    if (clientId > 0) {
      const backupsResponse = await this.#fetchJson('backups', { sa: 'backups', clientid: clientId });

      if (backupsResponse === null) {
        return null;
      }

      if (includeFileBackups === true) {
        if (typeof backupsResponse?.backups === 'undefined') {
          return null;
        }
        returnValue.file = backupsResponse.backups;
      }

      if (includeImageBackups === true) {
        if (typeof backupsResponse?.backup_images === 'undefined') {
          return null;
        }
        returnValue.image = backupsResponse.backup_images;
      }
    }

    return returnValue;
  }

  /**
   * Retrieves live logs.
   * Server logs are requested by default, but ```clientName``` can be used to request logs for one particular client.
   * Instance property is being used internally to keep track of log entries that were previously requested. When ```recentOnly``` is set to true, then only recent (unfetched) logs are requested.
   *
   * @param {Object} [params] - (Optional) An object containing parameters.
   * @param {string} [params.clientName] - (Optional) Client's name, case sensitive. Defaults to undefined, which means server logs will be requested.
   * @param {boolean} [params.recentOnly] - (Optional) Whether or not only recent (unfetched) entries should be requested. Defaults to false.
   * @returns {Array|null} When successfull, an array of objects representing log entries. Empty array when no matching clients or logs found. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Get server logs</caption>
   * server.getLiveLog().then(data => console.log(data));
   * @example <caption>Get logs for a specific client only</caption>
   * server.getLiveLog({clientName: 'laptop1'}).then(data => console.log(data));
   * @example <caption>Get logs for a specific client only, but skip previously fetched logs</caption>
   * server.getLiveLog({clientName: 'laptop1', recentOnly: true}).then(data => console.log(data));
   */
  async getLiveLog ({ clientName, recentOnly = false } = {}) {
    let returnValue = [];

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const clientId = await this.#getClientId(clientName);
    if (clientId === null) {
      return null;
    } else if (clientId === 0 && typeof clientName !== 'undefined') {
      // 0 is a valid value for livelog and should be used when clientName is undefined
      return returnValue;
    }

    const [value, release] = await this.#semaphore.acquire();
    try {
      const logResponse = await this.#fetchJson('livelog', { clientid: clientId, lastid: recentOnly === false ? 0 : this.#lastLogId.get(clientId) });

      if (logResponse === null || typeof logResponse.logdata === 'undefined') {
        return null;
      }

      const lastId = logResponse.logdata.slice(-1)[0]?.id;
      if (typeof lastId !== 'undefined') {
        this.#lastLogId.set(clientId, lastId);
      }

      returnValue = logResponse.logdata;
    } catch (error) {
    } finally {
      release();
    }

    return returnValue;
  }

  /**
   * Retrieves general settings.
   *
   * @returns {Object|null} When successfull, an object with general settings. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Get general settings</caption>
   * server.getGeneralSettings().then(data => console.log(data));
   */
  async getGeneralSettings () {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const settingsResponse = await this.#fetchJson('settings', { sa: 'general' });
    if (settingsResponse === null || typeof settingsResponse?.settings === 'undefined') {
      return null;
    }

    return settingsResponse.settings;
  }

  /**
   * Changes one specific element of general settings.
   * A list of settings can be obtained with ```getGeneralSettings``` method.
   *
   * @param {Object} params - (Required) An object containing parameters.
   * @param {string} params.key - (Required) Settings element to change. Defaults to undefined.
   * @param {string|number|boolean} params.newValue - (Required) New value for settings element. Defaults to undefined.
   * @returns {boolean|null} When successfull, boolean true. Boolean false when save request was unsuccessfull or invalid key/value. Null when API call was unsuccessfull or returned unexpected data.
   * @example <caption>Disable image backups</caption>
   * server.setGeneralSetting({key: 'no_images', newValue: true}).then(data => console.log(data));
   */
  async setGeneralSetting ({ key, newValue } = {}) {
    let returnValue = false;

    if (typeof key === 'undefined' || typeof newValue === 'undefined') {
      return returnValue;
    }

    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const settings = await this.getGeneralSettings();
    if (settings === null) {
      return null;
    }

    if (Object.keys(settings).includes(key)) {
      settings[key] = newValue;
      settings.sa = 'general_save';

      const saveResponse = await this.#fetchJson('settings', settings);
      if (saveResponse === null) {
        return null;
      }
      returnValue = saveResponse.saved_ok === true;
    }

    return returnValue;
  }
}

module.exports.UrbackupServer = UrbackupServer;
