const sinon = require('sinon');

const { assert, fake } = sinon;
const { expect } = require('chai');

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
});
