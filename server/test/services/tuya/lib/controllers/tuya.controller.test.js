const sinon = require('sinon');
const { expect } = require('chai');
const TuyaController = require('../../../../../services/tuya/api/tuya.controller');

const { assert, fake } = sinon;

const tuyaManager = {
  discoverDevices: fake.resolves([]),
  localPoll: fake.resolves({ dps: { 1: true } }),
  localScan: fake.resolves({ devices: { device1: { ip: '1.1.1.1', version: '3.3' } }, portErrors: {} }),
  getStatus: fake.resolves({ status: 'connected' }),
  manualDisconnect: fake.resolves(),
  discoveredDevices: [
    {
      external_id: 'tuya:device1',
      params: [],
    },
  ],
};
const defaultLocalScan = tuyaManager.localScan;

describe('TuyaController GET /api/v1/service/tuya/discover', () => {
  let controller;

  beforeEach(() => {
    controller = TuyaController(tuyaManager);
    sinon.resetHistory();
    tuyaManager.localScan = fake.resolves({ devices: { device1: { ip: '1.1.1.1', version: '3.3' } }, portErrors: {} });
    tuyaManager.discoveredDevices = [{ external_id: 'tuya:device1', params: [] }];
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
    sinon.resetHistory();
    tuyaManager.localScan = fake.resolves({ devices: { device1: { ip: '1.1.1.1', version: '3.3' } }, portErrors: {} });
    tuyaManager.discoveredDevices = [{ external_id: 'tuya:device1', params: [] }];
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

  it('should return local poll result without updating device', async () => {
    const req = {
      body: { deviceId: 'unknown', ip: '1.1.1.1', localKey: 'key', protocolVersion: '3.3' },
    };
    const res = {
      json: fake.returns([]),
    };
    tuyaManager.discoveredDevices = [{ external_id: 'tuya:device1', params: [] }];

    await controller['post /api/v1/service/tuya/local-poll'].controller(req, res);
    assert.calledOnce(tuyaManager.localPoll);
    assert.calledWith(res.json, { dps: { 1: true } });
  });

  it('should update existing params when device is found', async () => {
    const req = {
      body: { deviceId: 'device1', ip: '2.2.2.2', protocolVersion: '3.3' },
    };
    const res = {
      json: fake.returns([]),
    };
    tuyaManager.discoveredDevices = [
      {
        external_id: 'tuya:device1',
        product_id: 'pid',
        product_key: 'pkey',
        params: [{ name: 'IP_ADDRESS', value: '1.1.1.1' }],
      },
    ];

    await controller['post /api/v1/service/tuya/local-poll'].controller(req, res);

    const updated = tuyaManager.discoveredDevices[0];
    const ipParam = updated.params.find((param) => param.name === 'IP_ADDRESS');
    const localKeyParam = updated.params.find((param) => param.name === 'LOCAL_KEY');

    expect(ipParam.value).to.equal('2.2.2.2');
    expect(localKeyParam).to.equal(undefined);
    assert.calledOnce(res.json);
  });
});

describe('TuyaController POST /api/v1/service/tuya/local-scan', () => {
  let controller;

  beforeEach(() => {
    controller = TuyaController(tuyaManager);
    sinon.resetHistory();
    tuyaManager.localScan = fake.resolves({ devices: { device1: { ip: '1.1.1.1', version: '3.3' } }, portErrors: {} });
    tuyaManager.discoveredDevices = [{ external_id: 'tuya:device1', params: [] }];
  });

  afterEach(() => {
    tuyaManager.localScan = defaultLocalScan;
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

  it('should return local devices even without discovered devices', async () => {
    const req = { body: { timeoutSeconds: 1 } };
    const res = {
      json: fake.returns([]),
    };
    tuyaManager.discoveredDevices = null;

    await controller['post /api/v1/service/tuya/local-scan'].controller(req, res);
    assert.calledOnce(tuyaManager.localScan);
    assert.calledOnce(res.json);
    const payload = res.json.firstCall.args[0];
    expect(payload.devices).to.have.length(1);
    expect(payload.devices[0].external_id).to.equal('tuya:device1');
    expect(payload.local_devices).to.deep.equal({ device1: { ip: '1.1.1.1', version: '3.3' } });
    expect(payload.port_errors).to.deep.equal({});
  });

  it('should keep devices unchanged when local info is missing', async () => {
    const req = { body: { timeoutSeconds: 1 } };
    const res = {
      json: fake.returns([]),
    };
    tuyaManager.localScan = fake.resolves({ devices: {}, portErrors: {} });
    tuyaManager.discoveredDevices = [{ external_id: 'tuya:device1', params: [] }];

    await controller['post /api/v1/service/tuya/local-scan'].controller(req, res);
    assert.calledOnce(tuyaManager.localScan);
    assert.calledWith(res.json, {
      devices: [{ external_id: 'tuya:device1', params: [] }],
      local_devices: {},
      port_errors: {},
    });
  });
});

describe('TuyaController GET /api/v1/service/tuya/status', () => {
  let controller;

  beforeEach(() => {
    controller = TuyaController(tuyaManager);
    sinon.resetHistory();
  });

  it('should return status', async () => {
    const req = {};
    const res = { json: fake.returns([]) };

    await controller['get /api/v1/service/tuya/status'].controller(req, res);
    assert.calledOnce(tuyaManager.getStatus);
    assert.calledWith(res.json, { status: 'connected' });
  });
});

describe('TuyaController POST /api/v1/service/tuya/disconnect', () => {
  let controller;

  beforeEach(() => {
    controller = TuyaController(tuyaManager);
    sinon.resetHistory();
  });

  it('should disconnect', async () => {
    const req = {};
    const res = { json: fake.returns([]) };

    await controller['post /api/v1/service/tuya/disconnect'].controller(req, res);
    assert.calledOnce(tuyaManager.manualDisconnect);
    assert.calledWith(res.json, { success: true });
  });
});
