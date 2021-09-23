import GladysGatewayClient from '@gladysassistant/gladys-gateway-js';

import config from '../config';
import { Dispatcher } from './Dispatcher';
import keyValueStore from './keyValueStore';

const GATEWAY_USER_KEY = 'gateway_user';
const GATEWAY_PROFILE_PICTURE_KEY = 'gateway_profile_picture';
const GATEWAY_REFRESH_TOKEN_KEY = 'gateway_refresh_token';
const GATEWAY_ACCESS_TOKEN_KEY = 'gateway_access_id';
const GATEWAY_DEVICE_ID_KEY = 'gateway_device_id';
const GATEWAY_SERIALIZED_KEYS_KEY = 'gateway_serialized_keys';
const GATEWAY_RSA_PUBLIC_KEY_FINGERPRINT = 'gateway_rsa_public_key_fingerprint';
const GATEWAY_ECDSA_PUBLIC_KEY_FINGERPRINT = 'gateway_ecdsa_public_key_fingerprint';
const GATEWAY_TWO_FACTOR_ACCESS_TOKEN = 'gateway_two_factor_access_token';

class GatewaySession {
  constructor() {
    this.user = null;
    this.profilePicture = null;
    this.initialized = false;
    this.dispatcher = new Dispatcher();
    this.websocketConnected = false;
    this.connected = false;
    this.ready = false;
    this.gladysGatewayApiUrl = config.gladysGatewayApiUrl;
    this.gatewayClient = new GladysGatewayClient({
      serverUrl: config.gladysGatewayApiUrl,
      cryptoLib: window.crypto
    });
  }

  async init() {
    this.getUser();
    await this.connect();
  }

  reset() {
    this.user = null;
    this.profilePicture = null;
    this.initialized = false;
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
      });
      this.ready = true;
      this.websocketConnected = true;
      this.dispatcher.dispatch('GLADYS_GATEWAY_CONNECTED');
    }
  }

  getUser() {
    if (this.user) {
      return this.user;
    }
    const data = keyValueStore.get(GATEWAY_USER_KEY);
    if (data) {
      this.user = JSON.parse(data);
    }
    return this.user;
  }

  async getGatewayUser() {
    return this.gatewayClient.getMyself();
  }

  saveLoginInformations(data) {
    keyValueStore.set(GATEWAY_REFRESH_TOKEN_KEY, data.refreshToken);
    keyValueStore.set(GATEWAY_ACCESS_TOKEN_KEY, data.accessToken);
    keyValueStore.set(GATEWAY_DEVICE_ID_KEY, data.deviceId);
    keyValueStore.set(GATEWAY_SERIALIZED_KEYS_KEY, data.serializedKeys);
    keyValueStore.set(GATEWAY_RSA_PUBLIC_KEY_FINGERPRINT, data.rsaPublicKeyFingerprint);
    keyValueStore.set(GATEWAY_ECDSA_PUBLIC_KEY_FINGERPRINT, data.ecdsaPublicKeyFingerprint);
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
    const mergedUser = Object.assign({}, this.user, user);
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
