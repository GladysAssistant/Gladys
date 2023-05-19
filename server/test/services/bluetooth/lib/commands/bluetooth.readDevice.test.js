const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const { BadParameters } = require('../../../../../utils/coreErrors');

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.readDevice', () => {
  let throwError;

  let characteristic;
  let service;
  let peripheral;

  let bluetooth;
  let bluetoothManager;

  let clock;

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
      discoverServices: fake.yields(null, [service]),
    };

    bluetooth = new BluetoothMock();
    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;

    bluetooth.startScanning = () => {
      bluetooth.emit('discover', peripheral);
      bluetooth.emit('scanStop');
    };

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('bluetooth.readDevice success', async () => {
    const readValue = await bluetoothManager.readDevice(peripheral, service.uuid, characteristic.uuid);

    const expectedResult = 'd';
    expect(readValue).deep.eq(expectedResult);

    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
  });

  it('bluetooth.readDevice error on read', async () => {
    throwError = true;

    try {
      await bluetoothManager.readDevice(peripheral, service.uuid, characteristic.uuid);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error);
    }

    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
  });

  it('bluetooth.readDevice not readable (no props)', async () => {
    characteristic.properties = undefined;

    try {
      await bluetoothManager.readDevice(peripheral, service.uuid, characteristic.uuid);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }
    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
  });

  it('bluetooth.readDevice not readable prop', async () => {
    characteristic.properties = ['write'];

    try {
      await bluetoothManager.readDevice(peripheral, service.uuid, characteristic.uuid);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }

    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
  });
});
