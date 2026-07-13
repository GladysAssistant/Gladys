const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;
const { MockedMqttClient } = require('../../mocks.test');
const { getStateTopic } = require('../../../../../services/mqtt/lib/homeAssistant/listenToHomeAssistantDevice');
const MqttHandler = require('../../../../../services/mqtt/lib');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.listenToHomeAssistantDeviceStateIfNeeded', () => {
  let mqttHandler;

  beforeEach(() => {
    mqttHandler = new MqttHandler({}, MockedMqttClient, SERVICE_ID);
    mqttHandler.subscribe = fake.returns(null);
    mqttHandler.unsubscribe = fake.returns(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should ignore devices without external id', () => {
    mqttHandler.listenToHomeAssistantDeviceStateIfNeeded({});
    expect(mqttHandler.haStateBindings).to.deep.equal({});
  });

  it('should ignore non Home Assistant devices', () => {
    mqttHandler.listenToHomeAssistantDeviceStateIfNeeded({ external_id: 'mqtt:my-device' });
    expect(mqttHandler.haStateBindings).to.deep.equal({});
  });

  it('should handle a Home Assistant device without params', () => {
    mqttHandler.listenToHomeAssistantDeviceStateIfNeeded({ external_id: 'homeassistant:my-device' });
    expect(mqttHandler.haStateBindings).to.deep.equal({});
  });

  it('should warn on invalid entity configuration', () => {
    mqttHandler.listenToHomeAssistantDeviceStateIfNeeded({
      external_id: 'homeassistant:my-device',
      selector: 'my-device',
      params: [{ name: 'ha_discovery_config:sensor:temperature', value: 'not-a-json' }],
      features: [],
    });
    expect(mqttHandler.haStateBindings).to.deep.equal({});
  });

  it('should listen to the state topic of a sensor', () => {
    const device = {
      external_id: 'homeassistant:my-device',
      params: [
        {
          name: 'ha_discovery_config:sensor:temperature',
          value: JSON.stringify({ state_topic: 'my-device/temperature', device_class: 'temperature' }),
        },
        { name: 'another_param', value: 'value' },
      ],
      features: [{ external_id: 'homeassistant:my-device:sensor:temperature' }],
    };
    mqttHandler.listenToHomeAssistantDeviceStateIfNeeded(device);
    expect(Object.keys(mqttHandler.haStateBindings)).to.deep.equal(['my-device/temperature']);
    expect(mqttHandler.haStateBindings['my-device/temperature']).to.have.lengthOf(1);
    expect(mqttHandler.haStateBindings['my-device/temperature'][0]).to.deep.include({
      deviceExternalId: 'homeassistant:my-device',
      featureExternalId: 'homeassistant:my-device:sensor:temperature',
      component: 'sensor',
      property: 'state',
    });
    sinon.assert.calledWith(mqttHandler.subscribe, 'my-device/temperature');

    // Called twice: bindings are rebuilt, subscribe is called once per topic
    mqttHandler.listenToHomeAssistantDeviceStateIfNeeded(device);
    expect(mqttHandler.haStateBindings['my-device/temperature']).to.have.lengthOf(1);
  });

  it('should not listen for features not created in Gladys', () => {
    mqttHandler.listenToHomeAssistantDeviceStateIfNeeded({
      external_id: 'homeassistant:my-device',
      params: [
        {
          name: 'ha_discovery_config:sensor:temperature',
          value: JSON.stringify({ state_topic: 'my-device/temperature', device_class: 'temperature' }),
        },
      ],
      features: [],
    });
    expect(mqttHandler.haStateBindings).to.deep.equal({});
  });

  it('should not listen when there is no state topic', () => {
    mqttHandler.listenToHomeAssistantDeviceStateIfNeeded({
      external_id: 'homeassistant:my-device',
      params: [
        {
          name: 'ha_discovery_config:switch:relay',
          value: JSON.stringify({ command_topic: 'my-device/set' }),
        },
      ],
      features: [{ external_id: 'homeassistant:my-device:switch:relay' }],
    });
    expect(mqttHandler.haStateBindings).to.deep.equal({});
  });

  it('should register several bindings on the same topic for a json schema light', () => {
    mqttHandler.listenToHomeAssistantDeviceStateIfNeeded({
      external_id: 'homeassistant:my-device',
      params: [
        {
          name: 'ha_discovery_config:light:main',
          value: JSON.stringify({
            schema: 'json',
            command_topic: 'my-device/set',
            state_topic: 'my-device/state',
            brightness: true,
          }),
        },
      ],
      features: [
        { external_id: 'homeassistant:my-device:light:main:state' },
        { external_id: 'homeassistant:my-device:light:main:brightness' },
      ],
    });
    expect(mqttHandler.haStateBindings['my-device/state']).to.have.lengthOf(2);
    sinon.assert.calledOnce(mqttHandler.subscribe);
  });

  it('should unlisten a device and unsubscribe unused topics only', () => {
    const deviceA = {
      external_id: 'homeassistant:device-a',
      params: [
        {
          name: 'ha_discovery_config:sensor:temperature',
          value: JSON.stringify({ state_topic: 'shared/topic', device_class: 'temperature' }),
        },
      ],
      features: [{ external_id: 'homeassistant:device-a:sensor:temperature' }],
    };
    const deviceB = {
      external_id: 'homeassistant:device-b',
      params: [
        {
          name: 'ha_discovery_config:sensor:humidity',
          value: JSON.stringify({ state_topic: 'shared/topic', device_class: 'humidity' }),
        },
        {
          name: 'ha_discovery_config:sensor:pressure',
          value: JSON.stringify({ state_topic: 'other/topic', device_class: 'pressure' }),
        },
      ],
      features: [
        { external_id: 'homeassistant:device-b:sensor:humidity' },
        { external_id: 'homeassistant:device-b:sensor:pressure' },
      ],
    };
    mqttHandler.listenToHomeAssistantDeviceStateIfNeeded(deviceA);
    mqttHandler.listenToHomeAssistantDeviceStateIfNeeded(deviceB);
    expect(mqttHandler.haStateBindings['shared/topic']).to.have.lengthOf(2);

    mqttHandler.unListenToHomeAssistantDevice(deviceB);
    expect(mqttHandler.haStateBindings['shared/topic']).to.have.lengthOf(1);
    expect(mqttHandler.haStateBindings['other/topic']).to.equal(undefined);
    sinon.assert.calledWith(mqttHandler.unsubscribe, 'other/topic');
  });

  describe('getStateTopic', () => {
    const config = {
      state_topic: 'state',
      brightness_state_topic: 'brightness',
      color_temp_state_topic: 'color_temp',
      rgb_state_topic: 'rgb',
      position_topic: 'position',
      temperature_state_topic: 'target',
      current_temperature_topic: 'current',
    };
    it('should return per-property topics for a default schema light', () => {
      expect(getStateTopic('light', 'state', config)).to.equal('state');
      expect(getStateTopic('light', 'brightness', config)).to.equal('brightness');
      expect(getStateTopic('light', 'color_temp', config)).to.equal('color_temp');
      expect(getStateTopic('light', 'color', config)).to.equal('rgb');
    });
    it('should return the state topic for a json schema light', () => {
      expect(getStateTopic('light', 'brightness', { ...config, schema: 'json' })).to.equal('state');
    });
    it('should return cover topics', () => {
      expect(getStateTopic('cover', 'position', config)).to.equal('position');
      expect(getStateTopic('cover', 'state', config)).to.equal('state');
    });
    it('should return climate topics', () => {
      expect(getStateTopic('climate', 'target_temperature', config)).to.equal('target');
      expect(getStateTopic('climate', 'current_temperature', config)).to.equal('current');
    });
    it('should return the state topic for other components', () => {
      expect(getStateTopic('switch', 'state', config)).to.equal('state');
    });
  });
});
