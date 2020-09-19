const sinon = require('sinon');

const { assert, fake } = sinon;
const EventEmitter = require('events');

const event = new EventEmitter();
const BluetoothManager = require('../../../../../services/bluetooth/lib');
const BluetoothMock = require('../../BluetoothMock.test');

const { EVENTS } = require('../../../../../utils/constants');

const gladys = {
  event,
  stateManager: {
    get: (arg1, externalId) => {
      if (externalId === 'bluetooth:UUID2') {
        return { id: '1234' };
      }
      return null;
    },
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.discover event', () => {
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

  it('should add discovered peripheral', () => {
    const newPeripheral = {
      uuid: 'UUID',
      address: 'ADDRESS',
      rssi: 'RSSI',
      state: 'state',
    };

    bluetoothManager.discover(newPeripheral);

    const expectedWSPeripheral = {
      external_id: 'bluetooth:UUID',
      name: 'ADDRESS',
      selector: 'bluetooth-uuid',
      features: [],
      params: [{ name: 'loaded', value: true }],
      service_id: serviceId,
    };

    assert.calledWith(eventWS, { payload: expectedWSPeripheral, type: 'bluetooth.discover' });
  });

  it('should add discovered connected peripheral (with advertisement)', () => {
    const newPeripheral = {
      uuid: 'UUID2',
      address: 'ADDRESS',
      rssi: 'RSSI',
      advertisement: {
        localName: 'NAME',
      },
      state: 'connected',
      connectable: true,
    };

    bluetoothManager.discover(newPeripheral);

    const expectedWSPeripheral = {
      id: '1234',
      external_id: 'bluetooth:UUID2',
      name: 'NAME',
      selector: 'bluetooth-uuid2',
      features: [],
      params: [],
      service_id: serviceId,
    };

    assert.calledWith(eventWS, { payload: expectedWSPeripheral, type: 'bluetooth.discover' });
  });

  it('should add discovered connected peripheral (without advertisement)', () => {
    const newPeripheral = {
      uuid: 'UUID',
      address: 'ADDRESS',
      rssi: 'RSSI',
      advertisement: {},
      state: 'connected',
      connectable: true,
    };

    bluetoothManager.discover(newPeripheral);

    const expectedWSPeripheral = {
      external_id: 'bluetooth:UUID',
      name: 'ADDRESS',
      selector: 'bluetooth-uuid',
      features: [],
      params: [],
      service_id: serviceId,
    };

    assert.calledWith(eventWS, { payload: expectedWSPeripheral, type: 'bluetooth.discover' });
  });
});
