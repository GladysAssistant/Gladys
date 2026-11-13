const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;
const { expect } = require('chai');
const { BUTTON_PUSH } = require('../../../../utils/constants');
const { BadParameters, ServiceNotReadyError } = require('../../../../utils/coreErrors');

const Zigbee2MqttManager = require('../../../../services/zigbee2mqtt/lib');

const discoveredDevices = require('./payloads/mqtt_devices_get.json');

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const wrongFeature = {
  external_id: 'NOTzigbee2mqtt:0x00158d00045b2740:switch:binary:state',
};

const wrongTopic = {
  external_id: 'zigbee2mqtt:',
};

const wrongProperty = {
  external_id: 'zigbee2mqtt:0x00158d00045b2740:switch:binary',
};

const featureBinary = {
  external_id: 'zigbee2mqtt:0x00158d00045b2740:switch:binary:alarm',
  type: 'binary',
};

const featureColor = {
  external_id: 'zigbee2mqtt:0x00158d00045b2740:light:color:color',
  type: 'color',
};

const featureTriggerAlarm = {
  external_id: 'zigbee2mqtt:bosch-outdoor-siren:button:push:trigger_alarm',
  type: 'push',
};

const featureStopAlarm = {
  external_id: 'zigbee2mqtt:bosch-outdoor-siren:button:push:stop_alarm',
  type: 'push',
};

const featureSirenWarning = {
  external_id: 'zigbee2mqtt:heiman-indoor-siren:siren:binary:warning',
  type: 'binary',
};

const featureSirenMaxDuration = {
  external_id: 'zigbee2mqtt:heiman-indoor-siren:duration:decimal:max_duration',
  type: 'decimal',
};

describe('zigbee2mqtt setValue', () => {
  // PREPARE
  let zigbee2MqttManager;
  let mqttClient;

  beforeEach(() => {
    mqttClient = {
      publish: fake.resolves(true),
    };

    zigbee2MqttManager = new Zigbee2MqttManager(gladys, {}, serviceId);
    zigbee2MqttManager.mqttClient = mqttClient;
    discoveredDevices
      .filter((d) => d.supported)
      .forEach((device) => {
        zigbee2MqttManager.discoveredDevices[device.friendly_name] = device;
      });
  });

  afterEach(() => {
    sinon.reset();
  });

  it('set value not device zigbee', async () => {
    // EXECUTE
    try {
      await zigbee2MqttManager.setValue(null, wrongFeature, null);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal(
        `Zigbee2mqtt device external_id is invalid: "${wrongFeature.external_id}" should starts with "zigbee2mqtt:"`,
      );
    }
  });

  it('set value on a device whose name contains "/"', async () => {
    // PREPARE
    zigbee2MqttManager.discoveredDevices['salon/lampe'] = {
      friendly_name: 'salon/lampe',
      definition: {
        exposes: [
          {
            type: 'light',
            features: [{ type: 'binary', name: 'state', property: 'state', value_on: 'ON', value_off: 'OFF' }],
          },
        ],
      },
    };
    // EXECUTE
    await zigbee2MqttManager.setValue(
      { external_id: 'zigbee2mqtt:salon/lampe' },
      { external_id: 'zigbee2mqtt:salon/lampe:light:binary:state', type: 'binary' },
      0,
    );
    // ASSERT
    assert.calledOnceWithExactly(mqttClient.publish, 'zigbee2mqtt/salon/lampe/set', '{"state":"OFF"}');
  });

  it('set value bad topic', async () => {
    // EXECUTE
    try {
      await zigbee2MqttManager.setValue(null, wrongTopic, null);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal(
        `Zigbee2mqtt device external_id is invalid: "${wrongTopic.external_id}" have no MQTT topic`,
      );
    }
  });

  it('set value bad property', async () => {
    // EXECUTE
    try {
      await zigbee2MqttManager.setValue(null, wrongProperty, null);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal(
        `Zigbee2mqtt device external_id is invalid: "${wrongProperty.external_id}" have no Zigbee property`,
      );
    }
  });

  it('set value expose not found', async () => {
    // EXECUTE
    try {
      await zigbee2MqttManager.setValue(null, featureColor, 255);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal(
        `Zigbee2mqtt expose not found: "zigbee2mqtt:0x00158d00045b2740:light:color:color" with property "color"`,
      );
    }
  });

  it('set value while the device list has not been received from Zigbee2mqtt', async () => {
    // PREPARE
    zigbee2MqttManager.discoveredDevices = {};
    zigbee2MqttManager.lastBridgeDevices = null;
    // EXECUTE
    try {
      await zigbee2MqttManager.setValue(null, featureBinary, 1);
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotReadyError);
      expect(e.message).to.equal(
        `Zigbee2mqtt is not ready yet, so "0x00158d00045b2740" cannot be controlled: Gladys has not received the list of devices from Zigbee2mqtt. ` +
          `Gladys may still be starting its integrations, or it is not connected to Zigbee2mqtt (see the status in the Zigbee2mqtt integration).`,
      );
    }
    assert.notCalled(mqttClient.publish);
  });

  it('set value on a device missing from the device list sent by Zigbee2mqtt', async () => {
    // PREPARE
    zigbee2MqttManager.lastBridgeDevices = discoveredDevices;
    // EXECUTE
    try {
      await zigbee2MqttManager.setValue(
        null,
        { external_id: 'zigbee2mqtt:Lumière couloir:switch:binary:state', type: 'binary' },
        1,
      );
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal(
        `Zigbee2mqtt device "Lumière couloir" is not in the list of devices sent by Zigbee2mqtt: it may have been removed from Zigbee2mqtt, or renamed there.`,
      );
    }
    assert.notCalled(mqttClient.publish);
  });

  it('set value good topic ON', async () => {
    // EXECUTE
    await zigbee2MqttManager.setValue(null, featureBinary, 1);
    assert.calledOnceWithExactly(
      mqttClient.publish,
      `zigbee2mqtt/0x00158d00045b2740/set`,
      JSON.stringify({ alarm: true }),
    );
  });

  it('set value good topic OFF', async () => {
    // EXECUTE
    await zigbee2MqttManager.setValue(null, featureBinary, 0);
    assert.calledOnceWithExactly(
      mqttClient.publish,
      `zigbee2mqtt/0x00158d00045b2740/set`,
      JSON.stringify({ alarm: false }),
    );
  });

  it('set Bosch siren trigger_alarm', async () => {
    await zigbee2MqttManager.setValue(null, featureTriggerAlarm, BUTTON_PUSH.PRESSED);
    assert.calledOnceWithExactly(
      mqttClient.publish,
      'zigbee2mqtt/bosch-outdoor-siren/set',
      JSON.stringify({ trigger_alarm: 'trigger' }),
    );
  });

  it('set Bosch siren stop_alarm', async () => {
    await zigbee2MqttManager.setValue(null, featureStopAlarm, BUTTON_PUSH.PRESSED);
    assert.calledOnceWithExactly(
      mqttClient.publish,
      'zigbee2mqtt/bosch-outdoor-siren/set',
      JSON.stringify({ stop_alarm: 'stop' }),
    );
  });

  it('start Heiman siren warning', async () => {
    await zigbee2MqttManager.setValue(null, featureSirenWarning, 1);
    assert.calledOnceWithExactly(
      mqttClient.publish,
      'zigbee2mqtt/heiman-indoor-siren/set',
      JSON.stringify({ warning: { mode: 'emergency', strobe: true, duration: 600 } }),
    );
  });

  it('stop Heiman siren warning', async () => {
    await zigbee2MqttManager.setValue(null, featureSirenWarning, 0);
    assert.calledOnceWithExactly(
      mqttClient.publish,
      'zigbee2mqtt/heiman-indoor-siren/set',
      JSON.stringify({ warning: { mode: 'stop', strobe: false, duration: 0 } }),
    );
  });

  it('set Heiman siren max_duration', async () => {
    await zigbee2MqttManager.setValue(null, featureSirenMaxDuration, 120);
    assert.calledOnceWithExactly(
      mqttClient.publish,
      'zigbee2mqtt/heiman-indoor-siren/set',
      JSON.stringify({ max_duration: 120 }),
    );
  });
});
