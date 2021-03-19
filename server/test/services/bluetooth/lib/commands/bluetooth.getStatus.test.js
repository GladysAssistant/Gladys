const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const EventEmitter = require('events');

const event = new EventEmitter();
const BluetoothManager = require('../../../../../services/bluetooth/lib');

const { EVENTS } = require('../../../../../utils/constants');

const gladys = {
  event,
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.getStatus command', () => {
  let bluetoothManager;
  let eventWS;

  beforeEach(() => {
    bluetoothManager = new BluetoothManager(gladys, serviceId);

    eventWS = fake.returns(null);
    event.on(EVENTS.WEBSOCKET.SEND_ALL, eventWS);
  });

  afterEach(() => {
    event.removeAllListeners();
    sinon.reset();
  });

  it('should get status not setted', () => {
    const result = bluetoothManager.getStatus();
    expect(result).deep.eq({ ready: false, scanning: false, peripheralLookup: false });
    assert.notCalled(eventWS);
  });

  it('should get status ready and scanning', () => {
    bluetoothManager.bluetooth = 'any';
    bluetoothManager.ready = true;
    bluetoothManager.scanning = true;
    const result = bluetoothManager.getStatus();
    expect(result).deep.eq({ ready: true, scanning: true, peripheralLookup: false });
    assert.notCalled(eventWS);
  });

  it('should get status ready not scanning', () => {
    bluetoothManager.bluetooth = 'any';
    bluetoothManager.ready = true;
    bluetoothManager.scanning = false;
    const result = bluetoothManager.getStatus();
    expect(result).deep.eq({ ready: true, scanning: false, peripheralLookup: false });
    assert.notCalled(eventWS);
  });

  it('should get status not ready (no bluetooth instance)', () => {
    bluetoothManager.ready = true;
    bluetoothManager.scanning = false;
    const result = bluetoothManager.getStatus();
    expect(result).deep.eq({ ready: false, scanning: false, peripheralLookup: false });
    assert.notCalled(eventWS);
  });

  it('should get status not ready not scanning', () => {
    bluetoothManager.ready = false;
    bluetoothManager.scanning = false;
    const result = bluetoothManager.getStatus();
    expect(result).deep.eq({ ready: false, scanning: false, peripheralLookup: false });
    assert.notCalled(eventWS);
  });

  it('should get status not ready but scanning', () => {
    bluetoothManager.ready = false;
    bluetoothManager.scanning = true;
    const result = bluetoothManager.getStatus();
    expect(result).deep.eq({ ready: false, scanning: true, peripheralLookup: false });
    assert.notCalled(eventWS);
  });
});
