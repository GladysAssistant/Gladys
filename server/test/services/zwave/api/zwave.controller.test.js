const sinon = require('sinon');

const { assert, fake } = sinon;
const ZwaveController = require('../../../../services/zwave/api/zwave.controller');

const ZWAVE_SERVICE_ID = 'ZWAVE_SERVICE_ID';
const event = {
  emit: fake.resolves(null),
};

const gladys = {
  event,
};
const zwaveManager = function ZwaveManager() {};
zwaveManager.connected = false;
zwaveManager.scanInProgress = false;
zwaveManager.ready = false;

let zwaveController;

describe('GET /api/v1/service/zwave/status', () => {
  beforeEach(() => {
    zwaveController = ZwaveController(gladys, zwaveManager, ZWAVE_SERVICE_ID);
    sinon.reset();
  });

  it('should get status not connected', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    await zwaveController['get /api/v1/service/zwave/status'].controller(req, res);
    assert.calledWith(res.json, {
      connected: false,
      scanInProgress: false,
      ready: false,
    });
  });

  it('should get status connected', async () => {
    const req = {};
    const res = {
      json: fake.returns(null),
    };
    zwaveManager.connected = true;
    zwaveManager.ready = true;
    await zwaveController['get /api/v1/service/zwave/status'].controller(req, res);
    assert.calledWith(res.json, {
      connected: true,
      scanInProgress: false,
      ready: true,
    });
  });
});
