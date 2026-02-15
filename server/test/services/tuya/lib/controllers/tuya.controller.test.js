const sinon = require('sinon');
const TuyaController = require('../../../../../services/tuya/api/tuya.controller');

const { assert, fake } = sinon;

const tuyaManager = {
  discoverDevices: fake.resolves([]),
  localPoll: fake.resolves({ dps: { 1: true } }),
  localScan: fake.resolves({ device1: { ip: '1.1.1.1', version: '3.3' } }),
  discoveredDevices: [
    {
      external_id: 'tuya:device1',
      params: [],
    },
  ],
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

describe('TuyaController POST /api/v1/service/tuya/local-poll', () => {
  let controller;

  beforeEach(() => {
    controller = TuyaController(tuyaManager);
    sinon.reset();
  });

  it('should return local poll result', async () => {
    const req = {
      body: { deviceId: 'device1', ip: '1.1.1.1', localKey: 'key', protocolVersion: '3.3' },
    };
    const res = {
      json: fake.returns([]),
    };

    await controller['post /api/v1/service/tuya/local-poll'].controller(req, res);
    assert.calledOnce(tuyaManager.localPoll);
    assert.calledOnce(res.json);
  });
});

describe('TuyaController POST /api/v1/service/tuya/local-scan', () => {
  let controller;

  beforeEach(() => {
    controller = TuyaController(tuyaManager);
    sinon.reset();
  });

  it('should run local scan and return devices', async () => {
    const req = { body: { timeoutSeconds: 1 } };
    const res = {
      json: fake.returns([]),
    };

    await controller['post /api/v1/service/tuya/local-scan'].controller(req, res);
    assert.calledOnce(tuyaManager.localScan);
    assert.calledOnce(res.json);
  });
});
