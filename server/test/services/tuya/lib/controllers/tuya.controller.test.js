const sinon = require('sinon');
const TuyaController = require('../../../../../services/tuya/api/tuya.controller');

const { assert, fake } = sinon;

const tuyaManager = {
  discoverDevices: fake.resolves([]),
};

describe('TuyaController GET /api/v1/service/tuya/discover', () => {
  let controller;

  beforeEach(() => {
    controller = TuyaController(tuyaManager);
    sinon.reset();
  });

  it('should return discovered devices', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/tuya/discover'].controller(req, res);
    assert.calledOnce(tuyaManager.discoverDevices);
    assert.calledOnce(res.json);
  });
});
