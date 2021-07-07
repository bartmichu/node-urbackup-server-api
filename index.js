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
  #verboseMode;
  #sessionId = '';
  #isLoggedIn = false;

  /**
   * @constructor
   * @param {Object} params - An object containing parameters.
   * @param {String} params.url - Server's URL. Must include protocol, hostname and port (for example http://127.0.0.1:55414).
   * @param {String} [params.username] - Username used to log in. Anonymous login is used if userneme is empty or undefined.
   * @param {String} [params.password] - Password used to log in. Anonymous login is used if password is empty or undefined.
   * @param {Boolean} [params.verboseMode] - Whether or not additional messages should be printed to the console.
   */
  constructor ({ url = '', username = '', password = '', verboseMode = false } = {}) {
    this.#url = new URL(url);
    this.#url.pathname = 'x';
    this.#username = username;
    this.#password = password;
    this.#verboseMode = verboseMode;
  }

  /**
   * Prints messages to the console in verbose mode.
   *
   * @param {String} message - Message printed to the console.
   */
  #printMessage (message) {
    if (this.#verboseMode === true) {
      console.debug(message.toString());
    }
  }

  /**
   * Clears session ID and logged-in flag.
   */
  #clearLoginStatus () {
    this.#sessionId = '';
    this.#isLoggedIn = false;
  }

  /**
   * Makes API call to the server.
   *
   * @param {String} action - Action.
   * @param {Object} [bodyParams] - Action parameters.
   * @returns When successfull, a json response. Null when API call was unsuccessfull.
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
    }).catch((error) => {
      this.#printMessage('Connection failed');
      this.#printMessage(error.message);
    });

    if (response?.ok) {
      return response.json();
    } else {
      this.#printMessage(response);
      return null;
    }
  }

  /**
   * Hashes user password.
   *
   * @param {String} storedSalt - PBKDF2 salt value as stored on the server.
   * @param {Number} rounds - PBKDF2 iterations number.
   * @param {String} randomSalt - Random value generated by the server.
   * @returns A string representation of password hash.
   */
  async #hashPassword (storedSalt = '', rounds = 10000, randomSalt = '') {
    function pbkdf2Async (password) {
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, storedSalt, rounds, 32, 'sha256', (err, key) => {
          return err ? reject(err) : resolve(key);
        });
      });
    }

    let passwordHash = crypto.createHash('md5').update(storedSalt + this.#password, 'utf8').digest();

    if (rounds > 0) {
      const derivedKey = await pbkdf2Async(passwordHash);
      passwordHash = crypto.createHash('md5').update(randomSalt + derivedKey.toString('hex'), 'utf8').digest('hex');
    } else {
      passwordHash = crypto.createHash('md5').update(randomSalt + passwordHash, 'utf8').digest('hex');
    }

    return passwordHash;
  }

  /**
   * Logs in to the server.
   * If username or password is undefined or empty then this method tries anonymous login.
   *
   * @returns Boolean true if logged in successfully or was already logged in, boolean false otherwise.
   */
  async #login () {
    const [value, release] = await this.#semaphore.acquire();
    try {
      if (this.#isLoggedIn === true && this.#sessionId.length > 0) {
        this.#printMessage('Already logged in');
        return true;
      }

      if (this.#username.length === 0 || this.#password.length === 0) {
        this.#printMessage('Trying anonymous login');
        const anonymousLoginResponse = await this.#fetchJson('login');

        if (anonymousLoginResponse?.success === true) {
          this.#printMessage('Anonymous login succeeded');
          this.#sessionId = anonymousLoginResponse.session;
          this.#isLoggedIn = true;
          return true;
        } else {
          this.#printMessage('Anonymous login failed');
          this.#clearLoginStatus();
          return false;
        }
      } else {
        const saltResponse = await this.#fetchJson('salt', { username: this.#username });

        if (saltResponse === null || typeof saltResponse?.salt === 'undefined') {
          this.#printMessage('Unable to get salt, invalid username');
          this.#clearLoginStatus();
          return false;
        } else {
          this.#sessionId = saltResponse.ses;
          const hashedPassword = await this.#hashPassword(saltResponse.salt, saltResponse.pbkdf2_rounds, saltResponse.rnd);

          this.#printMessage('Trying user login');
          const userLoginResponse = await this.#fetchJson('login', { username: this.#username, password: hashedPassword });

          if (userLoginResponse?.success === true) {
            this.#printMessage('User login succeeded');
            this.#isLoggedIn = true;
            return true;
          } else {
            this.#printMessage('User login failed, invalid password');
            this.#clearLoginStatus();
            return false;
          }
        }
      }
    } catch (error) {
      this.#printMessage(error);
    } finally {
      release();
    }
  }

  /**
   * Retrieves backup status.
   * Client name can be passed as an argument in which case only that one client's status is returned.
   * If client name is undefined then this method returns status for each client separately.
   *
   * @param {Object} [params] - An object containing parameters.
   * @param {String} [params.clientName] - Client's name, case sensitive. Defaults to undefined.
   * @returns When successfull, an array of objects with status info. Empty array when no matching clients found. Null when API call was unsuccessfull or returned unexpected data.
   */
  async getStatus ({ clientName } = {}) {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const statusResponse = await this.#fetchJson('status');

    if (statusResponse === null || typeof statusResponse?.status === 'undefined') {
      return null;
    } else {
      if (typeof clientName === 'undefined') {
        return statusResponse.status;
      } else {
        const clientStatus = statusResponse.status.find(client => client.name === clientName);
        if (typeof clientStatus === 'undefined') {
          this.#printMessage('Failed to find client: no permission or client not found');
          return [];
        } else {
          return [clientStatus];
        }
      }
    }
  }

  /**
   * Retrieves general settings.
   *
   * @returns When successfull, an object with general settings. Null when API call was unsuccessfull or returned unexpected data.
   */
  async getGeneralSettings () {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const settingsResponse = await this.#fetchJson('settings', { sa: 'general' });

    if (settingsResponse === null || typeof settingsResponse?.settings === 'undefined') {
      return null;
    } else {
      return settingsResponse.settings;
    }
  }

  /**
   * Retrieves settings for a specific client.
   *
   * @param {Object} params - An object containing parameters.
   * @param {String} params.clientName - Client's name, case sensitive. Defaults to undefined.
   * @returns When successfull, an object with client's settings. Null when no matching client found and when API call was unsuccessfull or returned unexpected data.
   */
  async getClientSettings ({ clientName } = {}) {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    if (typeof clientName === 'undefined') {
      return null;
    }

    const clientStatus = await this.getStatus({ clientName: clientName });

    if (clientStatus === null || typeof clientStatus[0]?.id === 'undefined') {
      return null;
    } else {
      const settingsResponse = await this.#fetchJson('settings', { sa: 'clientsettings', t_clientid: clientStatus[0].id });
      if (settingsResponse === null || typeof settingsResponse?.settings === 'undefined') {
        return null;
      } else {
        return settingsResponse.settings;
      }
    }
  }

  /**
   * Retrieves server identity.
   *
   * @returns When successfull, a string with server identity. Null when API call was unsuccessfull or returned unexpected data.
   */
  async getServerIdentity () {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const statusResponse = await this.#fetchJson('status');

    if (statusResponse === null || typeof statusResponse?.server_identity === 'undefined') {
      return null;
    } else {
      return statusResponse.server_identity.toString();
    }
  }

  /**
   * Retrieves authentication key for a specified client.
   *
   * @param {Object} params - An object containing parameters.
   * @param {String} params.clientName - Client's name, case sensitive. Defaults to undefined.
   * @returns When successfull, a string with client's authentication key. Null when no matching clients found or API call was unsuccessfull.
   */
  async getClientAuthkey ({ clientName } = {}) {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const settingsResponse = await this.getClientSettings({ clientName: clientName });

    if (settingsResponse === null) {
      return null;
    } else {
      return settingsResponse === null ? '' : (settingsResponse?.internet_authkey.toString() || null);
    }
  }

  /**
   * Retrieves users.
   *
   * @returns When successfull, an array of objects representing users. Empty array when no matching clients found. Null when API call was unsuccessfull.
   */
  async getUsers () {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const usersResponse = await this.#fetchJson('settings', { sa: 'listusers' });

    if (usersResponse === null || typeof usersResponse?.users === 'undefined') {
      return null;
    } else {
      return usersResponse.users;
    }
  }

  /**
   * Retrieves groups.
   * By default, UrBackup clients are added to a group with empty name.
   *
   * @returns When successfull, an array of objects representing groups. Null when API call was unsuccessfull or returned unexpected data.
   */
  async getGroups () {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const settingsResponse = await this.#fetchJson('settings');

    if (settingsResponse === null || typeof settingsResponse?.navitems?.groups === 'undefined') {
      return null;
    } else {
      return settingsResponse.navitems.groups;
    }
  }

  /**
   * Retrieves storage usage.
   * Client name can be passed as an argument in which case only that one client's usage is returned.
   * If client name is undefined then this method returns storage usage for each client separately.
   *
   * @param {Object} [params] - An object containing parameters.
   * @param {String} [params.clientName] - Client's name, case sensitive. Defaults to undefined.
   * @returns When successfull, an array of objects with storage usage info. Empty array when no matching clients found. Null when API call was unsuccessfull or returned unexpected data.
   */
  async getUsage ({ clientName } = {}) {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const usageResponse = await this.#fetchJson('usage');

    if (usageResponse === null || typeof usageResponse?.usage === 'undefined') {
      return null;
    } else {
      if (typeof clientName === 'undefined') {
        return usageResponse.usage;
      } else {
        const clientUsage = usageResponse.usage.filter(client => client.name === clientName);
        if (clientUsage.length === 0) {
          this.#printMessage('Failed to find client usage: no permission or client not found');
        }
        return clientUsage;
      }
    }
  }

  /**
   * Retrieves current and/or last activities.
   * Client name can be passed as an argument in which case only that one client's actions are returned.
   * If client name is undefined then this method returns actions for each client separately.
   * By default this method lists only activities that are currently in progress.
   *
   * @param {Object} [params] - An object containing parameters.
   * @param {String} [params.clientName] - Client's name, case sensitive. Defaults to undefined.
   * @param {Boolean} [params.includeCurrent] - Whether or not currently running activities should be included. Defaults to true.
   * @param {Boolean} [params.includeLast] - Whether or not last activities should be included. Defaults to false.
   * @returns When successfull, an object with activities info. Object with empty array when no matching clients/activities found. Null when API call was unsuccessfull or returned unexpected data.
   */
  async getActivities ({ clientName, includeCurrent = true, includeLast = false } = {}) {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const activities = {};
    const activitiesResponse = await this.#fetchJson('progress');

    if (activitiesResponse === null) {
      return null;
    } else {
      if (includeCurrent === true) {
        if (typeof activitiesResponse?.progress === 'undefined') {
          return null;
        }
        activities.current = typeof clientName === 'undefined' ? activitiesResponse.progress : activitiesResponse.progress.filter(activity => activity.name === clientName);
      }
      if (includeLast === true) {
        if (typeof activitiesResponse?.lastacts === 'undefined') {
          return null;
        }
        activities.last = typeof clientName === 'undefined' ? activitiesResponse.lastacts : activitiesResponse.lastacts.filter(activity => activity.name === clientName);
      }

      return activities;
    }
  }
}

module.exports.UrbackupServer = UrbackupServer;
