const sinon = require('sinon');

const { assert, fake } = sinon;

const MELCloudHomeController = require('../../../../../services/melcloud-home/api/melcloud-home.controller');

const melCloudHomeManager = {
  discoverDevices: fake.resolves([]),
};

describe('MELCloudHomeController GET /api/v1/service/melcloud-home/discover', () => {
  let controller;

  beforeEach(() => {
    controller = MELCloudHomeController(melCloudHomeManager);
    sinon.reset();
  });

  it('should return discovered devices', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/melcloud-home/discover'].controller(req, res);
    assert.calledOnce(melCloudHomeManager.discoverDevices);
    assert.calledOnce(res.json);
  });
});
