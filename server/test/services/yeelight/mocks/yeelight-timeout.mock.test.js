const Promise = require('bluebird');
const { EventEmitter } = require('events');

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

class Discover extends EventEmitter {
  start() {
    this.test = 1; // useless, this is just for eslint
    return new Promise((resolve, _) => setTimeout(() => resolve([]), 10500));
  }

  destroy() {
    this.test = 1; // useless, this is just for eslint
    return Promise.resolve();
  }
}

class Yeelight {
  constructor({ lightIp, lightPort }) {
    this.lightIp = lightIp;
    this.lightPort = lightPort;
  }

  connect() {
    this.test = 1; // useless, this is just for eslint
    return Promise.reject(new Error('Connection timeout'));
  }

  setPower(turnOn, effect = 'sudden', duration = 500) {
    this.test = 1; // useless, this is just for eslint
    return Promise.resolve(null);
  }

  setBright(brightness, effect = 'sudden', duration = 500) {
    this.test = 1; // useless, this is just for eslint
    return Promise.resolve(null);
  }

  getProperty(params) {
    this.test = 1; // useless, this is just for eslint
    return Promise.resolve(null);
  }

  disconnect() {
    this.test = 1; // useless, this is just for eslint
    return Promise.resolve(null);
  }

  getPropsByParams(props) {
    this.test = 1; // useless, this is just for eslint
    return [];
  }
}

const MockedYeelightApi = {
  Discover,
  Yeelight,
  DevicePropery,
};

module.exports = MockedYeelightApi;
