const sinon = require('sinon');

const { assert, fake } = sinon;
const BluetoothController = require('../../../../services/bluetooth/api/bluetooth.controller');

const status = 'ready';
const peripherals = [
  {
    uuid: 'UUID1',
  },
  {
    uuid: 'UUID2',
  },
];

const config = { config: true };

const bluetoothManager = function bluetoothManager() {};

bluetoothManager.getStatus = fake.returns(status);
bluetoothManager.getDiscoveredDevices = fake.returns(peripherals);
bluetoothManager.scan = fake.returns(null);
bluetoothManager.scanDevice = fake.resolves(null);
bluetoothManager.scanPresence = fake.resolves(null);
bluetoothManager.getConfiguration = fake.returns(config);
bluetoothManager.saveConfiguration = fake.resolves(config);

const res = {
  json: fake.returns(null),
  status: fake.returns(null),
};

describe('GET /api/v1/service/bluetooth/status', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should get status', async () => {
    const bluetoothController = BluetoothController(bluetoothManager);
    const req = {};
    await bluetoothController['get /api/v1/service/bluetooth/status'].controller(req, res);
    assert.calledOnce(bluetoothManager.getStatus);
    assert.calledWith(res.json, status);
  });
});

describe('GET /api/v1/service/bluetooth/peripheral', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should get peripherals', async () => {
    const bluetoothController = BluetoothController(bluetoothManager);
    const req = {};
    await bluetoothController['get /api/v1/service/bluetooth/peripheral'].controller(req, res);
    assert.calledOnce(bluetoothManager.getDiscoveredDevices);
    assert.calledWith(res.json, peripherals);
  });

  it('should fail with peripheral', async () => {
    const bluetoothController = BluetoothController(bluetoothManager);
    const device = {};
    bluetoothManager.getDiscoveredDevice = fake.returns(device);

    const req = { params: { uuid: 'uuid1' } };
    await bluetoothController['get /api/v1/service/bluetooth/peripheral/bluetooth-:uuid'].controller(req, res);
    assert.calledOnce(bluetoothManager.getDiscoveredDevice);
    assert.calledWith(res.json, device);
    assert.notCalled(res.status);
  });

  it('should fail without peripheral', async () => {
    const bluetoothController = BluetoothController(bluetoothManager);
    bluetoothManager.getDiscoveredDevice = fake.returns(undefined);

    const req = { params: { uuid: 'uuid1' } };
    await bluetoothController['get /api/v1/service/bluetooth/peripheral/bluetooth-:uuid'].controller(req, res);
    assert.calledOnce(bluetoothManager.getDiscoveredDevice);
    assert.calledWith(res.json, undefined);
    assert.calledWith(res.status, 404);
  });
});

describe('POST /api/v1/service/bluetooth/scan', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should start scan', async () => {
    const bluetoothController = BluetoothController(bluetoothManager);
    const req = { body: { scan: 'on' } };
    await bluetoothController['post /api/v1/service/bluetooth/scan'].controller(req, res);
    assert.calledWith(bluetoothManager.scan, true);
    assert.calledOnce(bluetoothManager.getStatus);
    assert.calledWith(res.json, status);
  });

  it('should start scan', async () => {
    const bluetoothController = BluetoothController(bluetoothManager);
    const req = { body: { scan: 'anything else' } };
    await bluetoothController['post /api/v1/service/bluetooth/scan'].controller(req, res);
    assert.calledWith(bluetoothManager.scan, false);
    assert.calledOnce(bluetoothManager.getStatus);
    assert.calledWith(res.json, status);
  });
});

describe('POST /api/v1/service/bluetooth/scan/bluetooth-:uuid', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should start scan', async () => {
    const bluetoothController = BluetoothController(bluetoothManager);
    const req = { params: { uuid: 'uuid' } };
    await bluetoothController['post /api/v1/service/bluetooth/scan/bluetooth-:uuid'].controller(req, res);
    assert.calledWith(bluetoothManager.scanDevice, 'uuid');
    assert.calledOnce(bluetoothManager.getStatus);
    assert.calledWith(res.json, status);
  });
});

describe('POST /api/v1/service/bluetooth/presence', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should start presence scanner', async () => {
    const bluetoothController = BluetoothController(bluetoothManager);
    const req = {};
    await bluetoothController['post /api/v1/service/bluetooth/presence'].controller(req, res);
    assert.calledOnce(bluetoothManager.scanPresence);
    assert.calledWith(res.status, 200);
  });
});

describe('GET /api/v1/service/bluetooth/config', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should get config', async () => {
    const bluetoothController = BluetoothController(bluetoothManager);
    const req = {};
    await bluetoothController['get /api/v1/service/bluetooth/config'].controller(req, res);
    assert.calledOnce(bluetoothManager.getConfiguration);
    assert.calledWith(res.json, config);
  });
});

describe('POST /api/v1/service/bluetooth/config', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should save config', async () => {
    const bluetoothController = BluetoothController(bluetoothManager);
    const body = {};
    const req = { body };
    await bluetoothController['post /api/v1/service/bluetooth/config'].controller(req, res);
    assert.calledWith(bluetoothManager.saveConfiguration, body);
    assert.calledWith(res.json, config);
  });
});
