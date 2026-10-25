import crypto from "node:crypto";
import { URL, URLSearchParams } from "node:url";
import { Semaphore } from "async-mutex";

/**
 * Represents a UrBackup Server.
 * @class
 */
class UrbackupServer {
  #isLoggedIn = false;
  #lastLogId = new Map();
  #password;
  #semaphore = new Semaphore(1);
  #sessionId = "";
  #url;
  #username;
  #constants = {
    latestClientVersion: "2.5.32",
    latestServerVersion: "2.5.38",
    adminUserRights: [{ domain: "all", right: "all" }],
    defaultUserRights: [],
  };
  #messages = {
    failedAnonymousLogin: "Anonymous login failed.",
    failedFetch:
      "Fetch request failed: response status is not in the range 200-299.",
    failedLogin: "Login failed: invalid username or password.",
    failedLoginUnknown: "Login failed: unknown reason.",
    invalidCategory: "Syntax error: invalid category name.",
    missingClientData:
      "API response error: missing client data. Make sure the UrBackup user has appropriate rights.",
    missingGroupData:
      "API response error: missing group data. Make sure the UrBackup user has appropriate rights.",
    missingParameters: "Syntax error: missing or invalid parameters.",
    missingServerIdentity:
      "API response error: missing server identity. Make sure the UrBackup user has appropriate rights.",
    missingUserData:
      "API response error: missing user data. Make sure the UrBackup user has appropriate rights.",
    missingValues:
      "API response error: some values are missing. Make sure the UrBackup user has appropriate rights.",
    syntaxClientId: "Syntax error: clientId must be a number.",
    syntaxClientName: "Syntax error: clientName must be a string.",
    syntaxGroupId: "Syntax error: groupId must be a number.",
    syntaxGroupName: "Syntax error: groupName must be a string.",
  };

  /**
   * Creates an instance of UrbackupServer.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.url='http://127.0.0.1:55414'] - The URL of the server, must include the protocol, hostname, and port. Defaults to `http://127.0.0.1:55414`.
   * @param {string} [params.username=''] - The username used for logging in. If empty, anonymous login method will be used. Defaults to an empty string.
   * @param {string} [params.password=''] - The password used to log in. Defaults to an empty string.
   * @example <caption>Connect to the built-in server locally without a password</caption>
   * const server = new UrbackupServer();
   * @example <caption>Connect locally with a specified password</caption>
   * const server = new UrbackupServer({ url: 'http://127.0.0.1:55414', username: 'admin', password: 'secretpassword' });
   * @example <caption>Connect over the network</caption>
   * const server = new UrbackupServer({ url: 'https://192.168.0.2:443', username: 'admin', password: 'secretpassword' });
   */
  constructor({
    url = "http://127.0.0.1:55414",
    username = "",
    password = "",
  } = {}) {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Syntax error: URL protocol must be http: or https:.");
    }
    this.#url = parsedUrl;
    this.#url.pathname = "x";
    this.#username = typeof username === "string" ? username : "";
    this.#password = typeof password === "string" ? password : "";
  }

  /**
   * Clears the session ID and logged-in flag.
   * This method is intended for internal use only and should not be called outside the class.
   * @private
   * @example
   * this.#clearLoginStatus();
   */
  #clearLoginStatus() {
    this.#sessionId = "";
    this.#isLoggedIn = false;
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
  async #fetchJson(action = "", bodyParams = {}) {
    const url = new URL(this.#url);
    url.searchParams.set("a", action);
    // this.#url.searchParams.set('a', action);

    if (this.#sessionId.length > 0) {
      bodyParams.ses = this.#sessionId;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "user-agent": "node-urbackup-server-api",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(bodyParams).toString(),
    });

    if (response?.ok === true) {
      return await response.json();
    }

    throw new Error(this.#messages.failedFetch);
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
  async #hashPassword(salt = "", rounds = 10_000, randomKey = "") {
    // NOTE: Async PBKDF2 wrapper.
    const pbkdf2Async = (inputHash) => {
      const keyLength = 32;
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(
          inputHash,
          salt,
          rounds,
          keyLength,
          "sha256",
          (error, key) => (error ? reject(error) : resolve(key)),
        );
      });
    };

    let passwordHash = crypto
      .createHash("md5")
      .update(salt + this.#password, "utf8")
      .digest();

    let derivedKey;
    if (rounds > 0) {
      derivedKey = await pbkdf2Async(passwordHash);
    }

    passwordHash = crypto
      .createHash("md5")
      .update(
        randomKey + (rounds > 0 ? derivedKey.toString("hex") : passwordHash),
        "utf8",
      )
      .digest("hex");

    return passwordHash;
  }

  /**
   * Generates an MD5 hashed password using a salt and a password.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {string} salt - The salt to use for hashing.
   * @param {string} password - The password to hash.
   * @returns {string} The MD5 hashed password.
   * @private
   * @example
   * const pwmd5 = this.#hashPasswordMd5(this.#generateRandomString(50), password);
   */
  #hashPasswordMd5(salt, password) {
    const hash = crypto.createHash("md5");
    hash.update(salt + password);
    return hash.digest("hex");
  }

  /**
   * Generates a random string of the specified length using a set of alphanumeric characters.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {number} length - The desired length of the random string.
   * @returns {string} The generated random alphanumeric string.
   * @private
   * @example
   * const randomStr = this.#generateRandomString(10);
   */
  #generateRandomString(length) {
    const charactersSet =
      // biome-ignore lint/security/noSecrets: false positive
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const charactersLength = charactersSet.length;

    const randomBytes = crypto.randomBytes(length);
    let randomString = "";

    for (let i = 0; i < length; i += 1) {
      const randomValue = randomBytes[i] % charactersLength;
      randomString += charactersSet[randomValue];
    }

    return randomString;
  }

  /**
   * Encodes user rights into an appropriate string format.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {Array<object>} rights - An array of objects representing user rights.
   * @param {string} rights[].domain - The domain of the right.
   * @param {string} rights[].right - The specific right.
   * @returns {string} The encoded query string representing user rights.
   * @private
   * @example
   * const encodedRights = this.#encodeUserRights([{ domain: 'all', right: 'all' }]);
   */
  #encodeUserRights(rights) {
    let encodedRights = "";
    const indices = [];
    let index = 0;

    while (index < rights.length) {
      const { domain, right } = rights[index];

      if (index !== 0) {
        encodedRights += "&";
      }

      encodedRights += `${index}_domain=${domain}&${index}_right=${right}`;
      indices.push(index);

      index += 1;
    }

    encodedRights += `&idx=${indices.join(",")}`;

    return encodedRights;
  }

  /**
   * Compares two version strings to determine if the installed version is older than the available version.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {string} installed - The installed version string in the format 'major.minor.patch'.
   * @param {string} available - The available version string in the format 'major.minor.patch'.
   * @returns {boolean} Returns `true` if the installed version is older than the available version, or `false` otherwise.
   * @private
   * @example
   * this.#compareVersion(serverVersion.string, this.#constants.latestServerVersion);
   */
  #compareVersion(installed, available) {
    const parseVersion = (version) => version.split(".").map(Number);

    const [installedMajor, installedMinor, installedPatch] =
      parseVersion(installed);
    const [availableMajor, availableMinor, availablePatch] =
      parseVersion(available);

    if (installedMajor !== availableMajor) {
      return installedMajor < availableMajor;
    }

    if (installedMinor !== availableMinor) {
      return installedMinor < availableMinor;
    }

    if (installedPatch !== availablePatch) {
      return installedPatch < availablePatch;
    }

    return false;
  }

  /**
   * Determines whether a given client is considered "blank" (i.e., without any backups).
   * This method is intended for internal use only and should not be called outside the class.
   * A client is considered "blank" if either file backups or image backups have never been performed and the respective backup type is not disabled.
   * @param {object} params - Options for determining the blank state.
   * @param {object} params.client - The client object to evaluate.
   * @param {boolean} [params.includeFileBackups=true] - Whether to include file backups in the blank evaluation. Defaults to true.
   * @param {boolean} [params.includeImageBackups=true] - Whether to include image backups in the blank evaluation. Defaults to true.
   * @returns {boolean} Returns `true` if the client is considered "blank", or `false` otherwise.
   * @private
   * @example
   * this.#isBlankClient({ client });
   */
  #isBlankClient({
    client,
    includeFileBackups = true,
    includeImageBackups = true,
  } = {}) {
    const isBlankFileBackup =
      includeFileBackups === true &&
      client.lastbackup === 0 &&
      client.file_disabled !== true;

    const isBlankImageBackup =
      includeImageBackups === true &&
      client.lastbackup_image === 0 &&
      client.image_disabled !== true;

    return isBlankFileBackup === true || isBlankImageBackup === true;
  }

  /**
   * Determines whether a given client is considered "failed" based on its backup statuses.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {object} params - The options for determining the failure state.
   * @param {object} params.client - The client object to evaluate.
   * @param {boolean} params.includeFileBackups - Whether to include file backups in the failure evaluation.
   * @param {boolean} params.includeImageBackups - Whether to include image backups in the failure evaluation.
   * @param {boolean} params.failOnFileIssues - Whether to fail the client if file backup issues are detected.
   * @returns {boolean} Returns `true` if the client is considered "failed" (either due to file or image backup failure), or `false` otherwise.
   * @private
   * @example
   * this.#isFailedClient({ client, includeFileBackups: true, includeImageBackups: true, failOnFileIssues: false });
   */
  #isFailedClient({
    client,
    includeFileBackups,
    includeImageBackups,
    failOnFileIssues,
  } = {}) {
    const isFailedFileBackup =
      includeFileBackups === true &&
      client.file_disabled !== true &&
      (failOnFileIssues === true
        ? client.last_filebackup_issues !== 0 || client.file_ok !== true
        : client.file_ok !== true) === true;

    const isFailedImageBackup =
      includeImageBackups === true &&
      client.image_disabled !== true &&
      client.image_ok !== true;

    return isFailedFileBackup === true || isFailedImageBackup === true;
  }

  /**
   * Determines whether a given client is considered "stale".
   * A client is considered "stale" if the time elapsed since their last file or image backup exceeds the given time threshold,
   * and the respective backup type is not disabled.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {object} params - Options for determining the stale state.
   * @param {object} params.client - The client object to evaluate.
   * @param {boolean} params.includeFileBackups - Whether to include file backups in the stale evaluation.
   * @param {boolean} params.includeImageBackups - Whether to include image backups in the stale evaluation.
   * @param {number} params.time - The current timestamp (in seconds).
   * @param {number} params.timeThreshold - The time threshold (in minutes) used to determine staleness.
   * @returns {boolean} Returns `true` if the client is considered "stale" (either for file or image backups), or `false` otherwise.
   * @private
   * @example
   * this.#isStaleClient({ client, includeFileBackups: true, includeImageBackups: true, time, timeThreshold });
   */
  #isStaleClient({
    client,
    includeFileBackups,
    includeImageBackups,
    time,
    timeThreshold,
  } = {}) {
    const isStaleFileBackup =
      includeFileBackups === true &&
      client.file_disabled !== true &&
      Math.round((time - (client.lastbackup ?? 0)) / 60) >= timeThreshold;

    const isStaleImageBackup =
      includeImageBackups === true &&
      client.image_disabled !== true &&
      Math.round((time - (client.lastbackup_image ?? 0)) / 60) >= timeThreshold;

    return isStaleFileBackup === true || isStaleImageBackup === true;
  }

  /**
   * Logs in to the server.
   * This method is intended for internal use only and should not be called outside the class.
   * If the username is empty, then the anonymous login method is used.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the login was successful or if the user was already logged in, or `false` otherwise.
   * @throws {Error} If the login fails.
   * @private
   * @example
   * const login = await this.#login();
   */
  async #login() {
    // NOTE: Use a semaphore to prevent race conditions with the login status, i.e., this.#sessionId
    const [_value, release] = await this.#semaphore.acquire();
    try {
      if (this.#isLoggedIn === true && this.#sessionId.length > 0) {
        return true;
      }

      if (this.#username.length === 0) {
        const anonymousLoginResponse = await this.#fetchJson("login");

        if (anonymousLoginResponse?.success === true) {
          this.#sessionId = anonymousLoginResponse.session;
          this.#isLoggedIn = true;
          return true;
        }

        this.#clearLoginStatus();
        throw new Error(this.#messages.failedAnonymousLogin);
      }

      const saltResponse = await this.#fetchJson("salt", {
        username: this.#username,
      });

      if (typeof saltResponse?.salt === "string") {
        this.#sessionId = saltResponse.ses;
        const hashedPassword = await this.#hashPassword(
          saltResponse.salt,
          saltResponse.pbkdf2_rounds,
          saltResponse.rnd,
        );
        const userLoginResponse = await this.#fetchJson("login", {
          username: this.#username,
          password: hashedPassword,
        });

        if (userLoginResponse?.success === true) {
          this.#isLoggedIn = true;
          return true;
        }
      }

      // NOTE: Invalid username
      this.#clearLoginStatus();
      throw new Error(this.#messages.failedLogin);
    } finally {
      release();
    }
  }

  /**
   * Maps client name to client ID or client ID to client name.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {string|number} inputIdentifier - The client's name or ID.
   * @param {string} outputIdentifierType - The type of output identifier. Must be: 'name' or 'id'.
   * @returns {Promise<number|string|null>} The client's ID or name, or `null` if no matching client is found.
   * @throws {Error} If the `inputIdentifier` is not a string when `outputIdentifierType` is 'name' or not a number when `outputIdentifierType` is 'id'.
   * @private
   * @example
   * const clientId = await this.#getClientIdentifier('dbserver', 'id');
   * const clientName = await this.#getClientIdentifier(42, 'name');
   */
  async #getClientIdentifier(inputIdentifier, outputIdentifierType) {
    if (
      (outputIdentifierType === "id" && typeof inputIdentifier !== "string") ||
      (outputIdentifierType === "name" && typeof inputIdentifier !== "number")
    ) {
      throw new Error(
        outputIdentifierType === "id"
          ? this.#messages.syntaxClientName
          : this.#messages.syntaxClientId,
      );
    }

    const fallbackReturnValue = null;
    const clients = await this.getClients({ includeRemoved: true });

    let result;
    if (outputIdentifierType === "id") {
      result = clients.find((client) => client.name === inputIdentifier)?.id;
    } else if (outputIdentifierType === "name") {
      result = clients.find((client) => client.id === inputIdentifier)?.name;
    }

    return typeof result === "undefined" ? fallbackReturnValue : result;
  }

  /**
   * Maps group name to group ID or group ID to group name.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {string|number} inputIdentifier - The group's name or ID.
   * @param {string} outputIdentifierType - The type of output identifier. Must be: 'name' or 'id'.
   * @returns {Promise<number|string|null>} The group's ID or name, or `null` if no matching group is found.
   * @throws {Error} If the `inputIdentifier` is not a string when `outputIdentifierType` is 'name' or not a number when `outputIdentifierType` is 'id'.
   * @private
   * @example
   * const groupId = await this.#getGroupIdentifier('hr', 'id');
   * const groupName = await this.#getGroupIdentifier(2, 'name');
   */
  async #getGroupIdentifier(inputIdentifier, outputIdentifierType) {
    if (
      (outputIdentifierType === "id" && typeof inputIdentifier !== "string") ||
      (outputIdentifierType === "name" && typeof inputIdentifier !== "number")
    ) {
      throw new Error(
        outputIdentifierType === "id"
          ? this.#messages.syntaxGroupName
          : this.#messages.syntaxGroupId,
      );
    }

    const fallbackReturnValue = null;
    const groups = await this.getGroups();

    let result;
    if (outputIdentifierType === "id") {
      result = groups.find((group) => group.name === inputIdentifier)?.id;
    } else if (outputIdentifierType === "name") {
      result = groups.find((group) => group.id === inputIdentifier)?.name;
    }

    return typeof result === "undefined" ? fallbackReturnValue : result;
  }

  /**
   * Retrieves server identity.
   * @returns {Promise<string>} A promise that resolves to the server identity string.
   * @throws {Error} If the API response is missing required values or if the login fails.
   * @example <caption>Get server identity</caption>
   * server.getServerIdentity().then(data => console.log(data));
   */
  async getServerIdentity() {
    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const statusResponse = await this.#fetchJson("status");

    if (typeof statusResponse?.server_identity === "string") {
      return statusResponse.server_identity;
    }

    throw new Error(this.#messages.missingServerIdentity);
  }

  /**
   * Retrieves the server version in both number and string representation.
   * @returns {Promise<object>} A promise that resolves to an object containing the server version number and string.
   * @throws {Error} If the API response is missing required values or if the login fails.
   * @example <caption>Get server version</caption>
   * server.getServerVersion().then(data => console.log(data));
   * @example <caption>Get server version string</caption>
   * server.getServerVersion().then(data => console.log(data.string));
   */
  async getServerVersion() {
    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const serverVersion = { number: null, string: null };

    const statusResponse = await this.#fetchJson("status");

    if (typeof statusResponse?.curr_version_num === "number") {
      serverVersion.number = statusResponse.curr_version_num;
    } else {
      throw new Error(this.#messages.missingValues);
    }

    if (typeof statusResponse?.curr_version_str === "string") {
      serverVersion.string = statusResponse.curr_version_str;
    } else {
      throw new Error(this.#messages.missingValues);
    }

    return serverVersion;
  }

  /**
   * Checks if the server version is outdated compared to the available version.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the server version is outdated, or `false` otherwise.
   * @throws {Error} If the API response is missing required values or if the login fails.
   * @example
   * server.isServerOutdated().then(isOutdated => console.log(isOutdated));
   */
  async isServerOutdated() {
    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const serverVersion = await this.getServerVersion();

    return this.#compareVersion(
      serverVersion.string,
      this.#constants.latestServerVersion,
    );
  }

  /**
   * Retrieves a list of users.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing users. Returns an empty array when no users are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all users</caption>
   * server.getUsers().then(data => console.log(data));
   */
  async getUsers() {
    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const usersResponse = await this.#fetchJson("settings", {
      sa: "listusers",
    });

    if (Array.isArray(usersResponse?.users)) {
      return usersResponse.users;
    }

    throw new Error(this.#messages.missingUserData);
  }

  /**
   * Adds a new user with the specified username, password, and rights.
   * @param {object} params - An object containing parameters.
   * @param {string} params.userName - The username for the new user.
   * @param {string} params.password - The password for the new user.
   * @param {boolean} [params.isAdmin=false] - Whether the new user should have admin rights (all domains, all rights). Defaults to false.
   * @param {Array<object>} [params.rights] - Array of user permissions. Ignored if `isAdmin` is true. Defaults to the default user rights.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the user was added successfully, or `false` otherwise.
   * @throws {Error} If required parameters are missing, the login fails, or the API response is missing expected values.
   * @example <caption>Add a regular user with 'status(all)' rights</caption>
   * server.addUser({ userName: 'newUser', password: 'secret', rights: [{ domain: "status", right: "all" }] }).then(result => console.log(result));
   * @example <caption>Add an admin user</caption>
   * server.addUser({ userName: 'newAdminUser', password: 'secret', isAdmin: true }).then(result => console.log(result));
   */
  async addUser({
    userName,
    password,
    isAdmin = false,
    rights = this.#constants.defaultUserRights,
  } = {}) {
    if (
      typeof userName !== "string" ||
      userName.length === 0 ||
      typeof password !== "string" ||
      password.length === 0 ||
      (typeof isAdmin !== "undefined" && typeof isAdmin !== "boolean") ||
      (typeof rights !== "undefined" && !Array.isArray(rights))
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    // NOTE: Server expects an alphanumeric string (no special characters), hence an additional method is needed
    const stringLength = 50;
    const salt = this.#generateRandomString(stringLength);

    const response = await this.#fetchJson("settings", {
      sa: "useradd",
      name: userName,
      pwmd5: this.#hashPasswordMd5(salt, password),
      salt: salt,
      rights: this.#encodeUserRights(
        isAdmin ? this.#constants.adminUserRights : rights,
      ),
    });

    // NOTE: "alread_exists" is intentional, upstream typo
    if ("add_ok" in response || "alread_exists" in response) {
      return response.add_ok === true;
    }

    throw new Error(this.#messages.missingValues);
  }

  /**
   * Removes a user by their user ID.
   * @param {object} params - An object containing parameters.
   * @param {number} params.userId - The ID of the user to be removed.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the user was successfully removed, or `false` otherwise.
   * @throws {Error} If the `userId` parameter is missing or invalid, or if the login fails.
   * @example <caption>Remove a user by their ID</caption>
   * server.removeUser({ userId: 123 }).then(status => console.log(status));
   */
  async removeUser({ userId } = {}) {
    if (typeof userId !== "number" || userId <= 0) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    let operationStatus = false;

    const users = await this.getUsers();

    if (
      typeof users.find((user) => user.id === userId.toString(10)) !==
      "undefined"
    ) {
      const response = await this.#fetchJson("settings", {
        sa: "removeuser",
        userid: userId.toString(10),
      });

      operationStatus =
        typeof response.users.find(
          (user) => user.id === userId.toString(10),
        ) === "undefined";
    }

    return operationStatus;
  }

  /**
   * Retrieves the rights of a specific user.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.userId] - The user's ID. Takes precedence if both `userId` and `userName` are defined.
   * @param {string} [params.userName=this.#username] - The user's name. Ignored if `userId` is defined. Defaults to the username of the current session.
   * @returns {Promise<Array|null>} A promise that resolves to an array of user rights, or `null` if the user is not found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get user rights of the current session user</caption>
   * server.getUserRights().then(data => console.log(data));
   * @example <caption>Get user rights by user ID</caption>
   * server.getUserRights({ userId: '12345' }).then(data => console.log(data));
   * @example <caption>Get user rights by user name</caption>
   * server.getUserRights({ userName: 'john_doe' }).then(data => console.log(data));
   */
  async getUserRights({ userId, userName = this.#username } = {}) {
    if (
      (typeof userId !== "undefined" && typeof userId !== "string") ||
      (typeof userId === "string" && userId.length === 0) ||
      (typeof userName !== "undefined" && typeof userName !== "string")
      // NOTE: allow empty user name for anonymous mode
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const fallbackReturnValue = null;
    const allUsers = await this.getUsers();

    let userRights;
    if (typeof userId === "string") {
      userRights = allUsers.find((user) => user.id === userId)?.rights;
    } else if (typeof userName === "string") {
      userRights = allUsers.find((user) => user.name === userName)?.rights;
    } else {
      return fallbackReturnValue;
    }

    return Array.isArray(userRights) ? userRights : fallbackReturnValue;
  }

  /**
   * Retrieves a list of groups.
   * By default, UrBackup clients are added to a group with ID 0 and an empty name (empty string).
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing groups. Returns an empty array when no groups are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all groups</caption>
   * server.getGroups().then(data => console.log(data));
   */
  async getGroups() {
    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const settingsResponse = await this.#fetchJson("settings");

    if (Array.isArray(settingsResponse?.navitems?.groups)) {
      return settingsResponse.navitems.groups;
    }

    throw new Error(this.#messages.missingGroupData);
  }

  /**
   * Adds a new group.
   * @param {object} params - An object containing parameters.
   * @param {string} params.groupName - The group name. Must be unique and cannot be an empty string.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the group was added successfully, or `false` otherwise.
   * @throws {Error} If the groupName is missing or invalid, or if the API response is missing expected values.
   * @example <caption>Add new group</caption>
   * server.addGroup({ groupName: 'prod' }).then(data => console.log(data));
   */
  async addGroup({ groupName } = {}) {
    if (typeof groupName !== "string") {
      throw new Error(this.#messages.missingParameters);
    }

    // NOTE: Fail early due to a possible UrBackup bug (server does not allow adding multiple groups with the same name,
    // but allows empty string which is the same as default group name)
    if (groupName.length === 0) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const response = await this.#fetchJson("settings", {
      sa: "groupadd",
      name: groupName,
    });

    if ("add_ok" in response || "already_exists" in response) {
      return response?.add_ok === true;
    }

    throw new Error(this.#messages.missingGroupData);
  }

  /**
   * Removes a group.
   * All clients in this group will be reassigned to the default group. Does not allow removal of the default group (ID: 0, name: '').
   * @param {object} params - An object containing parameters.
   * @param {number} params.groupId - Group ID. Must be greater than 0. Takes precedence if both `groupId` and `groupName` are defined. Required if `groupName` is undefined.
   * @param {string} params.groupName - Group name. Must be different than empty string. Ignored if both `groupId` and `groupName` are defined. Required if `groupId` is undefined.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the removal is successful, or `false` otherwise.
   * @throws {Error} If both `groupId` and `groupName` are missing or invalid, or if the login fails.
   * @example <caption>Remove group</caption>
   * server.removeGroup({ groupId: 1 }).then(data => console.log(data));
   * server.removeGroup({ groupName: 'prod' }).then(data => console.log(data));
   */
  async removeGroup({ groupId, groupName } = {}) {
    if (
      (typeof groupId === "undefined" && typeof groupName === "undefined") ||
      (typeof groupId !== "undefined" && typeof groupId !== "number") ||
      (typeof groupId === "number" && groupId <= 0) ||
      (typeof groupName !== "undefined" && typeof groupName !== "string") ||
      (typeof groupName === "string" && groupName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    let mappedGroupId;

    if (typeof groupId === "undefined") {
      mappedGroupId = await this.#getGroupIdentifier(groupName, "id");
      if (mappedGroupId === 0 || mappedGroupId === null) {
        return false;
      }
    } else {
      // NOTE: Fail early due to a possible UrBackup bug where the server returns delete_ok:true even when
      // attempting to delete a non-existent group ID
      const mappedGroupName = await this.#getGroupIdentifier(groupId, "name");
      if (mappedGroupName === null) {
        return false;
      }
    }

    const response = await this.#fetchJson("settings", {
      sa: "groupremove",
      id: groupId ?? mappedGroupId,
    });

    return response?.delete_ok === true;
  }

  /**
   * Retrieves a list of clients who are members of a given group.
   * This is only a convenience method that wraps the `getClients()` method.
   * @param {object} params - An object containing parameters.
   * @param {number} params.groupId - Group ID. Takes precedence if both `groupId` and `groupName` are defined. Required if `groupName` is undefined.
   * @param {string} params.groupName - Group name. Ignored if both `groupId` and `groupName` are defined. Required if `groupId` is undefined.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients matching the search criteria. Returns an empty array when no matching clients are found.
   * @throws {Error} If both `groupId` and `groupName` are missing or invalid.
   * @example <caption>Get members of default group</caption>
   * server.getGroupMembers({ groupId: 0 }).then(data => console.log(data));
   * @example <caption>Get all clients belonging to a specific group</caption>
   * server.getGroupMembers({ groupName: 'office' }).then(data => console.log(data));
   */
  async getGroupMembers({ groupId, groupName } = {}) {
    if (
      (typeof groupId === "undefined" && typeof groupName === "undefined") ||
      (typeof groupId !== "undefined" && typeof groupId !== "number") ||
      (typeof groupId === "number" && groupId < 0) ||
      (typeof groupName !== "undefined" && typeof groupName !== "string")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const fallbackReturnValue = [];

    let mappedGroupName;
    if (typeof groupId !== "undefined") {
      mappedGroupName = await this.#getGroupIdentifier(groupId, "name");
      if (mappedGroupName === null) {
        return fallbackReturnValue;
      }
    }

    const groupMembers = await this.getClients({
      groupName: mappedGroupName ?? groupName,
    });

    return groupMembers;
  }

  /**
   * Retrieves a list of clients.
   * By default, this method matches all clients, including those marked for removal.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.groupName] - Group name. Defaults to undefined, which matches all groups.
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
    if (
      (typeof groupName !== "undefined" && typeof groupName !== "string") ||
      (typeof includeRemoved !== "undefined" &&
        typeof includeRemoved !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const clients = [];
    const statusResponse = await this.#fetchJson("status");

    if (Array.isArray(statusResponse?.status)) {
      for (const client of statusResponse.status) {
        if (typeof groupName === "string" && groupName !== client.groupname) {
          continue;
        }

        if (includeRemoved === false && client.delete_pending === "1") {
          continue;
        }

        clients.push(client);
      }

      return clients;
    }

    throw new Error(this.#messages.missingClientData);
  }

  /**
   * Retrieves a list of clients marked for removal.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.groupName] - Group name. Defaults to undefined, which matches all groups.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get clients marked for removal</caption>
   * server.getRemovedClients().then(data => console.log(data));
   * @example <caption>Get clients marked for removal in a specific group</caption>
   * server.getRemovedClients({ groupName: 'sales' }).then(data => console.log(data));
   */
  async getRemovedClients({ groupName } = {}) {
    if (typeof groupName !== "undefined" && typeof groupName !== "string") {
      throw new Error(this.#messages.missingParameters);
    }

    return await this.getClients({ groupName, includeRemoved: true }).then(
      (removedClients) =>
        removedClients.filter((client) => client.delete_pending === "1"),
    );
  }

  /**
   * Retrieves a list of online clients.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.groupName] - Group name. Defaults to undefined, which matches all groups.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @param {boolean} [params.includeBlank=true] - Whether or not blank clients should be taken into account when matching clients. Defaults to true.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all online clients</caption>
   * server.getOnlineClients().then(data => console.log(data));
   * @example <caption>Get online clients from a specific group</caption>
   * server.getOnlineClients({ groupName: 'servers' }).then(data => console.log(data));
   */
  async getOnlineClients({
    groupName,
    includeRemoved = true,
    includeBlank = true,
  } = {}) {
    if (
      (typeof groupName !== "undefined" && typeof groupName !== "string") ||
      (typeof includeRemoved !== "undefined" &&
        typeof includeRemoved !== "boolean") ||
      (typeof includeBlank !== "undefined" && typeof includeBlank !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const clients = await this.getClients({ groupName, includeRemoved });
    const onlineClients = [];

    for (const client of clients) {
      if (client.online !== true) {
        continue;
      }

      if (
        includeBlank === true ||
        this.#isBlankClient({
          client,
          includeFileBackups: true,
          includeImageBackups: true,
        }) === false
      ) {
        onlineClients.push(client);
      }
    }

    return onlineClients;
  }

  /**
   * Retrieves a list of offline clients.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.groupName] - Group name. Defaults to undefined, which matches all groups.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @param {boolean} [params.includeBlank=true] - Whether or not blank clients should be taken into account when matching clients. Defaults to true.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all offline clients</caption>
   * server.getOfflineClients().then(data => console.log(data));
   * @example <caption>Get offline clients, skip clients marked for removal</caption>
   * server.getOfflineClients({ includeRemoved: false }).then(data => console.log(data));
   * @example <caption>Get offline clients from a specific group</caption>
   * server.getOfflineClients({ groupName: 'servers' }).then(data => console.log(data));
   */
  async getOfflineClients({
    groupName,
    includeRemoved = true,
    includeBlank = true,
  } = {}) {
    if (
      (typeof groupName !== "undefined" && typeof groupName !== "string") ||
      (typeof includeRemoved !== "undefined" &&
        typeof includeRemoved !== "boolean") ||
      (typeof includeBlank !== "undefined" && typeof includeBlank !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const clients = await this.getClients({ groupName, includeRemoved });
    const offlineClients = [];

    for (const client of clients) {
      if (client.online === true) {
        continue;
      }

      if (
        includeBlank === true ||
        this.#isBlankClient({
          client,
          includeFileBackups: true,
          includeImageBackups: true,
        }) === false
      ) {
        offlineClients.push(client);
      }
    }

    return offlineClients;
  }

  /**
   * Retrieves a list of active clients.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.groupName] - Group name. Defaults to undefined, which matches all groups.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all active clients</caption>
   * server.getActiveClients().then(data => console.log(data));
   */
  async getActiveClients({ groupName, includeRemoved = true } = {}) {
    if (
      (typeof groupName !== "undefined" && typeof groupName !== "string") ||
      (typeof includeRemoved !== "undefined" &&
        typeof includeRemoved !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    return await this.getClients({ groupName, includeRemoved }).then(
      (activeClients) => activeClients.filter((client) => client.status !== 0),
    );
  }

  /**
   * Retrieves a list of blank clients, i.e., clients without any finished file and/or image backups.
   * Matching empty clients considers whether file backups or image backups are enabled.
   * By default, it matches clients without both file and image backups.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.groupName] - Group name. Defaults to undefined, which matches all groups.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @param {boolean} [params.includeFileBackups=true] - Whether or not file backups should be taken into account when matching clients. Defaults to true.
   * @param {boolean} [params.includeImageBackups=true] - Whether or not image backups should be taken into account when matching clients. Defaults to true.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all blank clients, i.e., clients without both file and image backups</caption>
   * server.getBlankClients().then(data => console.log(data));
   * @example <caption>Get blank clients, skip clients marked for removal</caption>
   * server.getBlankClients({ includeRemoved: false }).then(data => console.log(data));
   * @example <caption>Get clients without any file backups</caption>
   * server.getBlankClients({ includeImageBackups: false }).then(data => console.log(data));
   * @example <caption>Get clients without any image backups</caption>
   * server.getBlankClients({ includeFileBackups: false }).then(data => console.log(data));
   */
  async getBlankClients({
    groupName,
    includeRemoved = true,
    includeFileBackups = true,
    includeImageBackups = true,
  } = {}) {
    if (
      (typeof groupName !== "undefined" && typeof groupName !== "string") ||
      (typeof includeRemoved !== "undefined" &&
        typeof includeRemoved !== "boolean") ||
      (typeof includeFileBackups !== "undefined" &&
        typeof includeFileBackups !== "boolean") ||
      (typeof includeImageBackups !== "undefined" &&
        typeof includeImageBackups !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const clients = await this.getClients({ groupName, includeRemoved });
    const blankClients = [];

    for (const client of clients) {
      if (
        this.#isBlankClient({
          client,
          includeFileBackups,
          includeImageBackups,
        }) === true
      ) {
        blankClients.push(client);
      }
    }

    return blankClients;
  }

  /**
   * Retrieves a list of failed clients, i.e., clients with failed backup status.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.groupName] - Group name. Defaults to undefined, which matches all groups.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @param {boolean} [params.includeBlank=true] - Whether or not blank clients should be taken into account when matching clients. Defaults to true.
   * @param {boolean} [params.includeFileBackups=true] - Whether or not file backups should be taken into account when matching clients. Defaults to true.
   * @param {boolean} [params.includeImageBackups=true] - Whether or not image backups should be taken into account when matching clients. Defaults to true.
   * @param {boolean} [params.failOnFileIssues=false] - Whether or not to treat file backups finished with issues as being failed. Defaults to false.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get clients with failed file or image backups</caption>
   * server.getFailedClients().then(data => console.log(data));
   * @example <caption>Get failed clients, skip clients marked for removal</caption>
   * server.getFailedClients({ includeRemoved: false }).then(data => console.log(data));
   * @example <caption>Get clients with failed file backups</caption>
   * server.getFailedClients({ includeImageBackups: false }).then(data => console.log(data));
   * @example <caption>Get clients with failed image backups</caption>
   * server.getFailedClients({ includeFileBackups: false }).then(data => console.log(data));
   */
  async getFailedClients({
    groupName,
    includeRemoved = true,
    includeBlank = true,
    includeFileBackups = true,
    includeImageBackups = true,
    failOnFileIssues = false,
  } = {}) {
    if (
      (typeof groupName !== "undefined" && typeof groupName !== "string") ||
      (typeof includeRemoved !== "undefined" &&
        typeof includeRemoved !== "boolean") ||
      (typeof includeBlank !== "undefined" &&
        typeof includeBlank !== "boolean") ||
      (typeof includeFileBackups !== "undefined" &&
        typeof includeFileBackups !== "boolean") ||
      (typeof includeImageBackups !== "undefined" &&
        typeof includeImageBackups !== "boolean") ||
      (typeof failOnFileIssues !== "undefined" &&
        typeof failOnFileIssues !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const clients = await this.getClients({ groupName, includeRemoved });
    const failedClients = [];

    for (const client of clients) {
      if (
        this.#isFailedClient({
          client,
          includeFileBackups,
          includeImageBackups,
          failOnFileIssues,
        }) === true
      ) {
        if (includeBlank === true) {
          failedClients.push(client);
          continue;
        }

        if (
          this.#isBlankClient({
            client,
            includeFileBackups,
            includeImageBackups,
          }) === false
        ) {
          failedClients.push(client);
          // continue;
        }
      }
    }

    return failedClients;
  }

  /**
   * Retrieves a list of OK clients, i.e., clients with OK backup status.
   * File backups finished with issues are treated as OK by default.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.groupName] - Group name. Defaults to undefined, which matches all groups.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @param {boolean} [params.includeFileBackups=true] - Whether or not file backups should be taken into account when matching clients. Defaults to true.
   * @param {boolean} [params.includeImageBackups=true] - Whether or not image backups should be taken into account when matching clients. Defaults to true.
   * @param {boolean} [params.failOnFileIssues=false] - Whether or not to treat file backups finished with issues as being failed. Defaults to false.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get OK clients, use default parameters</caption>
   * server.getOkClients().then(data => console.log(data));
   * @example <caption>Get OK clients, skip clients marked for removal</caption>
   * server.getOkClients({ includeRemoved: false }).then(data => console.log(data));
   * @example <caption>Get clients with OK file backup, skip image backup status</caption>
   * server.getOkClients({ includeImageBackups: false }).then(data => console.log(data));
   * @example <caption>Get clients with OK file backup but treat backup issues as a failure, skip image backup status</caption>
   * server.getOkClients({ includeImageBackups: false, failOnFileIssues: true }).then(data => console.log(data));
   */
  async getOkClients({
    groupName,
    includeRemoved = true,
    includeFileBackups = true,
    includeImageBackups = true,
    failOnFileIssues = false,
  } = {}) {
    if (
      (typeof groupName !== "undefined" && typeof groupName !== "string") ||
      (typeof includeRemoved !== "undefined" &&
        typeof includeRemoved !== "boolean") ||
      (typeof includeFileBackups !== "undefined" &&
        typeof includeFileBackups !== "boolean") ||
      (typeof includeImageBackups !== "undefined" &&
        typeof includeImageBackups !== "boolean") ||
      (typeof failOnFileIssues !== "undefined" &&
        typeof failOnFileIssues !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const clients = await this.getClients({ groupName, includeRemoved });
    const okClients = [];

    for (const client of clients) {
      const isOkFileBackup =
        includeFileBackups === true &&
        client.file_disabled !== true &&
        (failOnFileIssues === true
          ? client.last_filebackup_issues === 0 && client.file_ok === true
          : client.file_ok === true) === true;

      const isOkImageBackup =
        includeImageBackups === true &&
        client.image_disabled !== true &&
        client.image_ok === true;

      if (isOkFileBackup || isOkImageBackup) {
        okClients.push(client);
      }
    }

    return okClients;
  }

  /**
   * Retrieves a list of clients using an outdated version.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.groupName] - Group name. Defaults to undefined, which matches all groups.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all outdated clients</caption>
   * server.getOutdatedClients().then(data => console.log(data));
   * @example <caption>Get outdated clients in a specific group</caption>
   * server.getOutdatedClients({ groupName: 'exampleGroup' }).then(data => console.log(data));
   * @example <caption>Get outdated clients, exclude clients marked for removal</caption>
   * server.getOutdatedClients({ includeRemoved: false }).then(data => console.log(data));
   */
  async getOutdatedClients({ groupName, includeRemoved = true } = {}) {
    if (
      (typeof groupName !== "undefined" && typeof groupName !== "string") ||
      (typeof includeRemoved !== "undefined" &&
        typeof includeRemoved !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const clients = await this.getClients({ groupName, includeRemoved });

    const outdatedClients = clients.filter((client) =>
      this.#compareVersion(
        client.client_version_string,
        this.#constants.latestClientVersion,
      ),
    );

    return outdatedClients;
  }

  /**
   * Retrieves a list of online clients with the same, i.e., conflicting IP address.
   * @param {object} [params] - An optional object containing parameters.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get all online clients with conflicting IP addresses</caption>
   * server.getConflictingClients().then(data => console.log(data));
   * @example <caption>Get online clients with conflicting IP addresses, exclude clients marked for removal</caption>
   * server.getConflictingClients({ includeRemoved: false }).then(data => console.log(data));
   */
  async getConflictingClients({ includeRemoved = true } = {}) {
    if (
      typeof includeRemoved !== "undefined" &&
      typeof includeRemoved !== "boolean"
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const onlineClients = await this.getOnlineClients({
      includeRemoved,
      includeBlank: true,
    });
    const seenIpAddresses = new Set();
    const conflictingClients = new Set();

    for (const client of onlineClients) {
      if (client.ip.length > 0 && client.ip !== "-") {
        if (seenIpAddresses.has(client.ip)) {
          conflictingClients.add(client);
        } else {
          seenIpAddresses.add(client.ip);
        }
      }
    }

    return Array.from(conflictingClients);
  }

  /**
   * Retrieves a list of clients who have not been seen for a specified period of time. Defaults to 24 hours.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.groupName] - Group name. Defaults to undefined, which matches all groups.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @param {boolean} [params.includeBlank=true] - Whether or not blank clients should be taken into account when matching clients. Defaults to true.
   * @param {number} [params.timeThreshold=1440] - A time threshold, measured in minutes, after which a client is considered unseen. Defaults to 1440 minutes (24 hours).
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing clients. Returns an empty array when no matching clients are found.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get clients not seen for more than 2 days</caption>
   * server.getUnseenClients({ timeThreshold: 2880 }).then(data => console.log(data));
   */
  async getUnseenClients({
    groupName,
    includeRemoved = true,
    includeBlank = true,
    timeThreshold = 1440,
  } = {}) {
    if (
      (typeof groupName !== "undefined" && typeof groupName !== "string") ||
      (typeof includeRemoved !== "undefined" &&
        typeof includeRemoved !== "boolean") ||
      (typeof includeBlank !== "undefined" &&
        typeof includeBlank !== "boolean") ||
      (typeof timeThreshold !== "undefined" &&
        typeof timeThreshold !== "number") ||
      (typeof timeThreshold === "number" && timeThreshold < 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const clients = await this.getClients({ groupName, includeRemoved });
    const unseenClients = [];

    // NOTE: Conversion is needed as UrBackup uses seconds for timestamps whereas Javascript uses milliseconds.
    // biome-ignore lint/style/noMagicNumbers: n/a
    const currentEpochTime = Math.trunc(Date.now() / 1000);

    for (const client of clients) {
      const timestampDifference = Math.round(
        (currentEpochTime - (client?.lastseen ?? 0)) / 60,
      );

      if (timestampDifference >= timeThreshold) {
        if (includeBlank === true) {
          unseenClients.push(client);
        } else if (
          this.#isBlankClient({
            client,
            includeFileBackups: true,
            includeImageBackups: true,
          }) === false
        ) {
          unseenClients.push(client);
        }
      }
    }

    return unseenClients;
  }

  /**
   * Retrieves a list of clients that are considered "stale" (i.e., have backups older than the specified threshold).
   * This method fetches all clients within a specified group and filters those that are stale based on their last backup times.
   * Optionally, it can exclude blank clients (clients with no backups) from the results.
   * @param {object} [params] - An optional object containing parameters.
   * @param {string} [params.groupName] - Group name. Defaults to undefined, which matches all groups.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @param {boolean} [params.includeBlank=true] - Whether or not blank clients should be taken into account when matching clients. Defaults to true.
   * @param {boolean} [params.includeFileBackups=true] - Whether or not file backups should be taken into account when matching clients. Defaults to true.
   * @param {boolean} [params.includeImageBackups=true] - Whether or not image backups should be taken into account when matching clients. Defaults to true.
   * @param {number} [params.timeThreshold=1440] - The time threshold (in minutes) for determining if a client is stale. Defaults to 1440 minutes (24 hours).
   * @returns {Promise<Array<object>>} A promise that resolves to an array of clients that are considered stale.
   * @throws {Error} If the login fails or the API response is missing expected values.
   * @example <caption>Get clients with file backup older than a day, skip blank clients</caption>
   * server.getStaleClients({ includeBlank: false, includeImageBackups: false, timeThreshold: 1440 }).then(data => console.log(data));
   */
  async getStaleClients({
    groupName,
    includeRemoved = true,
    includeBlank = true,
    includeFileBackups = true,
    includeImageBackups = true,
    timeThreshold = 1440,
  } = {}) {
    if (
      (typeof groupName !== "undefined" && typeof groupName !== "string") ||
      (typeof includeRemoved !== "undefined" &&
        typeof includeRemoved !== "boolean") ||
      (typeof includeBlank !== "undefined" &&
        typeof includeBlank !== "boolean") ||
      (typeof includeFileBackups !== "undefined" &&
        typeof includeFileBackups !== "boolean") ||
      (typeof includeImageBackups !== "undefined" &&
        typeof includeImageBackups !== "boolean") ||
      (typeof timeThreshold !== "undefined" &&
        typeof timeThreshold !== "number") ||
      (typeof timeThreshold === "number" && timeThreshold < 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const clients = await this.getClients({ groupName, includeRemoved });
    const staleClients = [];

    // NOTE: Conversion is needed as UrBackup uses seconds for timestamps whereas Javascript uses milliseconds.
    // biome-ignore lint/style/noMagicNumbers: n/a
    const currentEpochTime = Math.trunc(Date.now() / 1000);

    for (const client of clients) {
      if (
        this.#isStaleClient({
          client,
          includeFileBackups,
          includeImageBackups,
          time: currentEpochTime,
          timeThreshold,
        }) === true
      ) {
        if (includeBlank === true) {
          staleClients.push(client);
        } else if (
          this.#isBlankClient({
            client,
            includeFileBackups,
            includeImageBackups,
          }) === false
        ) {
          staleClients.push(client);
        }
      }
    }

    return staleClients;
  }

  /**
   * Adds a new client.
   * @param {object} params - An object containing parameters.
   * @param {string} params.clientName - The client's name.
   * @returns {Promise<boolean>} A promise that resolves to `true` if successful, or `false` otherwise.
   * @throws {Error} If the clientName is missing or invalid, if the login fails, or if the API response is missing expected values.
   * @example <caption>Add new client</caption>
   * server.addClient({ clientName: 'laptop2' }).then(data => console.log(data));
   */
  async addClient({ clientName } = {}) {
    if (typeof clientName !== "string" || clientName.length === 0) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const addClientResponse = await this.#fetchJson("add_client", {
      clientname: clientName,
    });

    if (addClientResponse?.ok === true) {
      return addClientResponse.added_new_client === true;
    }

    throw new Error(this.#messages.missingClientData);
  }

  /**
   * Marks or unmarks a client as ready for removal.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - Client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @param {boolean} params.stopRemove - Whether it's a 'remove' or 'cancel remove' operation.
   * @returns {Promise<boolean>} A promise that resolves to `true` if successful, or `false` otherwise.
   * @throws {Error} If parameters are missing or invalid, or if the API response is incorrect.
   * @private
   * @example
   * const operationStatus = await this.#removeClientCommon({ clientId: 123, stopRemove: true });
   */
  async #removeClientCommon({ clientId, clientName, stopRemove } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0) ||
      typeof stopRemove !== "boolean"
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const fallbackReturnValue = false;

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    let mappedClientId;

    if (typeof clientId === "undefined") {
      mappedClientId = await this.#getClientIdentifier(clientName, "id");
      if (mappedClientId === null) {
        return fallbackReturnValue;
      }
    }

    // biome-ignore lint/style/useNamingConvention: upstream convention
    const apiCallParameters = { remove_client: clientId ?? mappedClientId };
    if (stopRemove === true) {
      apiCallParameters.stop_remove_client = true;
    }

    const statusResponse = await this.#fetchJson("status", apiCallParameters);

    if (Array.isArray(statusResponse?.status)) {
      return (
        statusResponse.status.find(
          (client) => client.id === (clientId ?? mappedClientId),
        )?.delete_pending === (stopRemove ? "0" : "1")
      );
    }

    throw new Error(this.#messages.missingValues);
  }

  /**
   * Marks the client for removal.
   * Actual removal occurs during the cleanup time window. Until then, this operation can be reversed with the `cancelRemoveClient` method.
   * **WARNING:** Removing clients will also delete all their backups stored on the UrBackup server.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - Client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @returns {Promise<boolean>} A promise that resolves to `true` if successful, or `false` otherwise.
   * @throws {Error} If parameters are missing or invalid.
   * @example <caption>Remove client by ID</caption>
   * server.removeClient({ clientId: 1 }).then(data => console.log(data));
   * @example <caption>Remove client by name</caption>
   * server.removeClient({ clientName: 'laptop2' }).then(data => console.log(data));
   */
  async removeClient({ clientId, clientName } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const operationStatus = await this.#removeClientCommon({
      clientId,
      clientName,
      stopRemove: false,
    });
    return operationStatus;
  }

  /**
   * Unmarks the client as ready for removal.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - Client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @returns {Promise<boolean>} A promise that resolves to `true` if successful, or `false` otherwise.
   * @throws {Error} If parameters are missing or invalid.
   * @example <caption>Stop the server from removing a client by ID</caption>
   * server.cancelRemoveClient({ clientId: 1 }).then(data => console.log(data));
   * @example <caption>Stop the server from removing a client by name</caption>
   * server.cancelRemoveClient({ clientName: 'laptop2' }).then(data => console.log(data));
   */
  async cancelRemoveClient({ clientId, clientName } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const operationStatus = await this.#removeClientCommon({
      clientId,
      clientName,
      stopRemove: true,
    });
    return operationStatus;
  }

  /**
   * Retrieves a list of client discovery hints, which are also known as extra clients.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing client hints. Returns an empty array when no matching client hints are found.
   * @throws {Error} If the login fails or the API response is incorrect.
   * @example <caption>Get extra clients</caption>
   * server.getClientHints().then(data => console.log(data));
   */
  async getClientHints() {
    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const statusResponse = await this.#fetchJson("status");

    if (Array.isArray(statusResponse?.extra_clients)) {
      return statusResponse.extra_clients;
    }

    throw new Error(this.#messages.missingValues);
  }

  /**
   * Adds a new client discovery hint, also known as an extra client.
   * Discovery hints are a way of improving client discovery in local area networks.
   * @param {object} params - An object containing parameters.
   * @param {string} params.address - Client's IP address or hostname.
   * @returns {Promise<boolean>} A promise that resolves to `true` if successful, or `false` otherwise.
   * @throws {Error} If parameters are missing or invalid, or if the API response is incorrect.
   * @example <caption>Add new extra client</caption>
   * server.addClientHint({ address: '192.168.100.200' }).then(data => console.log(data));
   */
  async addClientHint({ address } = {}) {
    if (typeof address !== "string" || address.length === 0) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const statusResponse = await this.#fetchJson("status", {
      hostname: address,
    });

    if (Array.isArray(statusResponse?.extra_clients)) {
      return statusResponse.extra_clients.some(
        (extraClient) => extraClient.hostname === address,
      );
    }

    throw new Error(this.#messages.missingValues);
  }

  /**
   * Removes a specific client discovery hint, also known as an extra client.
   * @param {object} params - An object containing parameters.
   * @param {string} params.address - Client's IP address or hostname.
   * @returns {Promise<boolean>} A promise that resolves to `true` if successful, or `false` otherwise.
   * @throws {Error} If parameters are missing or invalid, or if the API response is incorrect.
   * @example <caption>Remove extra client</caption>
   * server.removeClientHint({ address: '192.168.100.200' }).then(data => console.log(data));
   */
  async removeClientHint({ address } = {}) {
    if (typeof address !== "string" || address.length === 0) {
      throw new Error(this.#messages.missingParameters);
    }

    let operationStatus = false;

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const extraClients = await this.getClientHints();

    if (Array.isArray(extraClients)) {
      const matchingClient = extraClients.find(
        (extraClient) => extraClient.hostname === address,
      );

      if (typeof matchingClient !== "undefined") {
        const statusResponse = await this.#fetchJson("status", {
          hostname: matchingClient.id,
          remove: true,
        });

        if (Array.isArray(statusResponse?.extra_clients)) {
          if (
            typeof statusResponse.extra_clients.find(
              (extraClient) => extraClient.hostname === address,
            ) === "undefined"
          ) {
            operationStatus = true;
          }
        } else {
          throw new Error(this.#messages.missingValues);
        }
      }

      return operationStatus;
    }

    throw new Error(this.#messages.missingValues);
  }

  /**
   * Retrieves client settings.
   * Matches all clients by default, but `clientId` or `clientName` can be used to request settings for one particular client.
   * Clients marked for removal are not excluded from the results.
   * @param {object} [params] - An optional object containing parameters.
   * @param {number} [params.clientId] - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined.
   * @param {string} [params.clientName] - Client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing client settings. Returns an empty array if no matching client is found.
   * @throws {Error} If parameters are missing or invalid, or if the API response is incorrect.
   * @example <caption>Get settings for all clients</caption>
   * server.getClientSettings().then(data => console.log(data));
   * @example <caption>Get settings for a specific client only</caption>
   * server.getClientSettings({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getClientSettings({ clientId: 3 }).then(data => console.log(data));
   */
  async getClientSettings({ clientId, clientName } = {}) {
    if (
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const clientSettings = [];
    const clientIds = [];
    const allClients = await this.getClients({ includeRemoved: true });

    if (allClients.some((client) => typeof client.id === "undefined")) {
      throw new Error(this.#messages.missingValues);
    }

    if (typeof clientId === "undefined") {
      for (const client of allClients) {
        if (typeof clientName === "undefined") {
          clientIds.push(client.id);
        } else if (client.name === clientName) {
          clientIds.push(client.id);
          break;
        }
      }
    } else if (allClients.some((client) => client.id === clientId)) {
      // NOTE: Need to make sure that given clientId really exists because 'clientsettings' API call
      // returns settings even when called with an invalid ID
      clientIds.push(clientId);
    }

    const clientSettingsPromises = clientIds.map(async (id) => {
      const settingsResponse = await this.#fetchJson("settings", {
        sa: "clientsettings",
        // biome-ignore lint/style/useNamingConvention: upstream convention
        t_clientid: id,
      });

      if (typeof settingsResponse?.settings === "object") {
        return settingsResponse.settings;
      }

      throw new Error(this.#messages.missingValues);
    });

    clientSettings.push(...(await Promise.all(clientSettingsPromises)));

    return clientSettings;
  }

  /**
   * Changes one specific element of client settings.
   * A list of settings can be obtained with the `getClientSettings` method.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - Client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @param {string} params.key - Settings element to change.
   * @param {string|number|boolean} params.newValue - New value for settings element.
   * @returns {Promise<boolean>} A promise that resolves to `true` if successful, or `false` otherwise.
   * @throws {Error} If parameters are missing or invalid, or if the API response is incorrect.
   * @example <caption>Set directories to backup to be optional by default</caption>
   * server.setClientSettings({ clientName: 'laptop1', key: 'backup_dirs_optional', newValue: true }).then(data => console.log(data));
   * server.setClientSettings({ clientId: 3, key: 'backup_dirs_optional', newValue: true }).then(data => console.log(data));
   */
  async setClientSettings({ clientId, clientName, key, newValue } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0) ||
      (typeof key !== "undefined" && typeof key !== "string") ||
      (typeof key === "string" && key.length === 0) ||
      typeof newValue === "undefined"
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    let operationStatus = false;

    const clientSettings = await this.getClientSettings(
      typeof clientId === "undefined"
        ? { clientName: clientName }
        : { clientId: clientId },
    );

    if (Array.isArray(clientSettings) && clientSettings.length > 0) {
      if (Object.keys(clientSettings[0]).includes(key)) {
        clientSettings[0][key] = newValue;
        clientSettings[0].overwrite = true;
        clientSettings[0].sa = "clientsettings_save";
        clientSettings[0].t_clientid = clientSettings[0].clientid;

        const saveSettingsResponse = await this.#fetchJson(
          "settings",
          clientSettings[0],
        );

        if (typeof saveSettingsResponse?.saved_ok === "boolean") {
          operationStatus = saveSettingsResponse.saved_ok === true;
        } else {
          throw new Error(this.#messages.missingValues);
        }
      }

      return operationStatus;
    }

    throw new Error(this.#messages.missingValues);
  }

  /**
   * Retrieves the group information for a specific client.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @returns {Promise<object|null>} A promise that resolves to an object containing the group ID and name, or `null` if the client or group is not found.
   * @throws {Error} If parameters are missing or invalid, if the API response is missing values, or if login fails.
   * @example <caption>Get client group by client ID</caption>
   * server.getClientGroup({ clientId: 1 }).then(data => console.log(data));
   * @example <caption>Get client group by client name</caption>
   * server.getClientGroup({ clientName: 'laptop2' }).then(data => console.log(data));
   */
  async getClientGroup({ clientId, clientName } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const fallbackReturnValue = null;

    const clientSettings = await this.getClientSettings(
      typeof clientId === "number" ? { clientId } : { clientName },
    );

    if (!Array.isArray(clientSettings)) {
      throw new Error(this.#messages.missingValues);
    }

    if (clientSettings.length === 0) {
      return fallbackReturnValue;
    }

    const groupId = clientSettings[0]?.memberof;
    const group = {
      id: groupId,
      name: await this.#getGroupIdentifier(groupId, "name"),
    };

    return typeof group.id === "number" && typeof group.name === "string"
      ? group
      : fallbackReturnValue;
  }

  /**
   * Sets the group for a specific client.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - Client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @param {number} params.groupId - Group ID.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the group was successfully set, or `false` otherwise.
   * @throws {Error} If parameters are missing or invalid, or if the API response is incorrect.
   * @example <caption>Set client group by client ID</caption>
   * server.setClientGroup({ clientId: 1, groupId: 123 }).then(data => console.log(data));
   * @example <caption>Set client group by client name</caption>
   * server.setClientGroup({ clientName: 'laptop2', groupId: 123 }).then(data => console.log(data));
   */
  async setClientGroup({ clientId, clientName, groupId } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0) ||
      typeof groupId !== "number" ||
      groupId < 0
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    let operationStatus = false;
    let mappedClientId;

    if (typeof clientId !== "number") {
      if (typeof clientName === "string") {
        mappedClientId = await this.#getClientIdentifier(clientName, "id");
      }

      if (typeof mappedClientId !== "number") {
        return operationStatus;
      }
    }

    if ((await this.#getGroupIdentifier(groupId, "name")) === null) {
      return operationStatus;
    }

    const payload = {
      sa: "clientsettings_save",
      // biome-ignore lint/style/useNamingConvention: upstream convention
      t_clientid: clientId ?? mappedClientId,
      memberof: groupId,
    };

    const saveSettingsResponse = await this.#fetchJson("settings", payload);

    if (typeof saveSettingsResponse?.saved_ok === "boolean") {
      operationStatus = saveSettingsResponse.saved_ok === true;
    } else {
      throw new Error(this.#messages.missingValues);
    }

    return operationStatus;
  }

  /**
   * Retrieves the authentication key for a specified client.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - Client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @returns {Promise<string>} Client's authentication key. Returns an empty string if no matching clients are found.
   * @throws {Error} If parameters are missing or invalid, or if the API response is incorrect.
   * @example <caption>Get authentication key for a specific client</caption>
   * server.getClientAuthenticationKey({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getClientAuthenticationKey({ clientId: 3 }).then(data => console.log(data));
   */
  async getClientAuthenticationKey({ clientId, clientName } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const clientSettings = await this.getClientSettings(
      typeof clientId === "undefined"
        ? { clientName: clientName }
        : { clientId: clientId },
    );

    let authKey = "";

    if (Array.isArray(clientSettings)) {
      if (
        clientSettings.length > 0 &&
        typeof clientSettings[0]?.internet_authkey?.value === "string"
      ) {
        authKey = clientSettings[0].internet_authkey.value.toString();
      }

      return authKey;
    }

    throw new Error(this.#messages.missingValues);
  }

  /**
   * Retrieves backup status.
   * Matches all clients by default, including clients marked for removal.
   * Client name or client ID can be passed as an argument in which case only that one client's status is returned.
   * @param {object} [params] - An optional object containing parameters.
   * @param {number} [params.clientId] - Client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined.
   * @param {string} [params.clientName] - Client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @param {boolean} [params.includeRemoved=true] - Whether or not clients pending deletion should be included. Defaults to true.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects with status info for matching clients. Returns an empty array if no matching clients are found.
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
    if (
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0) ||
      (typeof includeRemoved !== "undefined" &&
        typeof includeRemoved !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const fallbackReturnValue = [];
    const statusResponse = await this.#fetchJson("status");

    if (Array.isArray(statusResponse?.status)) {
      if (
        typeof clientId === "undefined" &&
        typeof clientName === "undefined"
      ) {
        if (includeRemoved === true) {
          return statusResponse.status;
        }

        return statusResponse.status.filter(
          (client) => client.delete_pending !== "1",
        );
      }

      const clientStatus = statusResponse.status.find((client) =>
        typeof clientId === "number"
          ? client.id === clientId
          : client.name === clientName,
      );

      if (typeof clientStatus === "undefined") {
        return fallbackReturnValue;
      }

      return includeRemoved !== true && clientStatus.delete_pending === "1"
        ? fallbackReturnValue
        : [clientStatus];
    }

    throw new Error(this.#messages.missingValues);
  }

  /**
   * Retrieves storage usage.
   * By default, it matches all clients, but you can use `clientName` or `clientId` to request usage for one particular client.
   * @param {object} [params] - An optional object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects with storage usage info for each client. Resolves to an empty array if no matching clients are found.
   * @throws {Error} If the API response is missing values or if login fails.
   * @example <caption>Get usage for all clients</caption>
   * server.getUsage().then(data => console.log(data));
   * @example <caption>Get usage for a specific client only</caption>
   * server.getUsage({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getUsage({ clientId: 3 }).then(data => console.log(data));
   */
  async getUsage({ clientId, clientName } = {}) {
    if (
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const fallbackReturnValue = [];
    const usageResponse = await this.#fetchJson("usage");

    if (Array.isArray(usageResponse?.usage)) {
      if (
        typeof clientId === "undefined" &&
        typeof clientName === "undefined"
      ) {
        return usageResponse.usage;
      }

      let mappedClientName;
      if (typeof clientId === "number") {
        // NOTE: Usage response does not contain a property with client ID so translation to client name is needed
        mappedClientName = await this.#getClientIdentifier(clientId, "name");
        if (mappedClientName === null) {
          return fallbackReturnValue;
        }
      }

      const match = usageResponse.usage.find((client) =>
        typeof clientId === "number"
          ? client.name === mappedClientName
          : client.name === clientName,
      );

      return match ? [match] : fallbackReturnValue;
    }

    throw new Error(this.#messages.missingValues);
  }

  /**
   * Retrieves a list of current and/or last activities.
   * Matches all clients by default, but `clientName` or `clientId` can be used to request activities for one particular client.
   * By default, this method returns both current and last activities.
   * @param {object} [params] - An optional object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @param {boolean} [params.includeCurrent=true] - Whether or not currently running activities should be included. Defaults to true.
   * @param {boolean} [params.includeLast=true] - Whether or not last activities should be included. Defaults to true.
   * @param {boolean} [params.includePaused=true] - Whether or not paused activities should be included. Defaults to true.
   * @returns {Promise<object>} A promise that resolves to an object with activities info in two separate arrays (one for current and one for last activities). Returns an object with empty arrays when no matching clients/activities are found.
   * @throws {Error} If the API response is missing values or if login fails.
   * @example <caption>Get current (in progress) activities for all clients</caption>
   * server.getActivities({ includeLast: false }).then(data => console.log(data));
   * @example <caption>Get current (in progress, skip paused) activities for all clients</caption>
   * server.getActivities({ includeLast: false, includePaused: false }).then(data => console.log(data));
   * @example <caption>Get last activities for all clients</caption>
   * server.getActivities({ includeCurrent: false }).then(data => console.log(data));
   * @example <caption>Get current (in progress) activities for a specific client only</caption>
   * server.getActivities({ clientName: 'laptop1', includeLast: false }).then(data => console.log(data));
   * server.getActivities({ clientId: 3, includeLast: false }).then(data => console.log(data));
   * @example <caption>Get all activities for a specific client only</caption>
   * server.getActivities({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getActivities({ clientId: 3 }).then(data => console.log(data));
   */
  async getActivities({
    clientId,
    clientName,
    includeCurrent = true,
    includeLast = true,
    includePaused = true,
  } = {}) {
    if (
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0) ||
      (typeof includeCurrent !== "undefined" &&
        typeof includeCurrent !== "boolean") ||
      (typeof includeLast !== "undefined" &&
        typeof includeLast !== "boolean") ||
      (typeof includePaused !== "undefined" &&
        typeof includePaused !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const activities = { current: [], last: [] };

    if (includeCurrent !== true && includeLast !== true) {
      return activities;
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const activitiesResponse = await this.#fetchJson("progress");

    if (
      Array.isArray(activitiesResponse?.progress) &&
      Array.isArray(activitiesResponse?.lastacts)
    ) {
      if (includeCurrent === true) {
        if (
          typeof clientId === "undefined" &&
          typeof clientName === "undefined"
        ) {
          if (includePaused === true) {
            activities.current = activitiesResponse.progress;
          } else {
            activities.current = activitiesResponse.progress.filter(
              (activity) => activity.paused !== true,
            );
          }
        } else {
          activities.current = activitiesResponse.progress.filter(
            (activity) =>
              (typeof clientId === "number"
                ? activity.clientid === clientId
                : activity.name === clientName) &&
              (includePaused === true ? true : activity.paused !== true),
          );
        }
      }

      if (includeLast === true) {
        if (
          typeof clientId === "undefined" &&
          typeof clientName === "undefined"
        ) {
          activities.last = activitiesResponse.lastacts;
        } else {
          activities.last = activitiesResponse.lastacts.filter((activity) =>
            typeof clientId === "number"
              ? activity.clientid === clientId
              : activity.name === clientName,
          );
        }
      }

      return activities;
    }

    throw new Error(this.#messages.missingValues);
  }

  /**
   * Retrieves a list of current (in progress) activities.
   * This is only a convenience method that wraps the `getActivities()` method.
   * Matches all clients by default, but `clientName` or `clientId` can be used to request activities for one particular client.
   * @param {object} [params] - An optional object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @param {boolean} [params.includePaused=true] - Whether or not paused activities should be included. Defaults to true.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of current activities. Returns an empty array when no matching clients/activities are found.
   * @throws {Error} If the API response is missing values or if login fails.
   * @example <caption>Get current activities for all clients</caption>
   * server.getCurrentActivities().then(data => console.log(data));
   * @example <caption>Get current activities for all clients, skip paused activities</caption>
   * server.getCurrentActivities({ includePaused: false }).then(data => console.log(data));
   * @example <caption>Get current activities for a specific client only</caption>
   * server.getCurrentActivities({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getCurrentActivities({ clientId: 3 }).then(data => console.log(data));
   */
  async getCurrentActivities({
    clientId,
    clientName,
    includePaused = true,
  } = {}) {
    if (
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0) ||
      (typeof includePaused !== "undefined" &&
        typeof includePaused !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const activities = await this.getActivities({
      clientId,
      clientName,
      includeCurrent: true,
      includeLast: false,
      includePaused,
    });

    return activities.current;
  }

  /**
   * Retrieves a list of last activities.
   * This is only a convenience method that wraps the `getActivities()` method.
   * Matches all clients by default, but `clientName` or `clientId` can be used to request activities for one particular client.
   * @param {object} [params] - An optional object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of last activities. Returns an empty array when no matching clients/activities are found.
   * @throws {Error} If the API response is missing values or if login fails.
   * @example <caption>Get last activities for all clients</caption>
   * server.getLastActivities().then(data => console.log(data));
   * @example <caption>Get last activities for a specific client only</caption>
   * server.getLastActivities({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getLastActivities({ clientId: 3 }).then(data => console.log(data));
   */
  async getLastActivities({ clientId, clientName } = {}) {
    if (
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const activities = await this.getActivities({
      clientId,
      clientName,
      includeCurrent: false,
      includeLast: true,
      includePaused: false,
    });

    return activities.last;
  }

  /**
   * Retrieves a list of paused activities.
   * Matches all clients by default, but `clientName` or `clientId` can be used to request paused activities for a particular client.
   * @param {object} [params] - An optional object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientName` is also undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which matches all clients if `clientId` is also undefined.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of paused activities. Returns an empty array when no matching clients/activities are found.
   * @throws {Error} If the API response is missing values or if login fails.
   * @example <caption>Get all paused activities</caption>
   * server.getPausedActivities().then(data => console.log(data));
   * @example <caption>Get paused activities for a specific client only</caption>
   * server.getPausedActivities({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getPausedActivities({ clientId: 3 }).then(data => console.log(data));
   */
  async getPausedActivities({ clientId, clientName } = {}) {
    if (
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const activities = await this.getActivities({
      clientId,
      clientName,
      includeCurrent: true,
      includeLast: false,
      includePaused: true,
    });

    const pausedActivities = [];

    for (const activity of activities.current) {
      if (activity.paused === true) {
        pausedActivities.push(activity);
      }
    }

    return pausedActivities;
  }

  /**
   * Stops one selected activity.
   * A list of current activities can be obtained with the `getActivities` method.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @param {number} params.activityId - The activity ID. Required.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the activity was stopped successfully, or `false` otherwise.
   * @throws {Error} If there are missing or invalid parameters, if the API response is missing values, or if login fails.
   * @example <caption>Stop activity</caption>
   * server.stopActivity({ clientName: 'laptop1', activityId: 42 }).then(data => console.log(data));
   * server.stopActivity({ clientId: 3, activityId: 42 }).then(data => console.log(data));
   */
  async stopActivity({ clientId, clientName, activityId } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0) ||
      typeof activityId !== "number" ||
      activityId <= 0
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    if (clientName === "") {
      return false;
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    let mappedClientId;
    if (typeof clientId === "undefined" && typeof clientName === "string") {
      mappedClientId = await this.#getClientIdentifier(clientName, "id");
    }

    if (typeof clientId === "number" || typeof mappedClientId === "number") {
      const activitiesResponse = await this.#fetchJson("progress", {
        // biome-ignore lint/style/useNamingConvention: upstream convention
        stop_clientid: clientId ?? mappedClientId,
        // biome-ignore lint/style/useNamingConvention: upstream convention
        stop_id: activityId,
      });

      if (
        Array.isArray(activitiesResponse?.progress) &&
        Array.isArray(activitiesResponse?.lastacts)
      ) {
        return true;
      }

      throw new Error(this.#messages.missingValues);
    }

    return false;
  }

  /**
   * Retrieves a list of file and/or image backups for a specific client.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @param {boolean} [params.includeFileBackups=true] - Whether or not file backups should be included. Defaults to true.
   * @param {boolean} [params.includeImageBackups=true] - Whether or not image backups should be included. Defaults to true.
   * @returns {Promise<object>} A promise that resolves to an object with backups info in two separate arrays (one for file and one for image backups). Returns an object with empty arrays when no matching clients/backups are found.
   * @throws {Error} If there are missing or invalid parameters, if the API response is missing values, or if login fails.
   * @example <caption>Get all backups for a specific client</caption>
   * server.getBackups({ clientName: 'laptop1' }).then(data => console.log(data));
   * server.getBackups({ clientId: 3 }).then(data => console.log(data));
   * @example <caption>Get image backups for a specific client</caption>
   * server.getBackups({ clientName: 'laptop1', includeFileBackups: false }).then(data => console.log(data));
   * @example <caption>Get file backups for a specific client</caption>
   * server.getBackups({ clientName: 'laptop1', includeImageBackups: false }).then(data => console.log(data));
   */
  async getBackups({
    clientId,
    clientName,
    includeFileBackups = true,
    includeImageBackups = true,
  } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0) ||
      (typeof includeFileBackups !== "undefined" &&
        typeof includeFileBackups !== "boolean") ||
      (typeof includeImageBackups !== "undefined" &&
        typeof includeImageBackups !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const backups = { file: [], image: [] };
    if (includeFileBackups === false && includeImageBackups === false) {
      return backups;
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    let mappedClientId;

    if (typeof clientId === "undefined" && typeof clientName === "string") {
      mappedClientId = await this.#getClientIdentifier(clientName, "id");
      if (mappedClientId === null) {
        return backups;
      }
    }

    const backupsResponse = await this.#fetchJson("backups", {
      sa: "backups",
      clientid: clientId ?? mappedClientId,
    });

    if (
      Array.isArray(backupsResponse?.backup_images) &&
      Array.isArray(backupsResponse?.backups)
    ) {
      if (includeFileBackups === true) {
        backups.file = backupsResponse.backups;
      }

      if (includeImageBackups === true) {
        backups.image = backupsResponse.backup_images;
      }

      return backups;
    }

    throw new Error(this.#messages.missingValues);
  }

  /**
   * Starts a backup job.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @param {string} params.backupType - The backup type. Must be one of `full_file`, `incr_file`, `full_image`, or `incr_image`. Required.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the backup job was started successfully, or `false` otherwise.
   * @throws {Error} If there are missing or invalid parameters, if the API response is missing values, or if login fails.
   * @private
   * @example
   * const startStatus = await this.#startBackupCommon({ clientId: 3, backupType: 'full_file' });
   * @example
   * const startStatus = await this.#startBackupCommon({ clientName: 'laptop1', backupType: 'incr_file' });
   */
  async #startBackupCommon({ clientId, clientName, backupType } = {}) {
    const backupTypes = ["full_file", "incr_file", "full_image", "incr_image"];

    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0) ||
      typeof backupType !== "string" ||
      !backupTypes.includes(backupType)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    let mappedClientId;
    if (typeof clientId === "undefined" && typeof clientName === "string") {
      mappedClientId = await this.#getClientIdentifier(clientName, "id");
    }

    if (typeof clientId === "number" || typeof mappedClientId === "number") {
      const backupResponse = await this.#fetchJson("start_backup", {
        // biome-ignore lint/style/useNamingConvention: upstream convention
        start_client: clientId ?? mappedClientId,
        // biome-ignore lint/style/useNamingConvention: upstream convention
        start_type: backupType,
      });

      if (
        Array.isArray(backupResponse.result) &&
        backupResponse.result.filter((element) =>
          Object.keys(element).includes("start_ok"),
        ).length !== 1
      ) {
        return Boolean(backupResponse.result[0].start_ok);
      }

      // TODO: fix bug
      throw new Error(this.#messages.missingValues);
    }

    return false;
  }

  /**
   * Starts a full file backup.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the backup job was started successfully, or `false` otherwise.
   * @throws {Error} If there are missing or invalid parameters.
   * @example <caption>Start a full file backup by client name</caption>
   * server.startFullFileBackup({ clientName: 'laptop1' }).then(data => console.log(data));
   * @example <caption>Start a full file backup by client ID</caption>
   * server.startFullFileBackup({ clientId: 3 }).then(data => console.log(data));
   */
  async startFullFileBackup({ clientId, clientName } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const operationStatus = await this.#startBackupCommon({
      clientId: clientId,
      clientName: clientName,
      backupType: "full_file",
    });

    return operationStatus;
  }

  /**
   * Starts an incremental file backup.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the backup job was started successfully, or `false` otherwise.
   * @throws {Error} If there are missing or invalid parameters.
   * @example <caption>Start an incremental file backup by client name</caption>
   * server.startIncrementalFileBackup({ clientName: 'laptop1' }).then(data => console.log(data));
   * @example <caption>Start an incremental file backup by client ID</caption>
   * server.startIncrementalFileBackup({ clientId: 3 }).then(data => console.log(data));
   */
  async startIncrementalFileBackup({ clientId, clientName } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const operationStatus = await this.#startBackupCommon({
      clientId: clientId,
      clientName: clientName,
      backupType: "incr_file",
    });

    return operationStatus;
  }

  /**
   * Starts a full image backup.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the backup job was started successfully, or `false` otherwise.
   * @throws {Error} If there are missing or invalid parameters.
   * @example <caption>Start a full image backup by client name</caption>
   * server.startFullImageBackup({ clientName: 'laptop1' }).then(data => console.log(data));
   * @example <caption>Start a full image backup by client ID</caption>
   * server.startFullImageBackup({ clientId: 3 }).then(data => console.log(data));
   */
  async startFullImageBackup({ clientId, clientName } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const operationStatus = await this.#startBackupCommon({
      clientId: clientId,
      clientName: clientName,
      backupType: "full_image",
    });

    return operationStatus;
  }

  /**
   * Starts an incremental image backup.
   * @param {object} params - An object containing parameters.
   * @param {number} params.clientId - The client's ID. Takes precedence if both `clientId` and `clientName` are defined. Required if `clientName` is undefined.
   * @param {string} params.clientName - The client's name. Ignored if both `clientId` and `clientName` are defined. Required if `clientId` is undefined.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the backup job was started successfully, or `false` otherwise.
   * @throws {Error} If there are missing or invalid parameters.
   * @example <caption>Start an incremental image backup by client name</caption>
   * server.startIncrementalImageBackup({ clientName: 'laptop1' }).then(data => console.log(data));
   * @example <caption>Start an incremental image backup by client ID</caption>
   * server.startIncrementalImageBackup({ clientId: 3 }).then(data => console.log(data));
   */
  async startIncrementalImageBackup({ clientId, clientName } = {}) {
    if (
      (typeof clientId === "undefined" && typeof clientName === "undefined") ||
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0)
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const operationStatus = await this.#startBackupCommon({
      clientId: clientId,
      clientName: clientName,
      backupType: "incr_image",
    });

    return operationStatus;
  }

  /**
   * Retrieves live logs.
   * Server logs are requested by default, but `clientName` or `clientId` can be used to request logs for one particular client.
   * Instance property is used internally to keep track of log entries that were previously requested.
   * When `recentOnly` is set to true, only recent (unfetched) logs are requested.
   * @param {object} [params] - An optional object containing parameters.
   * @param {number} [params.clientId] - The client's ID. Must be greater than zero. Takes precedence if both `clientId` and `clientName` are defined. Defaults to undefined, which means server logs will be requested if `clientName` is also undefined.
   * @param {string} [params.clientName] - The client's name. Ignored if both `clientId` and `clientName` are defined. Defaults to undefined, which means server logs will be requested if `clientId` is also undefined.
   * @param {boolean} [params.recentOnly=false] - Whether only recent (unfetched) entries should be requested. Defaults to false.
   * @returns {Promise<Array<object>>} A promise that resolves to an array of objects representing log entries. Returns an empty array when no matching clients or logs are found.
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
    if (
      (typeof clientId !== "undefined" && typeof clientId !== "number") ||
      (typeof clientId === "number" && clientId < 0) ||
      (typeof clientName !== "undefined" && typeof clientName !== "string") ||
      (typeof clientName === "string" && clientName.length === 0) ||
      (typeof recentOnly !== "undefined" && typeof recentOnly !== "boolean")
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    let livelog = [];
    let mappedClientId;

    if (typeof clientId === "undefined" && typeof clientName === "string") {
      mappedClientId = await this.#getClientIdentifier(clientName, "id");
    }

    if (clientId === 0 || mappedClientId === null) {
      // NOTE: Fail early to distinguish this case because 0 (zero) is a valid parameter value
      // for 'livelog' call which should be used when both clientId and clientName are undefined
      return livelog;
    }

    // NOTE: Use semaphore to prevent race condition with this.#lastLogId
    const [_value, release] = await this.#semaphore.acquire();
    try {
      const logResponse = await this.#fetchJson("livelog", {
        clientid: clientId ?? mappedClientId ?? 0,
        lastid: recentOnly ? this.#lastLogId.get(clientId) : 0,
      });

      if (Array.isArray(logResponse.logdata)) {
        const lastId = logResponse.logdata.at(-1)?.id;
        if (typeof lastId !== "undefined") {
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
  }

  /**
   * Retrieves server settings of the given category.
   * This method is intended for internal use only and should not be called outside the class.
   * @param {string} category - Name of the settings category.
   * @returns {Promise<object>} A promise that resolves to an object with the settings of the specified category.
   * @throws {Error} If there is a syntax error, API response error, or login failure.
   * @private
   * @example
   * this.#getServerSettings('general').then(data => console.log(data));
   */
  async #getServerSettings(category) {
    const validCategories = ["general", "ldap", "mail"];

    if (typeof category === "string" && validCategories.includes(category)) {
      const login = await this.#login();
      if (login !== true) {
        throw new Error(this.#messages.failedLoginUnknown);
      }

      const settingsResponse = await this.#fetchJson("settings", {
        sa: category,
      });

      if (typeof settingsResponse?.settings === "object") {
        return settingsResponse.settings;
      }

      throw new Error(this.#messages.missingValues);
    }

    throw new Error(this.#messages.failedLoginUnknown);
  }

  /**
   * Retrieves general settings.
   * @returns {Promise<object>} A promise that resolves to an object with general settings.
   * @throws {Error} If there is an API response error or login failure.
   * @example <caption>Get general settings</caption>
   * server.getGeneralSettings().then(data => console.log(data));
   */
  async getGeneralSettings() {
    const generalSettings = await this.#getServerSettings("general");
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
    const mailSettings = await this.#getServerSettings("mail");
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
    const ldapSettings = await this.#getServerSettings("ldap");
    return ldapSettings;
  }

  /**
   * Changes one specific element of general settings.
   * A list of settings can be obtained with the `getGeneralSettings` method.
   * @param {object} params - An object containing parameters.
   * @param {string} params.key - The settings element to change.
   * @param {string|number|boolean} params.newValue - The new value for the settings element.
   * @returns {Promise<boolean>} A promise that resolves to `true` when the settings change is successful, or `false` otherwise.
   * @throws {Error} If there is a syntax error, API response error, or login failure.
   * @example <caption>Disable image backups</caption>
   * server.setGeneralSettings({ key: 'no_images', newValue: true }).then(data => console.log(data));
   */
  async setGeneralSettings({ key, newValue } = {}) {
    if (
      typeof key !== "string" ||
      key.length === 0 ||
      typeof newValue === "undefined"
    ) {
      throw new Error(this.#messages.missingParameters);
    }

    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const settings = await this.getGeneralSettings();

    if (Object.keys(settings).includes(key)) {
      settings[key] = newValue;
      settings.sa = "general_save";

      const saveSettingsResponse = await this.#fetchJson("settings", settings);

      if (typeof saveSettingsResponse?.saved_ok === "boolean") {
        return saveSettingsResponse.saved_ok;
      }

      throw new Error(this.#messages.missingValues);
    }

    return false;
  }

  /**
   * Retrieves the raw response from the 'status' API call.
   * Property names and values are left unaltered.
   * UrBackup user rights domain: 'status'.
   * @returns {Promise<object>} A promise that resolves to the raw status response object.
   * @throws {Error} If the login fails.
   * @example
   * server.getRawStatus().then(data => console.log(data));
   */
  async getRawStatus() {
    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const statusResponse = await this.#fetchJson("status");
    return statusResponse;
  }

  /**
   * Retrieves the raw response from the 'usage' API call.
   * Property names and values are left unaltered.
   * UrBackup user rights domain: 'piegraph'.
   * @returns {Promise<object>} A promise that resolves to the raw usage response object.
   * @throws {Error} If the login fails.
   * @example
   * const data = await server.getRawUsage();
   */
  async getRawUsage() {
    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const usageResponse = await this.#fetchJson("usage");
    return usageResponse;
  }

  /**
   * Retrieves the raw response from the 'progress' API call.
   * Property names and values are left unaltered.
   * UrBackup user rights domain: 'progress', 'lastacts'.
   * @returns {Promise<object>} A promise that resolves to the raw progress response object.
   * @throws {Error} If the login fails.
   * @example
   * const data = await server.getRawProgress();
   */
  async getRawProgress() {
    const login = await this.#login();
    if (login !== true) {
      throw new Error(this.#messages.failedLoginUnknown);
    }

    const progressResponse = await this.#fetchJson("progress");
    return progressResponse;
  }
}

export { UrbackupServer };
