const { assert, fake } = require('sinon');
const WithingsController = require('../../../../services/withings/api/withings.controller');

const withingsHandler = {
  init: fake.resolves({ device: { name: 'testServiceID' } }),
  saveVar: fake.resolves({ success: true, serviceId: 'testServiceID' }),
  deleteVar: fake.resolves({ success: true }),
  deleteDevices: fake.resolves({ success: true }),
  getServiceId: fake.returns({ success: true, serviceId: 'testServiceID' }),
};

describe('WithingsController POST /api/v1/service/withings/init', () => {
  const controller = WithingsController(withingsHandler);

  it('should init', async () => {
    const req = { user: { id: 'fsdfdd452f4181fsdf2sdfhgyrjfdsfsd' } };
    const res = { json: fake.returns(null) };

    await controller['post /api/v1/service/withings/init'].controller(req, res);
    assert.calledOnce(withingsHandler.init);
    assert.calledOnce(res.json);
  });
});

describe('WithingsController POST /api/v1/service/withings/saveVar', () => {
  const controller = WithingsController(withingsHandler);

  it('should save oauth2 var', async () => {
    const req = {
      body: {
        clientId: '78sdfds7fsd7f8d3sf5sd4fds24vfd',
        secretId: '45f7sd452f4181fsdf2sdfhgyrjy152',
        integrationName: 'withings',
      },
      user: {
        id: 'fsdfdd452f4181fsdf2sdfhgyrjfdsfsd',
      },
    };
    const res = { json: fake.returns(null) };

    await controller['post /api/v1/service/withings/saveVar'].controller(req, res);
    assert.calledOnce(withingsHandler.saveVar);
    assert.calledOnce(res.json);
  });
});

describe('WithingsController GET /api/v1/service/withings/deleteConfig', () => {
  const controller = WithingsController(withingsHandler);

  it('shoulmd delete config', async () => {
    const req = { user: { id: 'fsdfdd452f4181fsdf2sdfhgyrjfdsfsd' } };
    const res = { json: fake.returns(null) };

    await controller['get /api/v1/service/withings/deleteConfig'].controller(req, res);
    assert.calledOnce(withingsHandler.deleteVar);
    assert.calledOnce(withingsHandler.deleteDevices);
    assert.calledOnce(res.json);
  });
});

describe('WithingsController GET /api/v1/service/withings/getServiceId', () => {
  const controller = WithingsController(withingsHandler);

  it('should return serviceId', () => {
    const res = { json: fake.returns(null) };

    controller['get /api/v1/service/withings/getServiceId'].controller(undefined, res);
    assert.calledOnce(withingsHandler.getServiceId);
    assert.calledOnce(res.json);
  });
});
