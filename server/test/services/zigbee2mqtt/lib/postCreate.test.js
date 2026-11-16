const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const { EVENTS } = require('../../../../utils/constants');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt postCreate', () => {
  let zigbee2mqttManager;
  let gladys;

  // A plug: a router, whose state and power Zigbee2mqtt can read (access 7 and 5), but not its link quality (access 1)
  const plug = {
    friendly_name: 'salon/prise',
    ieee_address: '0x00124b0023a1b2c3',
    type: 'Router',
    definition: {
      exposes: [
        {
          type: 'switch',
          features: [{ type: 'binary', name: 'state', property: 'state', value_on: 'ON', value_off: 'OFF', access: 7 }],
        },
        { type: 'numeric', name: 'power', property: 'power', unit: 'W', access: 5 },
        { type: 'numeric', name: 'linkquality', property: 'linkquality', unit: 'lqi', access: 1 },
      ],
    },
  };
  const plugDevice = {
    external_id: 'zigbee2mqtt:salon/prise',
    features: [
      { external_id: 'zigbee2mqtt:salon/prise:switch:binary:state', type: 'binary' },
      { external_id: 'zigbee2mqtt:salon/prise:switch:power:power', type: 'power' },
      // Derived by Gladys, not a Zigbee2mqtt property
      { external_id: 'zigbee2mqtt:salon/prise:switch:power:power_consumption', type: 'energy' },
      { external_id: 'zigbee2mqtt:salon/prise:switch:integer:linkquality', type: 'integer' },
      // Without Zigbee2mqtt property
      { external_id: 'zigbee2mqtt:salon/prise', type: 'unknown' },
    ],
  };

  // A temperature sensor: a sleeping battery device
  const sensor = {
    friendly_name: 'chambre/sonde',
    ieee_address: '0x00158d00033e88d5',
    type: 'EndDevice',
    power_source: 'Battery',
    definition: {
      exposes: [{ type: 'numeric', name: 'temperature', property: 'temperature', unit: '°C', access: 5 }],
    },
  };
  const sensorDevice = {
    external_id: 'zigbee2mqtt:chambre/sonde',
    features: [{ external_id: 'zigbee2mqtt:chambre/sonde:temperature-sensor:decimal:temperature', type: 'decimal' }],
  };

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => func,
      },
      event: {
        emit: fake.returns(null),
      },
    };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.mqttClient = {
      publish: fake.returns(null),
    };
    zigbee2mqttManager.discoveredDevices['salon/prise'] = plug;
    zigbee2mqttManager.discoveredDevices['chambre/sonde'] = sensor;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should save the last values received from the device, at the date they were received', () => {
    // PREPARE
    zigbee2mqttManager.lastReceivedStates[sensor.ieee_address] = {
      temperature: { value: 19.5, receivedAt: '2026-11-15T09:00:00.000Z' },
      battery: { value: 80, receivedAt: '2026-11-15T08:00:00.000Z' },
    };
    // EXECUTE
    zigbee2mqttManager.postCreate(sensorDevice);
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zigbee2mqtt:chambre/sonde:temperature-sensor:decimal:temperature',
      state: 19.5,
      created_at: '2026-11-15T09:00:00.000Z',
    });
  });

  it('should forget the last values once saved, as the next ones are saved as they come', () => {
    // PREPARE
    zigbee2mqttManager.lastReceivedStates[sensor.ieee_address] = {
      temperature: { value: 19.5, receivedAt: '2026-11-15T09:00:00.000Z' },
    };
    // EXECUTE
    zigbee2mqttManager.postCreate(sensorDevice);
    // ASSERT
    expect(zigbee2mqttManager.lastReceivedStates).to.deep.equal({});
  });

  it('should not ask a battery device for its values, as it sleeps and would not answer', () => {
    // EXECUTE
    zigbee2mqttManager.postCreate(sensorDevice);
    // ASSERT
    assert.notCalled(gladys.event.emit);
    assert.notCalled(zigbee2mqttManager.mqttClient.publish);
  });

  it('should ask a router to read the values Zigbee2mqtt can read', () => {
    // EXECUTE
    zigbee2mqttManager.postCreate(plugDevice);
    // ASSERT
    assert.calledOnce(zigbee2mqttManager.mqttClient.publish);
    assert.calledWith(
      zigbee2mqttManager.mqttClient.publish,
      'zigbee2mqtt/salon/prise/get',
      JSON.stringify({ state: '', power: '' }),
    );
  });

  it('should save the last values of a router, then ask it for its current ones', () => {
    // PREPARE
    zigbee2mqttManager.lastReceivedStates[plug.ieee_address] = {
      state: { value: 'ON', receivedAt: '2026-11-15T09:00:00.000Z' },
    };
    // EXECUTE
    zigbee2mqttManager.postCreate(plugDevice);
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zigbee2mqtt:salon/prise:switch:binary:state',
      state: 1,
      created_at: '2026-11-15T09:00:00.000Z',
    });
    assert.calledOnce(zigbee2mqttManager.mqttClient.publish);
  });

  it('should ask a device on mains that is not a router, as it always listens', () => {
    // PREPARE: a switch without neutral wire joins as an end device
    zigbee2mqttManager.discoveredDevices['salon/prise'] = {
      ...plug,
      type: 'EndDevice',
      power_source: 'Mains (single phase)',
    };
    // EXECUTE
    zigbee2mqttManager.postCreate(plugDevice);
    // ASSERT
    assert.calledOnce(zigbee2mqttManager.mqttClient.publish);
  });

  [
    ['an unknown power source', 'Unknown'],
    ['no power source', undefined],
    ['a null power source', null],
  ].forEach(([label, powerSource]) => {
    it(`should not ask an end device with ${label}, as it may sleep`, () => {
      // PREPARE
      zigbee2mqttManager.discoveredDevices['salon/prise'] = { ...plug, type: 'EndDevice', power_source: powerSource };
      // EXECUTE
      zigbee2mqttManager.postCreate(plugDevice);
      // ASSERT
      assert.notCalled(zigbee2mqttManager.mqttClient.publish);
    });
  });

  it('should save the last values but ask nothing without broker', () => {
    // PREPARE
    zigbee2mqttManager.mqttClient = null;
    zigbee2mqttManager.lastReceivedStates[plug.ieee_address] = {
      state: { value: 'ON', receivedAt: '2026-11-15T09:00:00.000Z' },
    };
    // EXECUTE
    zigbee2mqttManager.postCreate(plugDevice);
    // ASSERT
    assert.calledOnce(gladys.event.emit);
  });

  it('should not ask a router without value Zigbee2mqtt can read', () => {
    // PREPARE
    const device = {
      external_id: 'zigbee2mqtt:salon/prise',
      features: [{ external_id: 'zigbee2mqtt:salon/prise:switch:integer:linkquality', type: 'integer' }],
    };
    // EXECUTE
    zigbee2mqttManager.postCreate(device);
    // ASSERT
    assert.notCalled(zigbee2mqttManager.mqttClient.publish);
  });

  it('should not replay the values of the device that had the name before', () => {
    // PREPARE: the values of another device, removed from the network, whose name was given to this one
    zigbee2mqttManager.lastReceivedStates['0x00158d0004019127'] = {
      temperature: { value: 30, receivedAt: '2026-11-15T09:00:00.000Z' },
    };
    // EXECUTE
    zigbee2mqttManager.postCreate(sensorDevice);
    // ASSERT
    assert.notCalled(gladys.event.emit);
  });

  it('should do nothing for a device unknown by Zigbee2mqtt', () => {
    // EXECUTE
    zigbee2mqttManager.postCreate({ external_id: 'zigbee2mqtt:inconnu', features: [] });
    // ASSERT
    assert.notCalled(gladys.event.emit);
    assert.notCalled(zigbee2mqttManager.mqttClient.publish);
  });
});
