const sinon = require('sinon');
const NetatmoController = require('../../../../../services/netatmo/api/netatmo.controller');

const { assert, fake } = sinon;

const configuration = [
  { username: 'username' },
  { clientId: 'clientId' },
  { clientSecret: 'clientSecret' },
  { scopes: { scopeEnergy: 'read_thermostat write_thermostat' } },
];
const bodyTokens = [{ codeOAuth: 'codeOAuth' }, { state: 'state' }, { redirectUri: 'redirectUri' }];
const status = [{ configured: true }, { connected: false }, { status: 'disconnecting' }];
const connectResult = [{ authUrl: 'redirectUriComplet' }, { state: 'state' }];

const netatmoManagerFake = {
  getConfiguration: fake.returns(configuration),
  getStatus: fake.returns(status),
  saveConfiguration: fake.resolves(configuration),
  saveStatus: fake.resolves(status),
  connect: fake.returns(connectResult),
  retrieveTokens: fake.resolves({ success: true }),
  disconnect: fake.resolves({ success: true }),
};

describe('NetatmoController GET/POST', () => {
  let controller;
  beforeEach(() => {
    controller = NetatmoController(netatmoManagerFake);
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
    assert.calledOnce(netatmoManagerFake.getConfiguration);
    assert.notCalled(netatmoManagerFake.getStatus);
    assert.notCalled(netatmoManagerFake.saveConfiguration);
    assert.notCalled(netatmoManagerFake.saveStatus);
    assert.notCalled(netatmoManagerFake.connect);
    assert.notCalled(netatmoManagerFake.retrieveTokens);
    assert.notCalled(netatmoManagerFake.disconnect);
    assert.calledWith(res.json, sinon.match(configuration));
  });
  it('should return get status', async () => {
    const req = {};
    const res = {
      json: fake.returns(status),
    };
    await controller['get /api/v1/service/netatmo/status'].controller(req, res);
    assert.notCalled(netatmoManagerFake.getConfiguration);
    assert.calledOnce(netatmoManagerFake.getStatus);
    assert.notCalled(netatmoManagerFake.saveConfiguration);
    assert.notCalled(netatmoManagerFake.saveStatus);
    assert.notCalled(netatmoManagerFake.connect);
    assert.notCalled(netatmoManagerFake.retrieveTokens);
    assert.notCalled(netatmoManagerFake.disconnect);
    assert.calledWith(res.json, sinon.match(status));
  });
  it('should save configuration', async () => {
    const req = {
      body: configuration,
    };
    const res = {
      json: fake(),
    };
    await controller['post /api/v1/service/netatmo/saveConfiguration'].controller(req, res);
    assert.notCalled(netatmoManagerFake.getConfiguration);
    assert.notCalled(netatmoManagerFake.getStatus);
    assert.calledOnce(netatmoManagerFake.saveConfiguration);
    assert.notCalled(netatmoManagerFake.saveStatus);
    assert.notCalled(netatmoManagerFake.connect);
    assert.notCalled(netatmoManagerFake.retrieveTokens);
    assert.notCalled(netatmoManagerFake.disconnect);
    sinon.assert.calledOnceWithExactly(netatmoManagerFake.saveConfiguration, req.body);
    sinon.assert.calledWithExactly(res.json, { success: configuration });
  });
  it('should save status', async () => {
    const req = {
      body: status,
    };
    const res = {
      json: fake(),
    };
    await controller['post /api/v1/service/netatmo/saveStatus'].controller(req, res);
    assert.notCalled(netatmoManagerFake.getConfiguration);
    assert.notCalled(netatmoManagerFake.getStatus);
    assert.notCalled(netatmoManagerFake.saveConfiguration);
    assert.calledOnce(netatmoManagerFake.saveStatus);
    assert.notCalled(netatmoManagerFake.connect);
    assert.notCalled(netatmoManagerFake.retrieveTokens);
    assert.notCalled(netatmoManagerFake.disconnect);
    sinon.assert.calledOnceWithExactly(netatmoManagerFake.saveStatus, req.body);
    sinon.assert.calledWithExactly(res.json, { success: status });
  });
  it('should connect', async () => {
    const req = {};
    const res = {
      json: fake(),
    };
    await controller['post /api/v1/service/netatmo/connect'].controller(req, res);
    assert.calledOnce(netatmoManagerFake.getConfiguration);
    assert.notCalled(netatmoManagerFake.getStatus);
    assert.notCalled(netatmoManagerFake.saveConfiguration);
    assert.notCalled(netatmoManagerFake.saveStatus);
    assert.calledOnce(netatmoManagerFake.connect);
    assert.notCalled(netatmoManagerFake.retrieveTokens);
    assert.notCalled(netatmoManagerFake.disconnect);
    sinon.assert.calledOnceWithExactly(netatmoManagerFake.connect, sinon.match.any, configuration);
    sinon.assert.calledWithExactly(res.json, { result: connectResult });
  });
  it('should retrieve tokens', async () => {
    const req = {
      body: bodyTokens,
    };
    const res = {
      json: fake(),
    };
    await controller['post /api/v1/service/netatmo/retrieveTokens'].controller(req, res);
    assert.calledOnce(netatmoManagerFake.getConfiguration);
    assert.notCalled(netatmoManagerFake.getStatus);
    assert.notCalled(netatmoManagerFake.saveConfiguration);
    assert.notCalled(netatmoManagerFake.saveStatus);
    assert.notCalled(netatmoManagerFake.connect);
    assert.calledOnce(netatmoManagerFake.retrieveTokens);
    assert.notCalled(netatmoManagerFake.disconnect);
    sinon.assert.calledOnceWithExactly(netatmoManagerFake.retrieveTokens, sinon.match.any, configuration, req.body);
    sinon.assert.calledWithExactly(res.json, { result: { success: true } });
  });
  it('should disconnect', async () => {
    const req = {};
    const res = {
      json: fake(),
    };
    await controller['post /api/v1/service/netatmo/disconnect'].controller(req, res);
    assert.notCalled(netatmoManagerFake.getConfiguration);
    assert.notCalled(netatmoManagerFake.getStatus);
    assert.notCalled(netatmoManagerFake.saveConfiguration);
    assert.notCalled(netatmoManagerFake.saveStatus);
    assert.notCalled(netatmoManagerFake.connect);
    assert.notCalled(netatmoManagerFake.retrieveTokens);
    sinon.assert.calledOnce(netatmoManagerFake.disconnect);
    sinon.assert.calledWithExactly(res.json, { success: true });
  });
});
