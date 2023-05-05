const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BluetoothManager = require('../../../../../services/bluetooth/lib');
const {
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../../utils/constants');

const BluetoothMock = require('../../BluetoothMock.test');

const { PARAMS } = require('../../../../../services/bluetooth/lib/utils/bluetooth.constants');
const { INFORMATION_SERVICES } = require('../../../../../services/bluetooth/lib/device/bluetooth.information');

const expectedCount = Object.keys(INFORMATION_SERVICES).reduce((acc, cur) => {
  return acc + Object.keys(INFORMATION_SERVICES[cur]).length;
}, 0);

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'de051f90-f34a-4fd5-be2e-e502339ec9bc';

describe('bluetooth.scanDevice', () => {
  let services;
  let peripheral;
  let device;

  let bluetoothManager;
  let bluetooth;

  let clock;

  beforeEach(() => {
    services = [];

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
      disconnect: fake.resolves(null),
      discoverServices: fake.yields(null, services),
    };

    device = {
      external_id: 'bluetooth:uuid',
    };

    bluetooth = new BluetoothMock();
    bluetoothManager = new BluetoothManager(gladys, serviceId);
    bluetoothManager.bluetooth = bluetooth;
    bluetoothManager.discoveredDevices[peripheral.uuid] = device;
    bluetoothManager.ready = true;

    bluetooth.startScanning = () => {
      bluetooth.emit('discover', peripheral);
    };
    bluetooth.stopScanning = () => {
      bluetooth.emit('scanStop');
    };

    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('bluetooth.scanDevice error on services', async () => {
    const service = {
      uuid: '1800',
      discoverCharacteristics: fake.yields('error'),
    };
    services.push(service);

    await bluetoothManager.scanDevice(peripheral.uuid);

    expect(device).deep.eq({
      external_id: 'bluetooth:uuid',
      params: [
        {
          name: PARAMS.LOADED,
          value: true,
        },
      ],
    });

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnect);
    assert.callCount(peripheral.discoverServices, expectedCount);
    assert.callCount(gladys.event.emit, 3);

    assert.calledOnce(service.discoverCharacteristics);

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
      payload: device,
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
      payload: device,
    });
  });

  it('bluetooth.scanDevice error on characteristics', async () => {
    const service = {
      uuid: '1800',
      discoverCharacteristics: fake.yields(null, []),
    };
    services.push(service);

    await bluetoothManager.scanDevice(peripheral.uuid);

    expect(device).deep.eq({
      external_id: 'bluetooth:uuid',
      params: [
        {
          name: PARAMS.LOADED,
          value: true,
        },
      ],
    });

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnect);
    assert.callCount(peripheral.discoverServices, expectedCount);

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
      payload: device,
    });

    assert.calledOnce(service.discoverCharacteristics);
  });

  it('bluetooth.scanDevice success on service 1800 and characteristic 2a00', async () => {
    const characterisctic = {
      uuid: '2a00',
      properties: ['read'],
      read: fake.yields(null, 'value'),
    };
    const service = {
      uuid: '1800',
      discoverCharacteristics: fake.yields(null, [characterisctic]),
    };
    services.push(service);

    await bluetoothManager.scanDevice(peripheral.uuid);

    expect(device).deep.eq({
      external_id: 'bluetooth:uuid',
      name: 'value',
      params: [
        {
          name: PARAMS.LOADED,
          value: true,
        },
      ],
    });

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnect);
    assert.callCount(peripheral.discoverServices, expectedCount);

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
      payload: device,
    });

    assert.callCount(service.discoverCharacteristics, Object.keys(INFORMATION_SERVICES[service.uuid]).length);
    assert.calledOnce(characterisctic.read);
  });

  it('bluetooth.scanDevice success on service 180a and characteristic 2a29', async () => {
    const characterisctic = {
      uuid: '2a29',
      properties: ['read'],
      read: fake.yields(null, 'value'),
    };
    const service = {
      uuid: '180a',
      discoverCharacteristics: fake.yields(null, [characterisctic]),
    };
    services.push(service);

    await bluetoothManager.scanDevice(peripheral.uuid);

    expect(device).deep.eq({
      external_id: 'bluetooth:uuid',
      params: [
        {
          name: PARAMS.LOADED,
          value: true,
        },
        {
          name: PARAMS.MANUFACTURER,
          value: 'value',
        },
      ],
    });

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnect);
    assert.callCount(peripheral.discoverServices, expectedCount);

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
      payload: device,
    });

    assert.callCount(service.discoverCharacteristics, Object.keys(INFORMATION_SERVICES[service.uuid]).length);
    assert.calledOnce(characterisctic.read);
  });

  it('bluetooth.scanDevice success on service 180a and characteristic 2a24', async () => {
    const characterisctic = {
      uuid: '2a24',
      properties: ['read'],
      read: fake.yields(null, 'value'),
    };
    const service = {
      uuid: '180a',
      discoverCharacteristics: fake.yields(null, [characterisctic]),
    };
    services.push(service);

    await bluetoothManager.scanDevice(peripheral.uuid);

    expect(device).deep.eq({
      external_id: 'bluetooth:uuid',
      model: 'value',
      params: [
        {
          name: PARAMS.LOADED,
          value: true,
        },
      ],
    });

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnect);
    assert.callCount(peripheral.discoverServices, expectedCount);

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
      payload: device,
    });

    assert.callCount(service.discoverCharacteristics, Object.keys(INFORMATION_SERVICES[service.uuid]).length);
    assert.calledOnce(characterisctic.read);
  });

  it('bluetooth.scanDevice success on service 180f and characteristic 2a19', async () => {
    const characterisctic = {
      uuid: '2a19',
      properties: ['read'],
    };
    const service = {
      uuid: '180f',
      discoverCharacteristics: fake.yields(null, [characterisctic]),
    };
    services.push(service);

    await bluetoothManager.scanDevice(peripheral.uuid);

    expect(device).deep.eq({
      external_id: 'bluetooth:uuid',
      features: [
        {
          name: 'Battery',
          category: DEVICE_FEATURE_CATEGORIES.BATTERY,
          type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 100,
          external_id: 'bluetooth:uuid:180f:2a19',
          selector: 'bluetooth-uuid-180f-2a19',
        },
      ],
      should_poll: true,
      poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
      params: [
        {
          name: PARAMS.LOADED,
          value: true,
        },
      ],
    });

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnect);
    assert.callCount(peripheral.discoverServices, expectedCount);

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
      payload: device,
    });

    assert.callCount(service.discoverCharacteristics, Object.keys(INFORMATION_SERVICES[service.uuid]).length);
  });

  it('bluetooth.scanDevice success on service 1809 and characteristic 2a6e', async () => {
    const characterisctic = {
      uuid: '2a6e',
      notify: true,
    };
    const service = {
      uuid: '1809',
      discoverCharacteristics: fake.yields(null, [characterisctic]),
    };
    services.push(service);

    await bluetoothManager.scanDevice(peripheral.uuid);

    expect(device).deep.eq({
      external_id: 'bluetooth:uuid',
      features: [
        {
          name: 'Temperature',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: -100,
          max: 250,
          external_id: 'bluetooth:uuid:1809:2a6e',
          selector: 'bluetooth-uuid-1809-2a6e',
        },
      ],
      params: [
        {
          name: PARAMS.LOADED,
          value: true,
        },
      ],
    });

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnect);
    assert.callCount(peripheral.discoverServices, expectedCount);

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
      payload: device,
    });

    assert.callCount(service.discoverCharacteristics, Object.keys(INFORMATION_SERVICES[service.uuid]).length);
  });

  it('bluetooth.scanDevice success on service 1809 and characteristic 2a1f', async () => {
    const characterisctic = {
      uuid: '2a1f',
      notify: true,
    };
    const service = {
      uuid: '1809',
      discoverCharacteristics: fake.yields(null, [characterisctic]),
    };
    services.push(service);

    await bluetoothManager.scanDevice(peripheral.uuid);

    expect(device).deep.eq({
      external_id: 'bluetooth:uuid',
      features: [
        {
          name: 'Temperature',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: -100,
          max: 250,
          external_id: 'bluetooth:uuid:1809:2a1f',
          selector: 'bluetooth-uuid-1809-2a1f',
        },
      ],
      params: [
        {
          name: PARAMS.LOADED,
          value: true,
        },
      ],
    });

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnect);
    assert.callCount(peripheral.discoverServices, expectedCount);

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
      payload: device,
    });

    assert.callCount(service.discoverCharacteristics, Object.keys(INFORMATION_SERVICES[service.uuid]).length);
  });

  it('bluetooth.scanDevice success on service 1809 and characteristic 2a20', async () => {
    const characterisctic = {
      uuid: '2a20',
      notify: true,
    };
    const service = {
      uuid: '1809',
      discoverCharacteristics: fake.yields(null, [characterisctic]),
    };
    services.push(service);

    await bluetoothManager.scanDevice(peripheral.uuid);

    expect(device).deep.eq({
      external_id: 'bluetooth:uuid',
      features: [
        {
          name: 'Temperature',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: -200,
          max: 500,
          external_id: 'bluetooth:uuid:1809:2a20',
          selector: 'bluetooth-uuid-1809-2a20',
        },
      ],
      params: [
        {
          name: PARAMS.LOADED,
          value: true,
        },
      ],
    });

    assert.calledOnce(peripheral.connect);
    assert.calledOnce(peripheral.disconnect);
    assert.callCount(peripheral.discoverServices, expectedCount);

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
      payload: device,
    });

    assert.callCount(service.discoverCharacteristics, Object.keys(INFORMATION_SERVICES[service.uuid]).length);
  });

  it('bluetooth.scanDevice with error (on connect)', async () => {
    peripheral.connect = fake.yields(new Error('error'));

    await bluetoothManager.scanDevice(peripheral.uuid);

    assert.calledOnce(peripheral.connect);
    assert.notCalled(peripheral.discoverServices);
  });
});
