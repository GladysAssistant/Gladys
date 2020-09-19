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

describe('bluetooth.scanStop event', () => {
  let bluetooth;
  let bluetoothManager;
  let eventWS;
  let clock;
  let now;

  beforeEach(() => {
    bluetooth = new BluetoothMock();

    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;

    sinon.reset();

    eventWS = fake.returns(null);
    event.on(EVENTS.WEBSOCKET.SEND_ALL, eventWS);

    now = new Date();
    clock = sinon.useFakeTimers(now.getTime());
  });

  afterEach(() => {
    bluetooth.removeAllListeners();
    clock.restore();
    event.removeAllListeners();
  });

  it('should handle stop scanning', () => {
    bluetoothManager.ready = true;
    bluetoothManager.scanStop();

    expect(false).eq(bluetoothManager.scanning);

    assert.calledWith(eventWS, {
      payload: { peripheralLookup: false, ready: true, scanning: false },
      type: 'bluetooth.status',
    });
  });
});
