const { fake } = require('sinon');
const lights = require('./lights.json');

const STATE_ON = { _values: { on: true } };
const STATE_OFF = { _values: { off: true } };

class LightState {
  on() {
    this.test = 1; // useless, this is just for eslint
    return STATE_ON;
  }

  off() {
    this.test = 1; // useless, this is just for eslint
    return STATE_OFF;
  }
}

const hueApi = {
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
      bri: 0,
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
            ipaddress: '192.168.2.245',
            model: {
              serial: '1234',
            },
          },
        ]),
    },
  },
};

module.exports = MockedPhilipsHueClient;
module.exports.STATE_ON = STATE_ON;
module.exports.STATE_OFF = STATE_OFF;
