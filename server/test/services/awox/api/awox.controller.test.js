const sinon = require('sinon');

const { assert, fake } = sinon;
const AwoxController = require('../../../../services/awox/api/awox.controller');

const peripherals = [
  {
    uuid: 'UUID1',
  },
  {
    uuid: 'UUID2',
  },
];

const awoxManager = function AwoxManager() {};
awoxManager.getDiscoveredDevice = (uuid) => (uuid === 'UUID1' ? {} : undefined);
awoxManager.getDiscoveredDevices = fake.returns(peripherals);
awoxManager.setValue = fake.resolves(null);

const res = {
  json: fake.returns(null),
  status: fake.returns(null),
  end: fake.returns(null),
};

describe('GET /api/v1/service/awox/peripheral', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should get peripherals', async () => {
    const awoxController = AwoxController(awoxManager);
    const req = {};
    await awoxController['get /api/v1/service/awox/peripheral'].controller(req, res);
    assert.calledOnce(awoxManager.getDiscoveredDevices);
    assert.calledWith(res.json, peripherals);
  });

  it('should success peripheral', async () => {
    const awoxController = AwoxController(awoxManager);
    const req = { params: { uuid: 'UUID1' } };
    await awoxController['get /api/v1/service/awox/peripheral/bluetooth-:uuid'].controller(req, res);
    assert.calledWith(res.json, {});
  });

  it('should fail without peripheral', async () => {
    const awoxController = AwoxController(awoxManager);
    const req = { params: { uuid: 'uuid1' } };
    await awoxController['get /api/v1/service/awox/peripheral/bluetooth-:uuid'].controller(req, res);
    assert.calledWith(res.json, undefined);
    assert.calledWith(res.status, 404);
  });
});

describe('POST /api/v1/service/awox/peripheral/test', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should test peripheral', async () => {
    const awoxController = AwoxController(awoxManager);
    const req = { body: { device: 'd', feature: 'f', value: 1 } };
    await awoxController['post /api/v1/service/awox/peripheral/test'].controller(req, res);
    assert.calledWith(awoxManager.setValue, 'd', 'f', 1);
    assert.calledWith(res.status, 200);
    assert.calledOnce(res.end);
  });

  it('should fail test peripheral', async () => {
    awoxManager.setValue = fake.rejects(null);

    const awoxController = AwoxController(awoxManager);
    const req = { body: { device: 'd', feature: 'f', value: 1 } };
    await awoxController['post /api/v1/service/awox/peripheral/test'].controller(req, res);
    assert.calledWith(awoxManager.setValue, 'd', 'f', 1);
    assert.calledWith(res.status, 500);
    assert.calledOnce(res.end);
  });
});
