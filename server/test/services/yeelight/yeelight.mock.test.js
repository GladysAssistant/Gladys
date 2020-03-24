const Promise = require('bluebird');
const yeelightColor = require('./yeelight-color.json');
const yeelightWhite = require('./yeelight-white.json');

const DevicePropery = {
  POWER: 'power',
  BRIGHT: 'bright',
  CT: 'ct',
  RGB: 'rgb',
  HUE: 'hue',
  SAT: 'sat',
  COLOR_MODE: 'color_mode',
  FLOWING: 'flowing',
  DELAYOFF: 'delayoff',
  FLOW_PARAMS: 'flow_params',
  MUSIC_ON: 'music_on',
  NAME: 'name',
  BG_POWER: 'bg_power',
  BG_FLOWING: 'bg_flowing',
  BG_FLOW_PARAMS: 'bg_flow_params',
  BG_CT: 'bg_ct',
  BG_LMODE: 'bg_lmode',
  BG_BRIGHT: 'bg_bright',
  BG_HUE: 'bg_hue',
  BG_SAT: 'bg_sat',
  BG_RGB: 'bg_rgb',
  NL_BR: 'nl_br',
  ACTIVE_MODE: 'active_mode',
};
const devices = [yeelightColor, yeelightWhite];

class Discover {
  start() {
    this.test = 1; // useless, this is just for eslint
    return Promise.resolve(devices);
  }

  destroy() {
    this.test = 1; // useless, this is just for eslint
    return Promise.resolve(null);
  }
}

const connected = {
  options: { lightIp: '192.168.0.0', lightPort: 55443, timeout: 5000 },
  connected: true,
};

class Yeelight {
  constructor({ lightIp, lightPort }) {
    this.lightIp = lightIp;
    this.lightPort = lightPort;
  }

  connect() {
    if (this.lightIp !== 'not_found') {
      connected.options.lightIp = this.lightIp;
      return Promise.resolve(connected);
    }
    return Promise.reject(new Error('Connection timeout'));
  }

  setPower(turnOn, effect = 'sudden', duration = 500) {
    this.test = 1; // useless, this is just for eslint
    return Promise.resolve({
      action: 'set_power',
      command: { id: 1, method: 'set_power', params: [turnOn ? 'on' : 'off', effect, duration] },
      result: { id: 1, result: ['ok'] },
      success: true,
    });
  }

  setBright(brightness, effect = 'sudden', duration = 500) {
    this.test = 1; // useless, this is just for eslint
    return Promise.resolve({
      action: 'set_bright',
      command: { id: 1, method: 'set_bright', params: [brightness, effect, duration] },
      result: { id: 1, result: ['ok'] },
      success: true,
    });
  }

  getProperty(params) {
    this.test = 1; // useless, this is just for eslint
    return Promise.resolve({
      action: 'get_prop',
      command: { id: 1, method: 'get_prop', params },
      result: { id: 1, result: this.getPropsByParams(params) },
      success: true,
    });
  }

  disconnect() {
    this.test = 1; // useless, this is just for eslint
    return Promise.resolve(null);
  }

  getPropsByParams(props) {
    this.test = 1; // useless, this is just for eslint
    const results = [];
    props.forEach((prop) => {
      switch (prop) {
        case 'power':
          results.push('off');
          break;
        case 'bright':
          results.push(50);
          break;
        case 'rgb':
          results.push(1315890);
          break;

        default:
          break;
      }
    });
    return results;
  }
}

const MockedYeelightApi = {
  Discover,
  Yeelight,
  DevicePropery,
};

module.exports = MockedYeelightApi;
