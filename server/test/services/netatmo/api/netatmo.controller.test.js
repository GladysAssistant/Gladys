const { assert, fake } = require('sinon');
const NetatmoController = require('../../../../services/netatmo/api/netatmo.controller');

const netatmoManager = function NetatmoManager() {};

const sensors = [
  {
    name: 'Plug',
  },
];

netatmoManager.connect = fake.returns(null);
netatmoManager.disconnect = fake.returns(null);
netatmoManager.getSensors = fake.returns(sensors);

const res = {
  json: fake.returns(null),
  status: fake.returns(null),
};

describe('POST /api/v1/service/netatmo/connect', () => {
  it('should connect', async () => {
    const netatmoController = NetatmoController(netatmoManager);
    await netatmoController['post /api/v1/service/netatmo/connect'].controller({}, res);
    assert.called(netatmoManager.connect);
  });
  it('should disconnect', async () => {
    const netatmoController = NetatmoController(netatmoManager);
    await netatmoController['post /api/v1/service/netatmo/disconnect'].controller({}, res);
    assert.called(netatmoManager.disconnect);
  });
});

describe('GET /api/v1/service/netatmo/sensor', () => {
  it('should get sensors', async () => {
    const netatmoController = NetatmoController(netatmoManager);
    const req = {};
    await netatmoController['get /api/v1/service/netatmo/sensor'].controller(req, res);
    assert.calledOnce(netatmoManager.getSensors);
  });
});
