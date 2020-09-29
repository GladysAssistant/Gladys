const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.readDevice', () => {
  let throwError;

  let characteristic;
  let service;
  let peripheral;
  let device;

  let bluetooth;
  let bluetoothManager;

  beforeEach(() => {
    throwError = false;

    characteristic = {
      uuid: '2a00',
      properties: ['read'],
      read: (callback) => {
        if (throwError) {
          callback('error');
        } else {
          callback(null, 'd');
        }
      },
    };

    service = {
      uuid: '1800',
      discoverCharacteristics: fake.yields(null, [characteristic]),
    };

    peripheral = {
      uuid: 'uuid',
      address: 'A1',
      addressType: 'public',
      rssi: 'R1',
      advertisement: {
        localName: 'P1',
      },
      lastSeen: 'D1',
      connectable: true,
      connect: fake.yields(null),
      disconnectAsync: fake.resolves(null),
      discoverServices: fake.yields(null, [service]),
    };

    device = {
      external_id: `bluetooth:${peripheral.uuid}`,
      features: [
        {
          external_id: `bluetooth:${peripheral.uuid}:${service.uuid}:${characteristic.uuid}`,
        },
      ],
    };

    bluetooth = new BluetoothMock();
    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;

    bluetooth.startScanning = () => {
      bluetooth.emit('discover', peripheral);
      bluetooth.emit('scanStop');
    };
  });

  afterEach(() => {
    if (bluetoothManager.scanPromise && bluetoothManager.scanPromise.isPending()) {
      bluetoothManager.scanPromise.cancel();
    }

    sinon.reset();
  });

  it('bluetooth.readDevice success', async () => {
    const readValue = await bluetoothManager.readDevice(device);

    const expectedResult = [13];
    expect(readValue).deep.eq(expectedResult);

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnectAsync);
    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE,
      payload: { peripheralLookup: false, ready: false, scanning: false },
    });
  });

  it('bluetooth.readDevice error on read', async () => {
    throwError = true;

    await bluetoothManager.readDevice(device);

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnectAsync);
    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE,
      payload: { peripheralLookup: false, ready: false, scanning: false },
    });
  });

  it('bluetooth.readDevice not readable (no props)', async () => {
    characteristic.properties = undefined;

    await bluetoothManager.readDevice(device);

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnectAsync);
    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE,
      payload: { peripheralLookup: false, ready: false, scanning: false },
    });
  });

  it('bluetooth.readDevice not readable prop', async () => {
    characteristic.properties = ['write'];

    await bluetoothManager.readDevice(device);

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnectAsync);
    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.STATE,
      payload: { peripheralLookup: false, ready: false, scanning: false },
    });
  });
});
