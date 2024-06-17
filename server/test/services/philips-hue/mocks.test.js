const { fake } = require('sinon');
const lights = require('./lights.json');

const STATE_ON = { _values: { on: true } };
const STATE_OFF = { _values: { off: true } };

const fakes = {
  on: fake.returns(STATE_ON),
  off: fake.returns(STATE_ON),
  rgb: fake.returns(null),
  brightness: fake.returns(null),
};

class LightState {}
LightState.prototype.on = fakes.on;
LightState.prototype.off = fakes.off;
LightState.prototype.rgb = fakes.rgb;
LightState.prototype.brightness = fakes.brightness;

const hueApi = {
  syncWithBridge: fake.resolves(null),
  users: {
    createUser: fake.resolves({
      username: 'username',
    }),
  },
  lights: {
    getAll: fake.resolves(lights.lights),
    setLightState: fake.resolves(null),
    getLightState: fake.resolves({
      on: false,
      bri: 56,
      hue: 38191,
      sat: 94,
      effect: 'none',
      xy: [0.3321, 0.3605],
      alert: 'select',
      colormode: 'xy',
      mode: 'homeautomation',
      reachable: true,
    }),
  },
  scenes: {
    getAll: fake.resolves([
      {
        _rawData: {
          name: 'Wake Up end',
          type: 'LightScene',
          lights: [],
          owner: 'e8b9a940-4b66-4145-826a-2ec6d3309bd3',
          recycle: true,
          locked: true,
          appdata: {},
          picture: '',
          lastupdated: '2019-10-07T08:22:17',
          version: 2,
        },
        _id: 'SASYlgJXVcUhTiz',
      },
    ]),
    activateScene: fake.resolves(null),
  },
  configuration: {
    get: () =>
      Promise.resolve({
        bridgeid: '1234',
      }),
  },
};

const hueApiHsColorMode = {
  lights: {
    getLightState: fake.resolves({
      on: false,
      bri: 100,
      hue: 35000,
      sat: 94,
      effect: 'none',
      hs_color: [0.4, 0.1],
      alert: 'select',
      colormode: 'hs',
      mode: 'homeautomation',
      reachable: true,
    }),
  },
};

const hueApiCtColorMode = {
  lights: {
    getLightState: fake.resolves({
      on: true,
      bri: 90,
      hue: 16203,
      sat: 76,
      effect: 'none',
      xy: [0.4181, 0.3975],
      ct: 305,
      alert: 'select',
      colormode: 'ct',
      mode: 'homeautomation',
      reachable: true,
    }),
  },
};

const MockedPhilipsHueClient = {
  v3: {
    lightStates: {
      LightState,
    },
    api: {
      createLocal: () => ({
        connect: () => hueApi,
      }),
    },
    discovery: {
      nupnpSearch: () =>
        Promise.resolve([
          {
            name: 'Philips Hue Bridge',
            ipaddress: '192.168.1.10',
          },
        ]),
    },
  },
};

const MockedPhilipsHueClientUpnp = {
  v3: {
    lightStates: {
      LightState,
    },
    api: {
      createLocal: () => ({
        connect: () => hueApi,
      }),
    },
    discovery: {
      nupnpSearch: () => Promise.resolve([]),
      upnpSearch: () =>
        Promise.resolve([
          {
            name: 'Philips Hue Bridge',
            ipaddress: '192.168.2.245',
            model: {
              serial: '1234',
            },
          },
        ]),
    },
  },
};

module.exports = {
  MockedPhilipsHueClient,
  MockedPhilipsHueClientUpnp,
  STATE_ON,
  STATE_OFF,
  fakes,
  hueApi,
  hueApiHsColorMode,
  hueApiCtColorMode,
};
