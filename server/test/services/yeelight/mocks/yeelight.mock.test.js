const Promise = require('bluebird');
const { EventEmitter } = require('events');
const yeelightColor = require('./yeelight/color.json');
const yeelightWhite = require('./yeelight/white.json');
const yeelightUnhandled = require('./yeelight/unhandled.json');

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

class DiscoverMock extends EventEmitter {
  constructor(returnDevices, isTimeout = false) {
    super();
    this.returnDevices = returnDevices;
    this.isTimeout = isTimeout;
  }

  start() {
    this.test = 1; // useless, this is just for eslint
    if (this.isTimeout) {
      return new Promise((resolve, _) => setTimeout(() => resolve([]), 10500));
    }
    this.returnDevices.forEach((device) => this.emit('deviceAdded', device));
    return new Promise((resolve, _) => resolve(this.returnDevices));
  }

  scanByIp() {
    this.test = 1; // useless, this is just for eslint
    if (this.isTimeout) {
      return new Promise((resolve, _) => setTimeout(() => resolve([]), 10500));
    }
    this.returnDevices.forEach((device) => this.emit('deviceAdded', device));
    return new Promise((resolve, _) => resolve(this.returnDevices));
  }

  destroy() {
    this.test = 1; // useless, this is just for eslint
    return Promise.resolve();
  }
}

class DiscoverEmpty extends DiscoverMock {
  constructor() {
    super([]);
  }
}

class DiscoverFull extends DiscoverMock {
  constructor() {
    super([yeelightColor, yeelightWhite, yeelightUnhandled]);
  }
}

class DiscoverTimeout extends DiscoverMock {
  constructor() {
    super([], true);
  }
}

class YeelightMock extends EventEmitter {
  constructor({ lightIp, lightPort, isEmpty, isTimeout }) {
    super();
    this.connected = false;
    this.options = { lightIp, lightPort, timeout: 5000 };
    this.isEmpty = isEmpty;
    this.isTimeout = isTimeout;
  }

  connect() {
    if (!this.isEmpty) {
      if (this.options.lightIp === 'not_exist') {
        return Promise.resolve(null);
      }
      this.connected = this.options.lightIp !== 'not_connected';
      return Promise.resolve(this);
    }
    return Promise.reject(new Error('Connection timeout'));
  }

  setPower(turnOn, effect = 'sudden', duration = 500) {
    this.test = 1; // useless, this is just for eslint
    if (this.isEmpty || this.isTimeout) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      action: 'set_power',
      command: { id: 1, method: 'set_power', params: [turnOn ? 'on' : 'off', effect, duration] },
      result: { id: 1, result: ['ok'] },
      success: true,
    });
  }

  setBright(brightness, effect = 'sudden', duration = 500) {
    this.test = 1; // useless, this is just for eslint
    if (this.isEmpty || this.isTimeout) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      action: 'set_bright',
      command: { id: 1, method: 'set_bright', params: [brightness, effect, duration] },
      result: { id: 1, result: ['ok'] },
      success: true,
    });
  }

  setCtAbx(ct, effect = 'sudden', duration = 500) {
    this.test = 1; // useless, this is just for eslint
    if (this.isEmpty || this.isTimeout) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      action: 'set_ct_abx',
      command: { id: 1, method: 'set_ct_abx', params: [ct, effect, duration] },
      result: { id: 1, result: ['ok'] },
      success: true,
    });
  }

  setRGB(color, effect = 'sudden', duration = 500) {
    this.test = 1; // useless, this is just for eslint
    if (this.isEmpty || this.isTimeout) {
      return Promise.resolve(null);
    }
    const mergedColor = color.red * 65536 + color.green * 256 + color.blue;
    return Promise.resolve({
      action: 'set_rgb',
      command: { id: 1, method: 'set_rgb', params: [mergedColor, effect, duration] },
      result: { id: 1, result: ['ok'] },
      success: true,
    });
  }

  getProperty(params) {
    this.test = 1; // useless, this is just for eslint
    if (this.isEmpty || this.isTimeout) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      action: 'get_prop',
      command: { id: 1, method: 'get_prop', params },
      result: { id: 1, result: this.getPropsByParams(params) },
      success: true,
    });
  }

  disconnect() {
    this.connected = false;
    return Promise.resolve(null);
  }

  getPropsByParams(props) {
    this.test = 1; // useless, this is just for eslint
    const results = [];
    if (!this.isEmpty && !this.isTimeout) {
      props.forEach((prop) => {
        switch (prop) {
          case 'power':
            results.push('off');
            break;
          case 'bright':
            results.push(50);
            break;
          case 'ct':
            results.push(4000);
            break;
          case 'rgb':
            results.push(1315890);
            break;

          default:
            break;
        }
      });
    }
    return results;
  }
}

class YeelightEmpty extends YeelightMock {
  constructor({ lightIp, lightPort }) {
    super({ lightIp, lightPort, isEmpty: true, isTimeout: false });
  }
}

class YeelightFull extends YeelightMock {
  constructor({ lightIp, lightPort }) {
    super({ lightIp, lightPort, isEmpty: false, isTimeout: false });
  }
}

class YeelightTimeout extends YeelightMock {
  constructor({ lightIp, lightPort }) {
    super({ lightIp, lightPort, isEmpty: false, isTimeout: true });
  }
}

const hexToNumber = function hexToNumber(hex) {
  const hexString = hex.toUpperCase();
  let result = 0;
  for (let i = 1; i <= hexString.length; i += 1) {
    let valueNumber = hexString.charCodeAt(i - 1);
    valueNumber -= valueNumber >= 65 ? 55 : 48;
    result += valueNumber * 16 ** (hex.length - i);
  }
  return result;
};

class Color {
  constructor(red, green, blue, color = undefined) {
    if (color) {
      this.color = color.toUpperCase();
      this.red = hexToNumber(color.substr(0, 2));
      this.green = hexToNumber(color.substr(2, 2));
      this.blue = hexToNumber(color.substr(4, 2));
    }
  }

  getValue() {
    return this.red * 65536 + this.green * 256 + this.blue;
  }
}

const MockedEmptyYeelightApi = {
  Discover: DiscoverEmpty,
  Yeelight: YeelightEmpty,
  Color,
  DevicePropery,
};

const MockedYeelightApi = {
  Discover: DiscoverFull,
  Yeelight: YeelightFull,
  Color,
  DevicePropery,
};

const MockedTimeoutYeelightApi = {
  Discover: DiscoverTimeout,
  Yeelight: YeelightTimeout,
  Color,
  DevicePropery,
};

module.exports = {
  MockedYeelightApi,
  MockedEmptyYeelightApi,
  MockedTimeoutYeelightApi,
};
