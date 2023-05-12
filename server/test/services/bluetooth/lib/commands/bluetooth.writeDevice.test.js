const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const { BadParameters } = require('../../../../../utils/coreErrors');

const gladys = {};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.writeDevice', () => {
  let throwError;

  let characteristic2a00;
  let service;
  let peripheral;

  let bluetooth;
  let clock;

  beforeEach(() => {
    throwError = false;

    characteristic2a00 = {
      uuid: '2a00',
      properties: ['write'],
      write: (arg1, arg2, callback) => {
        if (throwError) {
          callback('error');
        } else {
          callback(null);
        }
      },
    };

    service = {
      uuid: '1800',
      discoverCharacteristics: fake.yields(null, [characteristic2a00]),
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
      discoverServices: fake.yields(null, [service]),
    };

    bluetooth = new BluetoothManager(gladys, serviceId);

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('bluetooth.writeDevice success', async () => {
    await bluetooth.writeDevice(peripheral, '1800', '2a00', [0x01]);

    assert.calledOnce(peripheral.discoverServices);
    assert.calledOnce(service.discoverCharacteristics);
  });

  it('bluetooth.writeDevice not readable (no props)', async () => {
    characteristic2a00.properties = undefined;

    try {
      await bluetooth.writeDevice(peripheral, '1800', '2a00', [0x01]);
      assert.fail('Should fail');
    } catch (e) {
      assert.calledOnce(peripheral.discoverServices);
      assert.calledOnce(service.discoverCharacteristics);

      expect(e).is.instanceOf(BadParameters);
    }
  });

  it('bluetooth.writeDevice not readable prop', async () => {
    characteristic2a00.properties = ['read'];

    try {
      await bluetooth.writeDevice(peripheral, '1800', '2a00', [0x01]);
      assert.fail('Should fail');
    } catch (e) {
      assert.calledOnce(peripheral.discoverServices);
      assert.calledOnce(service.discoverCharacteristics);

      expect(e).is.instanceOf(BadParameters);
    }
  });

  it('bluetooth.writeDevice with error', async () => {
    throwError = true;

    try {
      await bluetooth.writeDevice(peripheral, '1800', '2a00', [0x01]);
      assert.fail('Should fail');
    } catch (e) {
      assert.calledOnce(peripheral.discoverServices);
      assert.calledOnce(service.discoverCharacteristics);

      expect(e).is.instanceOf(Error);
    }
  });
});
