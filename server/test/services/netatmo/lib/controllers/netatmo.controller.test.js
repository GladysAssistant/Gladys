const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const NetatmoController = require('../../../../../services/netatmo/api/netatmo.controller');
const NetatmoContext = require('../../netatmo.mock.test');

const { assert, fake } = sinon;

const NetatmoHandler = proxyquire('../../../../../services/netatmo/lib/index', {
  NetatmoContext,
});

const configuration = [
  { username: 'username' },
  { clientId: 'clientId' },
  { clientSecret: 'clientSecret' },
  { scopes: { scopeEnergy: 'read_thermostat write_thermostat' } }
];
const bodyTokens = [
  { codeOAuth: 'codeOAuth' },
  { state: 'state' },
  { redirectUri: 'redirectUri' }
];
const status = [
  { configured: true },
  { connected: false },
  { status: 'disconnecting' }
];
const connectResult = [
  { authUrl: 'redirectUriComplet' },
  { state: 'state' }
]
const netatmoManager = {
  getConfiguration: fake.returns(configuration),
  getStatus: fake.returns(status),
  saveConfiguration: fake.resolves(configuration),
  saveStatus: fake.resolves(status),
  connect: fake.returns(connectResult),
  retrieveTokens: fake.resolves({ success: true }),
  disconnect: fake.resolves({ success: true }),
};

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe.only('NetatmoController GET/POST', () => {
  let controller;

  beforeEach(() => {
    controller = NetatmoController(netatmoManager);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should return configuration', async () => {
    const req = {};
    const res = {
      json: fake.returns(configuration),
    };
    await controller['get /api/v1/service/netatmo/config'].controller(req, res);
    assert.calledOnce(netatmoManager.getConfiguration);
    assert.notCalled(netatmoManager.getStatus);
    assert.notCalled(netatmoManager.saveConfiguration);
    assert.notCalled(netatmoManager.saveStatus);
    assert.notCalled(netatmoManager.connect);
    assert.notCalled(netatmoManager.retrieveTokens);
    assert.notCalled(netatmoManager.disconnect);
    assert.calledWith(res.json, sinon.match(configuration));
  });

  it('should return get status', async () => {
    const req = {};
    const res = {
      json: fake.returns(status),
    };
    await controller['get /api/v1/service/netatmo/status'].controller(req, res);
    assert.notCalled(netatmoManager.getConfiguration);
    assert.calledOnce(netatmoManager.getStatus);
    assert.notCalled(netatmoManager.saveConfiguration);
    assert.notCalled(netatmoManager.saveStatus);
    assert.notCalled(netatmoManager.connect);
    assert.notCalled(netatmoManager.retrieveTokens);
    assert.notCalled(netatmoManager.disconnect);
    assert.calledWith(res.json, sinon.match(status));
  });

  it('should save configuration', async () => {
    const req = {
      body: configuration
    };
    const res = {
      json: fake(),
    };

    await controller['post /api/v1/service/netatmo/saveConfiguration'].controller(req, res);

    assert.notCalled(netatmoManager.getConfiguration);
    assert.notCalled(netatmoManager.getStatus);
    assert.calledOnce(netatmoManager.saveConfiguration);
    assert.notCalled(netatmoManager.saveStatus);
    assert.notCalled(netatmoManager.connect);
    assert.notCalled(netatmoManager.retrieveTokens)
    assert.notCalled(netatmoManager.disconnect);

    sinon.assert.calledOnceWithExactly(
      netatmoManager.saveConfiguration,
      sinon.match.any,
      req.body
    );
    sinon.assert.calledWithExactly(res.json, { success: configuration });
  });
  it('should save status', async () => {
    const req = {
      body: status
    };
    const res = {
      json: fake(),
    };

    await controller['post /api/v1/service/netatmo/saveStatus'].controller(req, res);
    assert.notCalled(netatmoManager.getConfiguration);
    assert.notCalled(netatmoManager.getStatus);
    assert.notCalled(netatmoManager.saveConfiguration);
    assert.calledOnce(netatmoManager.saveStatus);
    assert.notCalled(netatmoManager.connect);
    assert.notCalled(netatmoManager.retrieveTokens);
    assert.notCalled(netatmoManager.disconnect);

    sinon.assert.calledOnceWithExactly(netatmoManager.saveStatus, req.body);
    sinon.assert.calledWithExactly(res.json, { success: status });
  });
  it('should connect', async () => {
    const req = {};
    const res = {
      json: fake(),
    };

    await controller['post /api/v1/service/netatmo/connect'].controller(req, res);
    assert.calledOnce(netatmoManager.getConfiguration);
    assert.notCalled(netatmoManager.getStatus);
    assert.notCalled(netatmoManager.saveConfiguration);
    assert.notCalled(netatmoManager.saveStatus);
    assert.calledOnce(netatmoManager.connect);
    assert.notCalled(netatmoManager.retrieveTokens);
    assert.notCalled(netatmoManager.disconnect);

    // console.log(netatmoManager.saveConfiguration.getCall(0).args);
    sinon.assert.calledOnceWithExactly(
      netatmoManager.connect,
      sinon.match.any,
      configuration
    );
    sinon.assert.calledWithExactly(res.json, { result: connectResult });

    // sinon.assert.calledOnce(netatmoManager.connect);
    // sinon.assert.calledWithExactly(res.json, { success: true });
  });
  it('should retrieve tokens', async () => {
    const req = {
      body: bodyTokens
    };
    const res = {
      json: fake(),
    };

    await controller['post /api/v1/service/netatmo/retrieveTokens'].controller(req, res);
    assert.calledOnce(netatmoManager.getConfiguration);
    assert.notCalled(netatmoManager.getStatus);
    assert.notCalled(netatmoManager.saveConfiguration);
    assert.notCalled(netatmoManager.saveStatus);
    assert.notCalled(netatmoManager.connect);
    assert.calledOnce(netatmoManager.retrieveTokens);
    assert.notCalled(netatmoManager.disconnect);


    // console.log(netatmoManager.retrieveTokens.getCall(0).args);
    // console.log(req.body);
    sinon.assert.calledOnceWithExactly(
      netatmoManager.retrieveTokens,
      sinon.match.any,
      configuration,
      req.body
    );
    // sinon.assert.calledWithExactly(res.json, { success: configuration });
    // sinon.assert.calledOnceWithExactly(netatmoManager.retrieveTokens, sinon.match.any, configuration, req.body);
    sinon.assert.calledWithExactly(res.json, { result: { success: true } });
  });
  it('should disconnect', async () => {
    const req = {};
    const res = {
      json: fake(),
    };

    await controller['post /api/v1/service/netatmo/disconnect'].controller(req, res);
    assert.notCalled(netatmoManager.getConfiguration);
    assert.notCalled(netatmoManager.getStatus);
    assert.notCalled(netatmoManager.saveConfiguration);
    assert.notCalled(netatmoManager.saveStatus);
    assert.notCalled(netatmoManager.connect);
    assert.notCalled(netatmoManager.retrieveTokens);
    sinon.assert.calledOnce(netatmoManager.disconnect);

    sinon.assert.calledWithExactly(res.json, { success: true });
  });


});
