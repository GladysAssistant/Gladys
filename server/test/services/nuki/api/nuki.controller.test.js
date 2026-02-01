const sinon = require('sinon');
const { NukiHandlerMock, discoveredDevices } = require('../mocks/nuki.mock.test');
const { serviceId } = require('../mocks/consts.test');

const NukiController = require('../../../../services/nuki/api/nuki.controller');

const { assert, fake } = sinon;

let controllers;
let nukiHandler;

describe('GET /api/v1/service/nuki/status', () => {
  beforeEach(() => {
    sinon.reset();
    nukiHandler = new NukiHandlerMock({}, serviceId);
    controllers = NukiController(nukiHandler);
  });

  it('Get nuki service status', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controllers['get /api/v1/service/nuki/status'].controller(req, res);
    assert.calledOnce(nukiHandler.getStatus);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/nuki/config', () => {
  beforeEach(() => {
    sinon.reset();
    nukiHandler = new NukiHandlerMock({}, serviceId);
    controllers = NukiController(nukiHandler);
  });

  it('Get nuki configuration', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };

    await controllers['get /api/v1/service/nuki/config'].controller(req, res);
    assert.calledOnce(nukiHandler.getConfiguration);
    assert.calledOnce(res.json);
  });
});

describe('POST /api/v1/service/nuki/config', () => {
  beforeEach(() => {
    sinon.reset();
    nukiHandler = new NukiHandlerMock({}, serviceId);
    controllers = NukiController(nukiHandler);
  });

  it('Save nuki configuration', async () => {
    const req = {
      body: [],
    };
    const res = {
      json: fake.returns(null),
    };

    await controllers['post /api/v1/service/nuki/config'].controller(req, res);
    assert.calledOnce(nukiHandler.saveConfiguration);
    assert.calledWith(nukiHandler.saveConfiguration, req.body);
    assert.calledOnce(res.json);
  });
});

describe('GET /api/v1/service/nuki/discover/mqtt', () => {
  beforeEach(() => {
    nukiHandler = {
      getDiscoveredDevices: fake.returns(discoveredDevices),
      scan: fake.resolves(discoveredDevices),
    };

    controllers = NukiController(nukiHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Get discovered MQTT devices', () => {
    const req = {
      params: {
        protocol: 'mqtt',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    controllers['get /api/v1/service/nuki/discover/:protocol'].controller(req, res);
    assert.calledOnce(nukiHandler.getDiscoveredDevices);
    assert.notCalled(nukiHandler.scan);
    assert.calledWith(res.json, discoveredDevices);
  });
});

describe('POST /api/v1/service/nuki/discover/mqtt', () => {
  beforeEach(() => {
    nukiHandler = new NukiHandlerMock({}, serviceId);
    controllers = NukiController(nukiHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Look for MQTT devices', () => {
    const req = {
      params: {
        protocol: 'mqtt',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    controllers['post /api/v1/service/nuki/discover/:protocol'].controller(req, res);
    assert.notCalled(nukiHandler.getDiscoveredDevices);
    assert.calledOnce(nukiHandler.scan);
    assert.calledWith(res.json, { success: true });
  });
});
