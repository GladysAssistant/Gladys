const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const EventEmitter = require('events');

const event = new EventEmitter();
const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const { EVENTS } = require('../../../../../utils/constants');

const gladys = {
  event,
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.scanStart event', () => {
  let bluetooth;
  let bluetoothManager;
  let eventWS;

  beforeEach(() => {
    bluetooth = new BluetoothMock();

    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;

    eventWS = fake.returns(null);
    event.on(EVENTS.WEBSOCKET.SEND_ALL, eventWS);
  });

  afterEach(() => {
    event.removeAllListeners();
    sinon.reset();
  });

  it('should handle start scanning', () => {
    bluetoothManager.ready = true;
    bluetoothManager.scanStart();

    expect(true).eq(bluetoothManager.scanning);

    assert.calledWith(eventWS, {
      payload: { peripheralLookup: false, ready: true, scanning: true },
      type: 'bluetooth.status',
    });
  });
});
