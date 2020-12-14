const Promise = require('bluebird');
const EweLink2ChDevice = require('./eweLink-2ch.json');
const EweLinkOfflineDevice = require('./eweLink-offline.json');
const EweLinkPowDevice = require('./eweLink-pow.json');
const EweLinkThDevice = require('./eweLink-th.json');
const EweLinkUnhandledDevice = require('./eweLink-unhandled.json');

const fakeDevices = [EweLink2ChDevice, EweLinkOfflineDevice, EweLinkPowDevice, EweLinkThDevice, EweLinkUnhandledDevice];

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
    return Promise.resolve({ error: 406, msg: 'Authentication error' });
  }

  getRegion() {
    if (this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') {
      return Promise.resolve({
        email: this.email,
        region: 'eu',
      });
    }
    return Promise.resolve({ error: 406, msg: 'Authentication error' });
  }

  getDevices() {
    if ((this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') || this.at === 'validAccessToken') {
      return Promise.resolve(fakeDevices);
    }
    return Promise.resolve({ error: 406, msg: 'Authentication error' });
  }

  getDevice(deviceId) {
    if ((this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') || this.at === 'validAccessToken') {
      const device = fakeDevices.find((fakeDevice) => fakeDevice.deviceid === deviceId);
      if (device) {
        return Promise.resolve(device);
      }
      return Promise.resolve({ error: false, msg: 'Device does not exist' });
    }
    return Promise.resolve({ error: 406, msg: 'Authentication error' });
  }

  getDeviceChannelCount(deviceId) {
    if ((this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') || this.at === 'validAccessToken') {
      if (deviceId === '10004531ae' || deviceId === '10004532ae') {
        return Promise.resolve({ status: 'ok', switchesAmount: 1 });
      }
      if (deviceId === '10004533ae') {
        return Promise.resolve({ status: 'ok', switchesAmount: 2 });
      }
      return Promise.resolve({ error: false, msg: 'Device does not exist' });
    }
    return Promise.resolve({ error: 406, msg: 'Authentication error' });
  }

  async setDevicePowerState(deviceId, state, channel = 0) {
    const device = await this.getDevice(deviceId);
    if (device && !device.error) {
      if (device && device.online) {
        return Promise.resolve({ status: 'ok', state });
      }
    }
    return Promise.resolve(device);
  }

  async getDevicePowerState(deviceId, channel = 1) {
    const device = await this.getDevice(deviceId);
    if (device && !device.error) {
      if (device && device.online) {
        return Promise.resolve({ status: 'ok', state: 'on' });
      }
    }
    return Promise.resolve(device);
  }

  async getDevicePowerUsage(deviceId) {
    const device = await this.getDevice(deviceId);
    if (device && !device.error) {
      if (device && device.online) {
        return Promise.resolve({
          status: 'ok',
          monthly: 22.3,
          daily: [
            { day: 5, usage: 5.94 },
            { day: 4, usage: 3.64 },
            { day: 3, usage: 2.39 },
            { day: 2, usage: 3.1 },
            { day: 1, usage: 7.23 },
          ],
        });
      }
    }
    return Promise.resolve(device);
  }

  async getDeviceCurrentTH(deviceId, type = '') {
    const device = await this.getDevice(deviceId);
    if (device && !device.error) {
      if (device && device.online) {
        const data = { status: 'ok', temperature: 20, humidity: 42 };
        if (type === 'temp') {
          delete data.humidity;
        }
        if (type === 'humd') {
          delete data.temperature;
        }
        return Promise.resolve(data);
      }
    }
    return Promise.resolve(device);
  }

  getDeviceCurrentTemperature(deviceId) {
    return this.getDeviceCurrentTH(deviceId, 'temp');
  }

  getDeviceCurrentHumidity(deviceId) {
    return this.getDeviceCurrentTH(deviceId, 'humd');
  }

  getFirmwareVersion(deviceId) {
    if ((this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') || this.at === 'validAccessToken') {
      if (deviceId === '10004535ae') {
        return Promise.resolve({ status: 'ok', fwVersion: '3.3.0' });
      }
      const device = fakeDevices.find((fakeDevice) => fakeDevice.deviceid === deviceId);
      if (device && device.params && device.params.fwVersion) {
        return Promise.resolve({ status: 'ok', fwVersion: device.params.fwVersion });
      }
      return Promise.resolve({ error: false, msg: 'Device does not exist' });
    }
    return Promise.resolve({ error: 406, msg: 'Authentication error' });
  }

  checkDeviceUpdate(deviceId) {
    if ((this.email === 'email@valid.ok' && this.password === 'S0m3Th1ngTru3') || this.at === 'validAccessToken') {
      if (deviceId === '10004533ae') {
        return Promise.resolve({ status: 'ok', msg: 'No update available' });
      }
      if (deviceId === '10004531ae' || deviceId === '10004534ae') {
        return Promise.resolve({ status: 'ok', msg: 'Update available', version: '3.5.0' });
      }
      return Promise.resolve({ error: false, msg: 'Device does not exist' });
    }
    return Promise.resolve({ error: 406, msg: 'Authentication error' });
  }
}

module.exports = EwelinkApi;
