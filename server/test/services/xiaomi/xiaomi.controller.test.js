const { assert, fake } = require('sinon');
const XiaomiController = require('../../../services/xiaomi/api/xiaomi.controller');

const sensors = [
  {
    name: 'Plug',
  },
];

const getSensors = fake.resolves(sensors);

const res = {
  json: fake.returns(null),
};

describe('GET /api/v1/service/xiaomi/sensor', () => {
  it('should get sensors', async () => {
    const xiaomiController = XiaomiController({ getSensors });
    const req = {};
    await xiaomiController['get /api/v1/service/xiaomi/sensor'].controller(req, res);
    assert.calledOnce(getSensors);
  });
});
