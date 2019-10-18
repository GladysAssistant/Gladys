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

const MockedPhilipsHueClient = {
  v3: {
    lightStates: {
      LightState,
    },
    api: {
      create: () => ({
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
