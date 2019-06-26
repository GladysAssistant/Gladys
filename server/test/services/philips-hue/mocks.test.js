const lights = require('./lights.json');

class HueApi {
  constructor() {
    this.userId = 'PHILIPS_HUE_USER_ID_TEST';
  }

  async registerUser(host, name) {
    return Promise.resolve(this.userId);
  }

  async setLightState(lightId, state) {
    return Promise.resolve(this.userId);
  }

  async lights() {
    return Promise.resolve(this.userId).then(() => lights);
  }
}

const STATE_ON = { _values: { on: true } };
const STATE_OFF = { _values: { off: true } };

const MockedPhilipsHueClient = {
  HueApi,
  lightState: {
    create: () => ({
      on: () => STATE_ON,
      off: () => STATE_OFF,
    }),
  },
  nupnpSearch: () =>
    Promise.resolve([
      {
        name: 'Philips hue',
        ipaddress: '192.168.2.245',
      },
    ]),
};

module.exports = MockedPhilipsHueClient;
module.exports.STATE_ON = STATE_ON;
module.exports.STATE_OFF = STATE_OFF;
