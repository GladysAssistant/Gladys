const { assert, fake } = require('sinon');
const YeelightControllers = require('../../../../services/yeelight/api/yeelight.controller');

const yeelightService = {
  scan: fake.resolves([{ name: 'Yeelight' }]),
};

const res = {
  json: fake.returns(null),
};

describe('GET /service/yeelight/scan', () => {
  it('should scan', async () => {
    const yeelightController = YeelightControllers(yeelightService);
    await yeelightController['get /api/v1/service/yeelight/scan'].controller({}, res);
    assert.called(yeelightService.scan);
  });
});
