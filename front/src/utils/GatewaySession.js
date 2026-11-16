import GladysGatewayClient from '@gladysassistant/gladys-gateway-js';
import gatewayRequest from '@gladysassistant/gladys-gateway-js/lib/request';

import config from '../config';
import { Dispatcher } from './Dispatcher';
import keyValueStore from './keyValueStore';
import { hasPasswordFields, omitPasswordFields } from './omitPasswordFields';

const GATEWAY_USER_KEY = 'gateway_user';
const GATEWAY_PROFILE_PICTURE_KEY = 'gateway_profile_picture';
const GATEWAY_REFRESH_TOKEN_KEY = 'gateway_refresh_token';
const GATEWAY_ACCESS_TOKEN_KEY = 'gateway_access_id';
const GATEWAY_DEVICE_ID_KEY = 'gateway_device_id';
const GATEWAY_SERIALIZED_KEYS_KEY = 'gateway_serialized_keys';
const GATEWAY_RSA_PUBLIC_KEY_FINGERPRINT = 'gateway_rsa_public_key_fingerprint';
const GATEWAY_ECDSA_PUBLIC_KEY_FINGERPRINT = 'gateway_ecdsa_public_key_fingerprint';
const GATEWAY_TWO_FACTOR_ACCESS_TOKEN = 'gateway_two_factor_access_token';

// A phone freezes the web app while it is in the background and kills its socket, sometimes
// without the socket noticing before its next ping (up to 45 seconds later). Coming back
// after at least this long in the background, the connection is checked right away.
const BACKGROUND_DURATION_BEFORE_CHECK_MS = 5 * 1000;
// How long the Gateway has to answer that check
const CONNECTION_CHECK_TIMEOUT_MS = 5 * 1000;

class GatewaySession {
  constructor() {
    this.user = null;
    this.profilePicture = null;
    this.initialized = false;
    this.dispatcher = new Dispatcher();
    this.websocketConnected = false;
    this.connected = false;
    // true while the socket is connected AND authenticated on the Gateway: the only time an
    // API call can be sent (see GatewayHttpClient)
    this.ready = false;
    this.disconnectionCount = 0;
    this.hiddenSince = null;
    // the check of the connection in progress, if any (see checkConnection)
    this.connectionCheck = null;
    this.stopWaitingForAnswer = null;
    this.gladysGatewayApiUrl = config.gladysGatewayApiUrl;
    this.gatewayClient = new GladysGatewayClient({
      serverUrl: config.gladysGatewayApiUrl,
      cryptoLib: window.crypto
    });
    document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
  }

  async init() {
    this.getUser();
    await this.connect();
  }

  reset() {
    this.user = null;
    this.profilePicture = null;
    this.initialized = false;
    // a closed session is no longer connected: a component still holding it (the scene editor
    // writing its local draft on unmount) must not see it as open
    this.connected = false;
    this.ready = false;
    keyValueStore.clear();
  }

  isConnected() {
    return this.connected;
  }

  async connect() {
    let refreshToken = keyValueStore.get(GATEWAY_REFRESH_TOKEN_KEY);
    let serializedKeys = keyValueStore.get(GATEWAY_SERIALIZED_KEYS_KEY);

    if (refreshToken && serializedKeys) {
      this.connected = true;
      await this.gatewayClient.userConnect(refreshToken, serializedKeys, (type, message) => {
        if (type === 'message') {
          this.dispatcher.dispatch(message.event, message.data);
        }
        if (type === 'websocket.connected' && message.connected) {
          this.websocketConnected = true;
          this.ready = true;
          this.dispatcher.dispatch('websocket.connected', { connected: true });
        }
        if (type === 'websocket.connected' && !message.connected) {
          this.websocketConnected = false;
          // until the socket is authenticated again, API calls wait instead of being sent
          // on a socket that cannot carry them
          this.ready = false;
          this.disconnectionCount += 1;
          if (this.stopWaitingForAnswer) {
            this.stopWaitingForAnswer();
          }
          this.dispatcher.dispatch('websocket.connected', { connected: false });
        }
      });
      // userConnect returns at once when the socket already exists, whatever its state
      this.ready = this.websocketConnected;
    }
  }

  onVisibilityChange() {
    if (document.hidden) {
      this.hiddenSince = Date.now();
      return;
    }
    const hiddenSince = this.hiddenSince;
    this.hiddenSince = null;
    if (hiddenSince !== null && Date.now() - hiddenSince >= BACKGROUND_DURATION_BEFORE_CHECK_MS) {
      this.checkConnection();
    }
  }

  // Checks that the Gateway still answers on the socket, and reconnects when it does not.
  // Resolves with whether the connection is usable, and never rejects. Nothing has to be
  // refreshed after a successful check: a socket that is still alive delivered every event
  // sent in the meantime, and a reconnection dispatches 'websocket.connected', which is what
  // the components showing live data listen to in order to reload.
  async checkConnection() {
    // one check at a time, shared by everyone asking for it
    if (!this.connectionCheck) {
      this.connectionCheck = this.checkConnectionOnce();
    }
    const connectionCheck = this.connectionCheck;
    try {
      return await connectionCheck;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      if (this.connectionCheck === connectionCheck) {
        this.connectionCheck = null;
      }
    }
  }

  async checkConnectionOnce() {
    const { socket } = this.gatewayClient;
    // Nothing to check on a session that is not logged in, or that was closed (a logout
    // leaves it behind with its socket). And a socket that is not connected is already
    // being reconnected by socket.io.
    if (!this.connected || !socket || !socket.connected) {
      return false;
    }
    if (this.ready) {
      const disconnectionCount = this.disconnectionCount;
      if (await this.isGatewayAnswering()) {
        return true;
      }
      if (disconnectionCount !== this.disconnectionCount) {
        // the socket noticed by itself in the meantime, and is reconnecting or already has
        return this.ready;
      }
    }
    // Here the socket is either dead without knowing it, or connected without being
    // authenticated: authenticating failed (the access token is fetched over HTTP) and
    // nothing tries again before the next connection. Closing the socket ends the calls
    // waiting for an answer (GatewayHttpClient), opening it again authenticates from scratch.
    socket.disconnect();
    socket.connect();
    return false;
  }

  // Resolves with false when the Gateway has not answered within the timeout, or as soon as
  // the socket closes: it will not answer either
  async isGatewayAnswering() {
    let timeout = null;
    const answer = async () => {
      await this.gatewayClient.calculateLatency();
      return true;
    };
    const noAnswer = new Promise(resolve => {
      timeout = setTimeout(resolve, CONNECTION_CHECK_TIMEOUT_MS, false);
      this.stopWaitingForAnswer = () => resolve(false);
    });
    try {
      return await Promise.race([answer(), noAnswer]);
    } finally {
      clearTimeout(timeout);
      this.stopWaitingForAnswer = null;
    }
  }

  getUser() {
    if (this.user) {
      return this.user;
    }
    const data = keyValueStore.get(GATEWAY_USER_KEY);
    if (data) {
      const user = JSON.parse(data);
      if (hasPasswordFields(user)) {
        // older versions of the profile page stored the new password here
        this.saveUser(user);
      } else {
        this.user = user;
      }
    }
    return this.user;
  }

  async getGatewayUser() {
    return this.gatewayClient.getMyself();
  }

  // "Email the admins when Gladys is offline" alert of the Gladys Plus account (admin
  // only on the Gladys Plus side). The client library has no method for it yet, so the
  // request goes through its request helper (access token of the session, refreshed
  // on 401).
  async updateInstanceOfflineAlert({ enabled, delayInMinutes }) {
    const fields = {};
    if (enabled !== undefined) {
      fields.enabled = enabled;
    }
    if (delayInMinutes !== undefined) {
      fields.delay_in_minutes = delayInMinutes;
    }
    return gatewayRequest.patch(
      `${this.gladysGatewayApiUrl}/accounts/instance-offline-alert`,
      fields,
      this.gatewayClient
    );
  }

  // Invite someone to the Gladys Plus account, for a given Gladys user of the
  // instance: the Gateway copies `gladys_4_user_id` onto the user created from
  // the invitation, so they land on the right Gladys user without picking one
  // (nobody can pick someone else's). The client library's inviteUser only
  // takes the email and the role, so the request goes through its request
  // helper (access token of the session, refreshed on 401).
  async inviteUserForGladysUser({ email, role, gladysUserId }) {
    return gatewayRequest.post(
      `${this.gladysGatewayApiUrl}/invitations`,
      { email, role, gladys_4_user_id: gladysUserId },
      this.gatewayClient
    );
  }

  // Link a user of the Gladys Plus account to a Gladys user of the instance, as an
  // admin of the account (PATCH /accounts/users/:id), for accounts created before the
  // linked invitations; null unlinks
  async linkAccountUserToGladysUser(plusUserId, gladysUserId) {
    return gatewayRequest.patch(
      `${this.gladysGatewayApiUrl}/accounts/users/${plusUserId}`,
      { gladys_4_user_id: gladysUserId },
      this.gatewayClient
    );
  }

  // Same for a pending invitation (PATCH /invitations/:id): the user created from it
  // is then linked to that Gladys user
  async linkInvitationToGladysUser(invitationId, gladysUserId) {
    return gatewayRequest.patch(
      `${this.gladysGatewayApiUrl}/invitations/${invitationId}`,
      { gladys_4_user_id: gladysUserId },
      this.gatewayClient
    );
  }

  // Reset the two factor of a user of the Gladys Plus account who lost their
  // authenticator, as an admin of the account confirming with their OWN current code
  // (POST /accounts/users/:id/reset-two-factor)
  async resetAccountUserTwoFactor(plusUserId, twoFactorCode) {
    return gatewayRequest.post(
      `${this.gladysGatewayApiUrl}/accounts/users/${plusUserId}/reset-two-factor`,
      { two_factor_code: twoFactorCode },
      this.gatewayClient
    );
  }

  // Replacing the two-factor app of the Gladys Plus account is a user operation
  // (user-scoped routes): it is only possible from the Gladys Plus interface, where
  // the Gladys Plus user is the one logged in. The client library has no method for
  // it yet, so the requests go through its request helper (access token of the
  // session, refreshed on 401).
  async getNewTwoFactorSecret() {
    return gatewayRequest.get(`${this.gladysGatewayApiUrl}/users/two-factor/new`, this.gatewayClient);
  }

  // The Gateway only replaces the secret with a valid code from the NEW app (the
  // secret was registered correctly) and a valid code from the CURRENT app (the
  // request comes from someone who holds the current second factor), or one of the
  // single-use recovery codes for a user who lost their current app.
  async updateTwoFactor({ twoFactorSecret, twoFactorCode, currentTwoFactorCode, currentTwoFactorRecoveryCode }) {
    return gatewayRequest.patch(
      `${this.gladysGatewayApiUrl}/users/two-factor`,
      {
        two_factor_secret: twoFactorSecret,
        two_factor_code: twoFactorCode,
        current_two_factor_code: currentTwoFactorRecoveryCode ? undefined : currentTwoFactorCode,
        current_two_factor_recovery_code: currentTwoFactorRecoveryCode || undefined
      },
      this.gatewayClient
    );
  }

  saveLoginInformations(data) {
    keyValueStore.set(GATEWAY_REFRESH_TOKEN_KEY, data.refreshToken);
    keyValueStore.set(GATEWAY_ACCESS_TOKEN_KEY, data.accessToken);
    keyValueStore.set(GATEWAY_DEVICE_ID_KEY, data.deviceId);
    keyValueStore.set(GATEWAY_SERIALIZED_KEYS_KEY, data.serializedKeys);
    keyValueStore.set(GATEWAY_RSA_PUBLIC_KEY_FINGERPRINT, data.rsaPublicKeyFingerprint);
    keyValueStore.set(GATEWAY_ECDSA_PUBLIC_KEY_FINGERPRINT, data.ecdsaPublicKeyFingerprint);
  }

  // Fingerprints of the keys of this Gladys Plus user, as the "Remote users" list of the
  // local instance displays them: comparing both is what protects against a man-in-the-middle
  getKeysFingerprints() {
    const rsaPublicKey = keyValueStore.get(GATEWAY_RSA_PUBLIC_KEY_FINGERPRINT);
    const ecdsaPublicKey = keyValueStore.get(GATEWAY_ECDSA_PUBLIC_KEY_FINGERPRINT);
    if (!rsaPublicKey || !ecdsaPublicKey) {
      return null;
    }
    return { rsaPublicKey, ecdsaPublicKey };
  }

  getRefreshToken() {
    if (this.user) {
      return this.user.refresh_token;
    }
    return null;
  }

  getAccessToken() {
    if (this.user) {
      return this.user.access_token;
    }
    return null;
  }

  setAccessToken(accessToken) {
    const newUser = Object.assign({}, this.user, {
      access_token: accessToken
    });
    this.saveUser(newUser);
  }

  getProfilePicture() {
    if (this.profilePicture) {
      return this.profilePicture;
    }
    const data = keyValueStore.get(GATEWAY_PROFILE_PICTURE_KEY);
    if (data) {
      this.profilePicture = data;
    }

    return this.profilePicture;
  }

  saveUser(user) {
    const mergedUser = omitPasswordFields(Object.assign({}, this.user, user));
    this.user = mergedUser;
    keyValueStore.set(GATEWAY_USER_KEY, JSON.stringify(mergedUser));
  }

  saveProfilePicture(profilePicture) {
    this.profilePicture = profilePicture;
    keyValueStore.set(GATEWAY_PROFILE_PICTURE_KEY, profilePicture);
  }

  saveTwoFactorAccessToken(token) {
    keyValueStore.set(GATEWAY_TWO_FACTOR_ACCESS_TOKEN, token);
  }

  getTwoFactorAccessToken() {
    return keyValueStore.get(GATEWAY_TWO_FACTOR_ACCESS_TOKEN);
  }
}

export { GatewaySession };
