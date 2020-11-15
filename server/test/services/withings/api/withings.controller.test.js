const { assert, fake } = require('sinon');
const WithingsController = require('../../../../services/withings/api/withings.controller');

const withingsHandler = {
  getServiceId: fake.returns('testServiceID'),
  init: fake.returns({ device: { name: 'testServiceID' } }),
  saveVar: fake.returns({ success: true, serviceId: 'iojkjbhbkjhu' }),
  deleteVar: fake.returns({ success: true, serviceId: 'iojkjbhbkjhu' }),
  deleteDevices: fake.returns({ success: true, serviceId: 'iojkjbhbkjhu' }),
  serviceId: 'testServiceID',
};

describe('GET /api/v1/service/withings/getServiceId', () => {
  let controller;

  beforeEach(() => {
    controller = WithingsController(withingsHandler);
  });

  it('getServiceId', () => {
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/withings/getServiceId'].controller(undefined, res);
    assert.calledOnce(withingsHandler.getServiceId);
  });
});

describe('POST /api/v1/service/withings/saveVar', () => {
  let controller;

  beforeEach(() => {
    controller = WithingsController(withingsHandler);
  });

  it('saveVar', () => {
    const res = {
      json: fake.returns(null),
    };
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

    controller['post /api/v1/service/withings/saveVar'].controller(req, res);
    assert.calledOnce(withingsHandler.saveVar);
  });
});

describe('POST /api/v1/service/withings/init', () => {
  let controller;

  beforeEach(() => {
    controller = WithingsController(withingsHandler);
  });

  it('init', () => {
    const res = {
      json: fake.returns(null),
    };
    const req = { 
      user: {
        id: 'fsdfdd452f4181fsdf2sdfhgyrjfdsfsd',
      },
    };

    controller['post /api/v1/service/withings/init'].controller(req, res);
    assert.calledOnce(withingsHandler.init);
  });
});

describe('GET /api/v1/service/withings/deleteConfig', () => {
  let controller;

  beforeEach(() => {
    controller = WithingsController(withingsHandler);
  });
  it('deleteConfig', () => {
    const res = {
      json: fake.returns(null),
    };
    const req = {
      query: {
        userId: 'fsdfdd452f4181fsdf2sdfhgyrjfdsfsd',
      }, 
    };

    controller['get /api/v1/service/withings/deleteConfig'].controller(req, res);
    assert.calledOnce(withingsHandler.deleteVar);
  });
});
