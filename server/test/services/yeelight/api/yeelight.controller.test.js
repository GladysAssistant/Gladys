const sinon = require('sinon');
const YeelightController = require('../../../../services/yeelight/api/yeelight.controller');

const { assert, fake } = sinon;

const discoveredDevices = [{ name: 'Yeelight' }];
const yeelightService = {
  discover: fake.resolves(discoveredDevices),
};

const res = {
  json: fake.returns(null),
};

describe('YeelightController GET /service/yeelight/discover', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should call discover and return discovered devices', async () => {
    const yeelightController = YeelightController(yeelightService);
    await yeelightController['get /api/v1/service/yeelight/discover'].controller({}, res);
    assert.called(yeelightService.discover);
    assert.calledWithExactly(res.json, discoveredDevices);
  });
});
