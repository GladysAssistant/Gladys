const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;
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

describe('bluetooth.getDiscoveredDevice command', () => {
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

  it('get peripheral by uuid', () => {
    bluetoothManager.discoveredDevices.uuid = {
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
          value: true,
        },
      ],
      selector: 'bluetooth-p1',
    };

    const result = bluetoothManager.getDiscoveredDevice('uuid');
    expect(result).deep.eq(bluetoothManager.discoveredDevices.uuid);
    assert.calledOnce(gladys.stateManager.get);
  });

  it('get not existing peripheral by uuid', () => {
    const result = bluetoothManager.getDiscoveredDevice('uuid');
    expect(result).eq(null);
    assert.notCalled(gladys.stateManager.get);
  });
});
