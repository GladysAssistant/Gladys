const Promise = require('bluebird');

class EwelinkApi {
  constructor({ region = 'us', email, password, at, apiKey, devicesCache, arpTable }) {
    this.region = region;
    this.email = email;
    this.password = password;
    this.at = at || undefined;
    this.apiKey = apiKey || undefined;
    this.devicesCache = devicesCache;
    this.arpTable = arpTable;
  }

  getCredentials() {
    if (this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') {
      return Promise.resolve({
        at: 'validAccessToken',
        user: { apikey: 'validApiKey' },
        region: 'eu',
      });
    }
    return Promise.resolve({ error: 401, msg: 'Authentication error' });
  }

  getRegion() {
    if (this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') {
      return Promise.resolve({
        email: this.email,
        region: 'eu',
      });
    }
    return Promise.resolve({ error: 401, msg: 'Authentication error' });
  }

  getDevices() {
    if ((this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') || this.at === 'validAccessToken') {
      return Promise.resolve([]);
    }
    return Promise.resolve({ error: 401, msg: 'Authentication error' });
  }

  getDevice(deviceId) {
    if ((this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') || this.at === 'validAccessToken') {
      return Promise.resolve({ error: false, msg: 'Device does not exist' });
    }
    return Promise.resolve({ error: 401, msg: 'Authentication error' });
  }

  getDeviceChannelCount(deviceId) {
    if ((this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') || this.at === 'validAccessToken') {
      return Promise.resolve({ error: false, msg: 'Device does not exist' });
    }
    return Promise.resolve({ error: 401, msg: 'Authentication error' });
  }

  setDevicePowerState(deviceId, state, channel = 0) {
    if (this.email === 'email@valid.ok' || (this.at === 'validAccessToken' && this.apiKey === 'validApiKey')) {
      return Promise.resolve({ error: false, msg: 'Device does not exist' });
    }
    return Promise.resolve({ error: 401, msg: 'Authentication error' });
  }

  getDevicePowerState(deviceId, channel = 1) {
    if ((this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') || this.at === 'validAccessToken') {
      return Promise.resolve({ error: false, msg: 'Device does not exist' });
    }
    return Promise.resolve({ error: 401, msg: 'Authentication error' });
  }

  async getDevicePowerUsage(deviceId) {
    if ((this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') || this.at === 'validAccessToken') {
      return Promise.resolve({ error: false, msg: 'Device does not exist' });
    }
    return Promise.resolve({ error: 401, msg: 'Authentication error' });
  }

  async getDeviceCurrentTH(deviceId, type = '') {
    if ((this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') || this.at === 'validAccessToken') {
      return Promise.resolve({ error: false, msg: 'Device does not exist' });
    }
    return Promise.resolve({ error: 401, msg: 'Authentication error' });
  }

  getDeviceCurrentTemperature(deviceId) {
    return this.getDeviceCurrentTH(deviceId, 'temp');
  }

  getDeviceCurrentHumidity(deviceId) {
    return this.getDeviceCurrentTH(deviceId, 'humd');
  }

  getFirmwareVersion(deviceId) {
    if ((this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') || this.at === 'validAccessToken') {
      return Promise.resolve({ error: false, msg: 'Device does not exist' });
    }
    return Promise.resolve({ error: 401, msg: 'Authentication error' });
  }
}

module.exports = EwelinkApi;
