const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const EventEmitter = require('events');

const event = new EventEmitter();
const BluetoothManager = require('../../../../../services/bluetooth/lib');

const { EVENTS } = require('../../../../../utils/constants');

const gladys = {
  event,
  stateManager: {
    get: fake.returns(null),
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.getDiscoveredDevices command', () => {
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

  it('should get no peripherals', () => {
    const result = bluetoothManager.getDiscoveredDevices();
    expect(result).deep.eq([]);
    assert.notCalled(eventWS);
    assert.notCalled(gladys.stateManager.get);
  });

  it('should get retrieved peripherals', () => {
    bluetoothManager.discoveredDevices.P1 = {
      external_id: 'bluetooth:P1',
      features: [],
      name: 'P1',
      params: [
        {
          name: 'connectable',
          value: false,
        },
        {
          name: 'loaded',
          value: false,
        },
      ],
      selector: 'bluetooth-p1',
    };
    bluetoothManager.discoveredDevices.P2 = {
      external_id: 'bluetooth:P2',
      features: [],
      name: 'P2',
      params: [
        {
          name: 'connectable',
          value: false,
        },
        {
          name: 'loaded',
          value: false,
        },
      ],
      selector: 'bluetooth-p2',
    };
    bluetoothManager.discoveredDevices.P3 = {
      external_id: 'bluetooth:P3',
      features: [],
      name: 'P3',
      params: [
        {
          name: 'connectable',
          value: false,
        },
        {
          name: 'loaded',
          value: false,
        },
      ],
      selector: 'bluetooth-p3',
    };

    const result = bluetoothManager.getDiscoveredDevices();
    expect(result).deep.eq([
      bluetoothManager.discoveredDevices.P1,
      bluetoothManager.discoveredDevices.P2,
      bluetoothManager.discoveredDevices.P3,
    ]);
    assert.notCalled(eventWS);
    assert.callCount(gladys.stateManager.get, 3);
  });
});
