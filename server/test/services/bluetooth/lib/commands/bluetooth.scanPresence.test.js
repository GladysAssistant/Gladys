const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const peripherals = {
  'presence-uuid': {},
};
const bluetoothScanCommandMock = fake.resolves(peripherals);
const BluetoothManager = proxyquire('../../../../../services/bluetooth/lib', {
  './commands/bluetooth.scan.js': { scan: bluetoothScanCommandMock },
});
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../../utils/constants');

const BluetoothMock = require('../../BluetoothMock.test');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  device: {
    get: fake.resolves([]),
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.scanPresence', () => {
  let bluetoothManager;
  let bluetooth;

  beforeEach(() => {
    bluetooth = new BluetoothMock();
    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('bluetooth.scanPresence no stored devices', async () => {
    await bluetoothManager.scanPresence();

    assert.calledOnce(gladys.device.get);
    assert.notCalled(bluetoothScanCommandMock);
    assert.notCalled(gladys.event.emit);
  });

  it('bluetooth.scanPresence no presence devices', async () => {
    gladys.device.get = fake.resolves([
      {
        features: [
          {
            category: DEVICE_FEATURE_CATEGORIES.BATTERY,
          },
        ],
      },
    ]);

    await bluetoothManager.scanPresence();

    assert.calledOnce(gladys.device.get);
    assert.notCalled(bluetoothScanCommandMock);
    assert.notCalled(gladys.event.emit);
  });

  it('bluetooth.scanPresence presence device not discovered', async () => {
    gladys.device.get = fake.resolves([
      {
        features: [
          {
            external_id: 'bluetooth:unknown-uuid',
            category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
          },
        ],
      },
    ]);

    await bluetoothManager.scanPresence();

    assert.calledOnce(gladys.device.get);
    assert.calledOnce(bluetoothScanCommandMock);
    assert.notCalled(gladys.event.emit);
  });

  it('bluetooth.scanPresence matching presence device', async () => {
    gladys.device.get = fake.resolves([
      {
        features: [
          {
            external_id: 'bluetooth:presence-uuid',
            category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
          },
        ],
      },
    ]);

    await bluetoothManager.scanPresence();

    assert.calledOnce(gladys.device.get);
    assert.calledOnce(bluetoothScanCommandMock);
    assert.calledOnce(gladys.event.emit);
  });
});
