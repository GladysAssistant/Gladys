const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const { MockedMqttClient } = require('../../mocks.test');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const {
  getDeviceIdentifier,
} = require('../../../../../services/mqtt/lib/homeAssistant/handleHomeAssistantDiscoveryMessage');
const MqttHandler = require('../../../../../services/mqtt/lib');

describe('mqttHandler.handleHomeAssistantDiscoveryMessage', () => {
  let mqttHandler;
  let gladys;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    gladys = {
      event: {
        emit: fake.returns(null),
      },
      stateManager: {
        get: fake.returns(null),
      },
    };
    mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should ignore a non-config topic', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage('homeassistant/status', 'online');
    expect(mqttHandler.haDiscoveredDevices).to.deep.equal({});
  });

  it('should ignore an unsupported component', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage('homeassistant/vacuum/my-vacuum/config', '{}');
    expect(mqttHandler.haDiscoveredDevices).to.deep.equal({});
  });

  it('should ignore an invalid JSON payload', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage('homeassistant/sensor/my-sensor/config', 'not-a-json');
    expect(mqttHandler.haDiscoveredDevices).to.deep.equal({});
  });

  it('should discover a sensor and emit a debounced websocket event', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/sensor/my-node/temperature/config',
      JSON.stringify({
        name: 'Temperature',
        stat_t: 'my-node/temperature',
        dev_cla: 'temperature',
        unit_of_meas: '°C',
        dev: { ids: ['0x1234'], name: 'My device' },
      }),
    );

    expect(Object.keys(mqttHandler.haDiscoveredDevices)).to.deep.equal(['homeassistant:0x1234']);
    const discovered = mqttHandler.haDiscoveredDevices['homeassistant:0x1234'];
    expect(discovered.identifier).to.equal('0x1234');
    expect(discovered.info).to.deep.equal({ identifiers: ['0x1234'], name: 'My device' });
    expect(Object.keys(discovered.entities)).to.deep.equal(['sensor:my-node:temperature']);
    expect(mqttHandler.haEntitiesByTopic).to.have.property('homeassistant/sensor/my-node/temperature/config');

    // Websocket event is debounced
    assert.notCalled(gladys.event.emit);
    clock.tick(600);
    assert.calledOnce(gladys.event.emit);
    const { args } = gladys.event.emit.firstCall;
    expect(args[0]).to.equal(EVENTS.WEBSOCKET.SEND_ALL);
    expect(args[1].type).to.equal(WEBSOCKET_MESSAGE_TYPES.MQTT.HA_DISCOVERY_DEVICES_UPDATED);
    expect(args[1].payload).to.have.lengthOf(1);
    expect(args[1].payload[0].external_id).to.equal('homeassistant:0x1234');
  });

  it('should debounce multiple discovery messages in a single websocket event', () => {
    const message = JSON.stringify({ stat_t: 'a/topic', dev_cla: 'temperature', dev: { ids: '0x1234' } });
    mqttHandler.handleHomeAssistantDiscoveryMessage('homeassistant/sensor/sensor-1/config', message);
    mqttHandler.handleHomeAssistantDiscoveryMessage('homeassistant/sensor/sensor-2/config', message);
    clock.tick(600);
    assert.calledOnce(gladys.event.emit);
  });

  it('should group entities of the same device', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/sensor/temperature/config',
      JSON.stringify({ stat_t: 'a/temperature', dev_cla: 'temperature', dev: { ids: ['0x1234'] } }),
    );
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/binary_sensor/motion/config',
      JSON.stringify({ stat_t: 'a/motion', dev_cla: 'motion', dev: { ids: ['0x1234'] } }),
    );
    const discovered = mqttHandler.haDiscoveredDevices['homeassistant:0x1234'];
    expect(Object.keys(discovered.entities)).to.deep.equal(['sensor:temperature', 'binary_sensor:motion']);
  });

  it('should replace the entities of an already discovered topic', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/sensor/temperature/config',
      JSON.stringify({ stat_t: 'a/temperature', dev_cla: 'temperature', dev: { ids: ['0x1234'] } }),
    );
    // Same topic, but the device identifier changed: the previous device must be removed
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/sensor/temperature/config',
      JSON.stringify({ stat_t: 'a/temperature', dev_cla: 'temperature', dev: { ids: ['0x5678'] } }),
    );
    expect(Object.keys(mqttHandler.haDiscoveredDevices)).to.deep.equal(['homeassistant:0x5678']);
  });

  it('should keep the device when another topic still has entities on it', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/sensor/temperature/config',
      JSON.stringify({ stat_t: 'a/temperature', dev_cla: 'temperature', dev: { ids: ['0x1234'] } }),
    );
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/binary_sensor/motion/config',
      JSON.stringify({ stat_t: 'a/motion', dev_cla: 'motion', dev: { ids: ['0x1234'] } }),
    );
    // Update the first topic: device is kept, entity replaced
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/sensor/temperature/config',
      JSON.stringify({ stat_t: 'a/temperature2', dev_cla: 'temperature', dev: { ids: ['0x1234'] } }),
    );
    const discovered = mqttHandler.haDiscoveredDevices['homeassistant:0x1234'];
    expect(discovered.entities['sensor:temperature'].state_topic).to.equal('a/temperature2');
  });

  it('should remove an entity on empty payload, and the device when empty', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/sensor/temperature/config',
      JSON.stringify({ stat_t: 'a/temperature', dev_cla: 'temperature', dev: { ids: ['0x1234'] } }),
    );
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/binary_sensor/motion/config',
      JSON.stringify({ stat_t: 'a/motion', dev_cla: 'motion', dev: { ids: ['0x1234'] } }),
    );
    mqttHandler.handleHomeAssistantDiscoveryMessage('homeassistant/sensor/temperature/config', '');
    let discovered = mqttHandler.haDiscoveredDevices['homeassistant:0x1234'];
    expect(Object.keys(discovered.entities)).to.deep.equal(['binary_sensor:motion']);

    mqttHandler.handleHomeAssistantDiscoveryMessage('homeassistant/binary_sensor/motion/config', '');
    discovered = mqttHandler.haDiscoveredDevices['homeassistant:0x1234'];
    expect(discovered).to.equal(undefined);
  });

  it('should do nothing on empty payload for an unknown topic', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage('homeassistant/sensor/unknown/config', '');
    expect(mqttHandler.haDiscoveredDevices).to.deep.equal({});
    clock.tick(600);
    assert.notCalled(gladys.event.emit);
  });

  it('should handle the removal of a topic whose device was already removed', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/sensor/temperature/config',
      JSON.stringify({ stat_t: 'a/temperature', dev_cla: 'temperature', dev: { ids: ['0x1234'] } }),
    );
    delete mqttHandler.haDiscoveredDevices['homeassistant:0x1234'];
    mqttHandler.handleHomeAssistantDiscoveryMessage('homeassistant/sensor/temperature/config', '');
    expect(mqttHandler.haEntitiesByTopic).to.deep.equal({});
  });

  it('should handle a device-based discovery payload', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/device/my-device/config',
      JSON.stringify({
        dev: { ids: ['0x1234'], name: 'My device' },
        o: { name: 'firmware' },
        stat_t: 'my-device/state',
        cmps: {
          temperature: { p: 'sensor', dev_cla: 'temperature' },
          relay: { p: 'switch', cmd_t: 'my-device/set' },
          unsupported: { p: 'vacuum' },
        },
      }),
    );
    const discovered = mqttHandler.haDiscoveredDevices['homeassistant:0x1234'];
    expect(Object.keys(discovered.entities)).to.deep.equal(['sensor:my-device:temperature', 'switch:my-device:relay']);
    // Shared config is merged in each entity
    expect(discovered.entities['sensor:my-device:temperature'].state_topic).to.equal('my-device/state');
    expect(discovered.entities['switch:my-device:relay'].command_topic).to.equal('my-device/set');
  });

  it('should share the base topic with components in a device-based discovery', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/device/my-device/config',
      JSON.stringify({
        '~': 'base/my-device',
        dev: { ids: ['0x1234'] },
        cmps: {
          relay: { p: 'switch', cmd_t: '~/set' },
        },
      }),
    );
    const discovered = mqttHandler.haDiscoveredDevices['homeassistant:0x1234'];
    expect(discovered.entities['switch:my-device:relay'].command_topic).to.equal('base/my-device/set');
  });

  it('should not register a device-based discovery without supported components', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/device/my-device/config',
      JSON.stringify({
        dev: { ids: ['0x1234'] },
        cmps: { unsupported: { p: 'vacuum' } },
      }),
    );
    expect(mqttHandler.haDiscoveredDevices).to.deep.equal({});
    expect(mqttHandler.haEntitiesByTopic).to.deep.equal({});
  });

  it('should emit an update when a device-based discovery is replaced by an unsupported-only payload', () => {
    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/device/my-device/config',
      JSON.stringify({
        dev: { ids: ['0x1234'] },
        cmps: { relay: { p: 'switch', cmd_t: 'my-device/set' } },
      }),
    );
    clock.tick(600);
    gladys.event.emit = fake.returns(null);

    mqttHandler.handleHomeAssistantDiscoveryMessage(
      'homeassistant/device/my-device/config',
      JSON.stringify({
        dev: { ids: ['0x1234'] },
        cmps: { unsupported: { p: 'vacuum' } },
      }),
    );
    expect(mqttHandler.haDiscoveredDevices).to.deep.equal({});
    expect(mqttHandler.haEntitiesByTopic).to.deep.equal({});
    clock.tick(600);
    assert.calledOnce(gladys.event.emit);
  });

  describe('getDeviceIdentifier', () => {
    it('should use the first identifier of an array', () => {
      expect(getDeviceIdentifier({ device: { identifiers: ['0x1234', 'other'] } }, 'node', 'object')).to.equal(
        '0x1234',
      );
    });
    it('should use a string identifier', () => {
      expect(getDeviceIdentifier({ device: { identifiers: '0x1234' } }, 'node', 'object')).to.equal('0x1234');
    });
    it('should use connections when there is no identifier', () => {
      expect(getDeviceIdentifier({ device: { connections: [['mac', 'AA:BB']] } }, 'node', 'object')).to.equal(
        'mac-AA-BB',
      );
    });
    it('should fallback on node id', () => {
      expect(getDeviceIdentifier({}, 'node', 'object')).to.equal('node');
    });
    it('should fallback on object id', () => {
      expect(getDeviceIdentifier({}, undefined, 'object')).to.equal('object');
    });
    it('should sanitize special characters', () => {
      expect(getDeviceIdentifier({ device: { identifiers: 'my device/1' } }, undefined, 'object')).to.equal(
        'my-device-1',
      );
    });
    it('should fallback when identifiers is an empty array', () => {
      expect(getDeviceIdentifier({ device: { identifiers: [] } }, 'node', 'object')).to.equal('node');
    });
    it('should fallback when identifiers is an empty string', () => {
      expect(getDeviceIdentifier({ device: { identifiers: '' } }, 'node', 'object')).to.equal('node');
    });
    it('should fallback when connections are malformed', () => {
      expect(getDeviceIdentifier({ device: { connections: [null] } }, undefined, 'object')).to.equal('object');
    });
  });
});
