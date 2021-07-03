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

  /**
   * @constructor
   * @param {String} url - Server's URL. Must include protocol, hostname and port (for example http://127.0.0.1:55414).
   * @param {String} [username] - Username used to log in. Anonymous login is used if userneme is empty or undefined.
   * @param {String} [password] - Password used to log in. Anonymous login is used if password is empty or undefined.
   */
  constructor (url = '', username = '', password = '') {
    this.#url = new URL(url);
    this.#url.pathname = 'x';
    this.#username = username;
    this.#password = password;
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
   * @param {String} action - Action.
   * @param {Object} [bodyParams] - Action parameters.
   * @returns A json response if successfull, Null otherwise.
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
      console.debug('Connection failed');
      console.debug(error.message);
    });

    if (response?.ok) {
      return response.json();
    } else {
      console.debug(response);
      return null;
    }
  }

  /**
   * Hashes user password.
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
   * @returns Boolean true if logged in successfully or was already logged in, boolean false otherwise.
   */
  async #login () {
    const [value, release] = await this.#semaphore.acquire();
    try {
      if (this.#isLoggedIn === true && this.#sessionId.length > 0) {
        console.debug('Already logged in');
        return true;
      }

      if (this.#username.length === 0 || this.#password.length === 0) {
        console.debug('Trying anonymous login');
        const anonymousLoginResponse = await this.#fetchJson('login');

        if (anonymousLoginResponse?.success === true) {
          console.debug('Anonymous login succeeded');
          this.#sessionId = anonymousLoginResponse.session;
          this.#isLoggedIn = true;
          return true;
        } else {
          console.debug('Anonymous login failed');
          this.#clearLoginStatus();
          return false;
        }
      } else {
        const saltResponse = await this.#fetchJson('salt', { username: this.#username });

        if (saltResponse === null || typeof saltResponse?.salt === 'undefined') {
          console.debug('Unable to get salt, invalid username');
          this.#clearLoginStatus();
          return false;
        } else {
          this.#sessionId = saltResponse.ses;
          const hashedPassword = await this.#hashPassword(saltResponse.salt, saltResponse.pbkdf2_rounds, saltResponse.rnd);

          console.debug('Trying user login');
          const userLoginResponse = await this.#fetchJson('login', { username: this.#username, password: hashedPassword });

          if (userLoginResponse?.success === true) {
            console.debug('User login succeeded');
            this.#isLoggedIn = true;
            return true;
          } else {
            console.debug('User login failed, invalid password');
            this.#clearLoginStatus();
            return false;
          }
        }
      }
    } catch (error) {
      console.debug(error);
    } finally {
      release();
    }
  }

  /**
   * Retrieves backup status for all clients.
   * @returns If successfull, an array of objects representing client statuses. Null otherwise.
   */
  async getStatus () {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const statusResponse = await this.#fetchJson('status');

    if (statusResponse === null || typeof statusResponse?.status === 'undefined') {
      return null;
    } else {
      return statusResponse.status;
    }
  }

  /**
   * Retrieves backup status for a specific client.
   * @param {String} clientName - Client name, case sensitive.
   * @returns If successfull, an object representing client status. Null otherwise.
   */
  async getClientStatus (clientName = '') {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const statusResponse = await this.#fetchJson('status');

    if (statusResponse === null || typeof statusResponse?.status === 'undefined') {
      return null;
    } else {
      const clientStatus = statusResponse.status.find(client => client.name === clientName);
      if (typeof clientStatus === 'undefined') {
        console.debug('Failed to find client status: no permission or client not found');
        return null;
      } else {
        return clientStatus;
      }
    }
  }

  /**
   * Retrieves general settings.
   * @returns If successfull, an object with general settings. Null otherwise.
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
   * Retrieves server identity.
   * @returns If successfull, a string with server identity. Null otherwise.
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
   * Retrieves users.
   * @returns If successfull, an array of objects representing users. Null otherwise.
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
   * Retrieves storage usage for all clients.
   * @returns If successfull, and array of objects with storage usage info. Null otherwise.
   */
  async getUsage () {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const usageResponse = await this.#fetchJson('usage');

    if (usageResponse === null || typeof usageResponse?.usage === 'undefined') {
      return null;
    } else {
      return usageResponse.usage;
    }
  }

  /**
   * Retrieves storage usage for a specific client.
   * @param {String} clientName - Client name, case sensitive.
   * @returns If successfull, object with storage usage info. Null otherwise.
   */
  async getClientUsage (clientName = '') {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const usageResponse = await this.#fetchJson('usage');

    if (usageResponse === null || typeof usageResponse?.usage === 'undefined') {
      return null;
    } else {
      const clientUsage = usageResponse.usage.find(client => client.name === clientName);
      if (typeof clientUsage === 'undefined') {
        console.debug('Failed to find client usage: no permission or client not found');
        return null;
      } else {
        return clientUsage;
      }
    }
  }

  /**
   * Retrieves current and/or last activities of all clients.
   * By default this method lists only activities that are currently in progress.
   * @param {Object} params - An object containing parameters.
   * @param {Boolean} [params.includeCurrent] - Whether or not currently running activities should be included.
   * @param {Boolean} [params.includeLast] - Whether or not last activities should be included.
   * @returns If successfull, an object with activities.
   */
  async getActivities ({ includeCurrent = true, includeLast = false } = {}) {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const activities = {};
    const activitiesResponse = await this.#fetchJson('progress');

    if (activitiesResponse === null) {
      return null;
    } else {
      if (includeCurrent) {
        activities.current = activitiesResponse?.progress;
      }
      if (includeLast) {
        activities.last = activitiesResponse?.lastacts;
      }

      return activities;
    }
  }

  /**
   * Retrieves current and/or last activities of a specific client.
   * By default this method lists only activities that are currently in progress.
   * @param {Object} params - An object containing parameters.
   * @param {String} params.clientName - Client's name, case sensitive.
   * @param {Boolean} [params.includeCurrent] - Whether or not currently running activities should be included.
   * @param {Boolean} [params.includeLast] - Whether or not last activities should be included.
   * @returns If successfull, an object with activities.
   */
  async getClientActivities ({ clientName = '', includeCurrent = true, includeLast = false } = {}) {
    const loginResponse = await this.#login();
    if (loginResponse !== true) {
      return null;
    }

    const activities = {};
    const activitiesResponse = await this.#fetchJson('progress');

    if (activitiesResponse === null) {
      return null;
    } else {
      if (includeCurrent) {
        const currentActivities = activitiesResponse.progress.filter(activity => activity.name === clientName);
        activities.current = currentActivities || [];
      }
      if (includeLast) {
        const lastActivities = activitiesResponse.lastacts.filter(activity => activity.name === clientName);
        activities.last = lastActivities || [];
      }

      return activities;
    }
  }
}

module.exports.UrbackupServer = UrbackupServer;
