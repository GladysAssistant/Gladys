const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const { BadParameters } = require('../../../../../utils/coreErrors');

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';
const onNotify = fake.resolves(null);

describe('bluetooth.subscribeDevice', () => {
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
      properties: ['notify', 'read'],
      subscribe: (callback) => {
        if (throwError) {
          callback('error');
        } else {
          callback(null, 'd');
        }
      },
      read: (callback) => {
        if (throwError) {
          callback('error');
        } else {
          callback(null, 'd');
        }
      },
      on: fake.returns(null),
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

  it('bluetooth.subscribeDevice success', async () => {
    await bluetoothManager.subscribeDevice(peripheral, service.uuid, characteristic.uuid, onNotify);

    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
    assert.calledOnce(characteristic.on);
    assert.calledOnce(onNotify);
  });

  it('bluetooth.subscribeDevice error on notify', async () => {
    throwError = true;

    try {
      await bluetoothManager.subscribeDevice(peripheral, service.uuid, characteristic.uuid, onNotify);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error);
    }

    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
    assert.notCalled(onNotify);
  });

  it('bluetooth.subscribeDevice not notifiable (no props)', async () => {
    characteristic.properties = undefined;

    try {
      await bluetoothManager.subscribeDevice(peripheral, service.uuid, characteristic.uuid, onNotify);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }
    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
    assert.notCalled(onNotify);
  });

  it('bluetooth.subscribeDevice not notifiable prop', async () => {
    characteristic.properties = ['write'];

    try {
      await bluetoothManager.subscribeDevice(peripheral, service.uuid, characteristic.uuid, onNotify);
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
    }

    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
    assert.notCalled(onNotify);
  });
});
