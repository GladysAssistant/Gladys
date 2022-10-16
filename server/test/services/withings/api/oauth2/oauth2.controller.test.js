const sinon = require('sinon');

const { fake, assert } = sinon;

const WithingsController = require('../../../../../services/withings/api/withings.controller');

const gladys = {
  device: {
    getBySelector: fake.resolves(null),
  },
  variable: {
    getValue: fake.resolves('fake_client_id'),
    setValue: fake.returns(null),
    destroy: fake.returns(null),
  },
};

const withingsHandler = {
  initDevices: fake.resolves({ device: { name: 'testServiceID' } }),
  poll: fake.resolves({}),
  deleteVar: fake.resolves({ success: true }),
  deleteDevices: fake.resolves({ success: true }),
  oauth2Client: {
    buildAuthorizationUri: fake.returns(null),
    getAccessToken: fake.returns(null),
    getCurrentConfig: fake.returns(null),
  },
};

const controller = WithingsController(gladys, withingsHandler);

describe('POST /api/v1/service/withings/oauth2/client/authorization-uri', () => {
  it('should get authorization uri', async () => {
    const req = {
      headers: {
        referer: 'fake-referer',
      },
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      body: {
        integration_name: 'test',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        redirect_uri_suffix: 'dashboard/integration/health/withings/settings',
      },
    };

    const res = { json: fake.returns(null) };

    await controller['post /api/v1/service/withings/oauth2/client/authorization-uri'].controller(req, res);

    assert.calledOnce(withingsHandler.oauth2Client.buildAuthorizationUri);
    assert.calledOnce(res.json);
    assert.calledWith(res.json, { authorizationUri: null });
  });
});

// failled call
describe('POST /api/v1/service/withings/oauth2/client/authorization-uri', () => {
  it('should get error authorization uri', async () => {
    sinon.reset();
    const req = {
      headers: {
        referer: 'fake-referer',
      },
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      body: {},
    };

    const res = { json: fake.returns(null), status: fake.returns(null) };

    await controller['post /api/v1/service/withings/oauth2/client/authorization-uri'].controller(req, res);

    assert.notCalled(withingsHandler.oauth2Client.getAccessToken);
    assert.notCalled(res.json);
  });
});

describe('POST /api/v1/service/withings/oauth2/client/access-token', () => {
  it('should get token access uri', async () => {
    sinon.reset();
    const req = {
      headers: {
        referer: 'fake-referer',
      },
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      body: {
        integration_name: 'test',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        authorization_code: 'fake-code',
        redirect_uri_suffix: 'fake_redirect_uri',
      },
    };

    const res = { json: fake.returns(null) };

    await controller['post /api/v1/service/withings/oauth2/client/access-token'].controller(req, res);

    assert.calledOnce(withingsHandler.oauth2Client.getAccessToken);
    assert.calledOnce(res.json);
    assert.calledWith(res.json, { result: null });
  });
});

// failled call
describe('POST /api/v1/service/withings/oauth2/client/access-token', () => {
  it('should get error result on token access uri', async () => {
    sinon.reset();
    const req = {
      integration_name: 'test',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
    };

    const res = {
      json: fake.returns(null),
      status: fake.returns(null),
    };
    await controller['post /api/v1/service/withings/oauth2/client/access-token'].controller(req, res);
    assert.notCalled(withingsHandler.oauth2Client.getAccessToken);
    assert.notCalled(res.json);
  });
});

describe('GET /api/v1/service/withings/oauth2/client', () => {
  it('should get client param', async () => {
    const req = {
      headers: {
        referer: 'fake-referer',
      },
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      query: {
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      },
    };

    const res = { json: fake.returns(null) };
    await controller['get /api/v1/service/withings/oauth2/client'].controller(req, res);
    assert.calledOnce(withingsHandler.oauth2Client.getCurrentConfig);
    assert.calledOnce(res.json);
    assert.calledWith(res.json, { client_id: null });
  });
});

// failled call
describe('GET /api/v1/service/withings/oauth2/client', () => {
  it('should get error client param', async () => {
    sinon.reset();

    const req = {
      headers: {
        referer: 'fake-referer',
      },
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      query: {},
    };

    const res = { json: fake.returns(null), status: fake.returns(null) };
    await controller['get /api/v1/service/withings/oauth2/client'].controller(req, res);
    assert.notCalled(withingsHandler.oauth2Client.getAccessToken);
    assert.notCalled(res.json);
  });
});
