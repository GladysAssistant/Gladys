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

const MockedMiLightClient = {
  v3: {
    lightStates: {
      LightState,
    },
    discovery: {
      nupnpSearch: () =>
        Promise.resolve([
          {
            name: 'Mi Light Bridge',
            ipaddress: '192.168.10.245',
            mac: '00:1B:44:11:3A:B7',
            type: 'v6',
          },
        ]),
    },
  },
};

module.exports = MockedMiLightClient;
module.exports.STATE_ON = STATE_ON;
module.exports.STATE_OFF = STATE_OFF;
