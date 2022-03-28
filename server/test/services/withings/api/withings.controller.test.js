const { assert, fake } = require('sinon');
const WithingsController = require('../../../../services/withings/api/withings.controller');

const withingsHandler = {
  init: fake.resolves({ device: { name: 'testServiceID' } }),
  poll: fake.resolves({}),
  deleteVar: fake.resolves({ success: true }),
  deleteDevices: fake.resolves({ success: true }),
};

const gladys = {
  device: {
    getBySelector: fake.resolves(null),
  },
};

describe('WithingsController POST /api/v1/service/withings/init', () => {
  const controller = WithingsController(gladys, withingsHandler);

  it('should init', async () => {
    const req = { user: { id: 'fsdfdd452f4181fsdf2sdfhgyrjfdsfsd' } };
    const res = { json: fake.returns(null) };

    await controller['post /api/v1/service/withings/init'].controller(req, res);
    assert.calledOnce(withingsHandler.init);
    assert.calledOnce(res.json);
  });
});

describe('WithingsController GET /api/v1/service/withings/reset', () => {
  const controller = WithingsController(gladys, withingsHandler);

  it('should delete config', async () => {
    const req = { user: { id: 'fsdfdd452f4181fsdf2sdfhgyrjfdsfsd' } };
    const res = { json: fake.returns(null) };

    await controller['get /api/v1/service/withings/reset'].controller(req, res);
    assert.calledOnce(withingsHandler.deleteVar);
    assert.calledOnce(withingsHandler.deleteDevices);
  });
});
