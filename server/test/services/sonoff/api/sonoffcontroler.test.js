const { assert, fake } = require('sinon');
const SonoffController = require('../../../../services/sonoff/api/sonoff.controller');

const discoveredDevices = [{ device: 'first' }, { device: 'second' }];
const sonoffHandler = {
  getDiscoveredDevices: fake.returns(discoveredDevices),
};

describe('GET /api/v1/service/sonoff/discover', () => {
  let controller;

  beforeEach(() => {
    controller = SonoffController(sonoffHandler);
  });

  it('Discover', () => {
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/sonoff/discover'].controller(undefined, res);
    assert.calledOnce(sonoffHandler.getDiscoveredDevices);
    assert.calledWith(res.json, discoveredDevices);
  });
});
