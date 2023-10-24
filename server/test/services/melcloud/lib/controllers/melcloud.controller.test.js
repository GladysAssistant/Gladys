const sinon = require('sinon');
const MELCloudController = require('../../../../../services/melcloud/api/melcloud.controller');

const { assert, fake } = sinon;

const melcloudManager = {
  discoverDevices: fake.resolves([]),
};

describe('MELCloudController GET /api/v1/service/melcloud/discover', () => {
  let controller;

  beforeEach(() => {
    controller = MELCloudController(melcloudManager);
    sinon.reset();
  });

  it('should return discovered devices', async () => {
    const req = {};
    const res = {
      json: fake.returns([]),
    };

    await controller['get /api/v1/service/melcloud/discover'].controller(req, res);
    assert.calledOnce(melcloudManager.discoverDevices);
    assert.calledOnce(res.json);
  });
});
