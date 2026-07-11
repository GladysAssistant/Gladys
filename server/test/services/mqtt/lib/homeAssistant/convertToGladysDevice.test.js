const { expect } = require('chai');

const {
  convertToGladysDevice,
  convertEntityToFeatures,
} = require('../../../../../services/mqtt/lib/homeAssistant/convertToGladysDevice');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.homeAssistant.convertToGladysDevice', () => {
  it('should convert a device with a temperature sensor', () => {
    const device = convertToGladysDevice(SERVICE_ID, {
      identifier: 'my-device',
      info: { name: 'My device', model: 'Sensor 2000' },
      entities: {
        'sensor:my-device:temperature': {
          name: 'Temperature',
          state_topic: 'my-device/temperature',
          device_class: 'temperature',
          unit_of_measurement: '°C',
        },
      },
    });
    expect(device).to.deep.equal({
      name: 'My device',
      external_id: 'homeassistant:my-device',
      selector: 'homeassistant:my-device',
      model: 'Sensor 2000',
      service_id: SERVICE_ID,
      should_poll: false,
      features: [
        {
          name: 'Temperature',
          external_id: 'homeassistant:my-device:sensor:my-device:temperature',
          selector: 'homeassistant:my-device:sensor:my-device:temperature',
          category: 'temperature-sensor',
          type: 'decimal',
          unit: 'celsius',
          read_only: true,
          has_feedback: true,
          keep_history: true,
          min: -100000,
          max: 100000,
        },
      ],
      params: [
        {
          name: 'ha_discovery_config:sensor:my-device:temperature',
          value: JSON.stringify({
            name: 'Temperature',
            state_topic: 'my-device/temperature',
            device_class: 'temperature',
            unit_of_measurement: '°C',
          }),
        },
      ],
    });
  });

  it('should use the identifier as name and null model when no device info', () => {
    const device = convertToGladysDevice(SERVICE_ID, {
      identifier: 'my-device',
      entities: {},
    });
    expect(device.name).to.equal('my-device');
    expect(device.model).to.equal(null);
    expect(device.features).to.deep.equal([]);
    expect(device.params).to.deep.equal([]);
  });

  it('should not store params for entities without features', () => {
    const device = convertToGladysDevice(SERVICE_ID, {
      identifier: 'my-device',
      info: {},
      entities: {
        'sensor:unknown': { state_topic: 'my-device/unknown', device_class: 'unknown_class' },
      },
    });
    expect(device.features).to.deep.equal([]);
    expect(device.params).to.deep.equal([]);
  });

  it('should strip device, origin and availability from stored params', () => {
    const device = convertToGladysDevice(SERVICE_ID, {
      identifier: 'my-device',
      info: {},
      entities: {
        'switch:relay': {
          command_topic: 'my-device/set',
          device: { identifiers: ['my-device'] },
          origin: { name: 'firmware' },
          availability: [{ topic: 'my-device/availability' }],
        },
      },
    });
    expect(device.params).to.deep.equal([
      {
        name: 'ha_discovery_config:switch:relay',
        value: JSON.stringify({ command_topic: 'my-device/set' }),
      },
    ]);
  });

  describe('sensor', () => {
    it('should convert a battery sensor with percent bounds', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'sensor:battery', {
        state_topic: 'my-device/battery',
        device_class: 'battery',
        unit_of_measurement: '%',
      });
      expect(features).to.have.lengthOf(1);
      expect(features[0]).to.deep.include({
        category: 'battery',
        type: 'integer',
        unit: 'percent',
        min: 0,
        max: 100,
      });
    });

    it('should return no feature when there is no state topic', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'sensor:battery', {
        device_class: 'battery',
      });
      expect(features).to.deep.equal([]);
    });

    it('should return no feature for an unsupported device class', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'sensor:custom', {
        state_topic: 'my-device/custom',
        device_class: 'i-dont-exist',
      });
      expect(features).to.deep.equal([]);
    });
  });

  describe('binary_sensor', () => {
    it('should convert a motion binary sensor', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'binary_sensor:motion', {
        name: 'Motion',
        state_topic: 'my-device/motion',
        device_class: 'motion',
      });
      expect(features).to.have.lengthOf(1);
      expect(features[0]).to.deep.include({
        category: 'motion-sensor',
        type: 'binary',
        read_only: true,
        min: 0,
        max: 1,
      });
    });

    it('should convert a binary sensor without device class to a read-only switch', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'binary_sensor:generic', {
        state_topic: 'my-device/generic',
      });
      expect(features[0]).to.deep.include({
        category: 'switch',
        type: 'binary',
        read_only: true,
      });
    });

    it('should return no feature when there is no state topic', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'binary_sensor:generic', {});
      expect(features).to.deep.equal([]);
    });
  });

  describe('switch', () => {
    it('should convert a switch', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'switch:relay', {
        command_topic: 'my-device/set',
        state_topic: 'my-device/state',
      });
      expect(features).to.have.lengthOf(1);
      expect(features[0]).to.deep.include({
        category: 'switch',
        type: 'binary',
        read_only: false,
        has_feedback: true,
      });
    });

    it('should convert a switch without state topic', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'switch:relay', {
        command_topic: 'my-device/set',
      });
      expect(features[0].has_feedback).to.equal(false);
    });

    it('should return no feature when there is no command topic', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'switch:relay', {});
      expect(features).to.deep.equal([]);
    });
  });

  describe('button', () => {
    it('should convert a button', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'button:restart', {
        command_topic: 'my-device/restart',
      });
      expect(features).to.have.lengthOf(1);
      expect(features[0]).to.deep.include({
        category: 'switch',
        type: 'binary',
        read_only: false,
        keep_history: false,
      });
    });

    it('should return no feature when there is no command topic', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'button:restart', {});
      expect(features).to.deep.equal([]);
    });
  });

  describe('light', () => {
    it('should return no feature when there is no command topic', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'light:main', {});
      expect(features).to.deep.equal([]);
    });

    it('should convert a simple on/off light', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'light:main', {
        command_topic: 'my-device/set',
      });
      expect(features).to.have.lengthOf(1);
      expect(features[0]).to.deep.include({
        external_id: 'homeassistant:my-device:light:main:state',
        category: 'light',
        type: 'binary',
        read_only: false,
        has_feedback: false,
      });
    });

    it('should convert a default schema light with brightness, color temperature and color', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'light:main', {
        command_topic: 'my-device/set',
        state_topic: 'my-device/state',
        brightness_command_topic: 'my-device/brightness/set',
        brightness_scale: 100,
        color_temp_command_topic: 'my-device/color_temp/set',
        min_mireds: 150,
        max_mireds: 450,
        rgb_command_topic: 'my-device/rgb/set',
      });
      expect(features).to.have.lengthOf(4);
      expect(features[0]).to.deep.include({ type: 'binary', has_feedback: true });
      expect(features[1]).to.deep.include({
        external_id: 'homeassistant:my-device:light:main:brightness',
        type: 'brightness',
        min: 0,
        max: 100,
      });
      expect(features[2]).to.deep.include({
        external_id: 'homeassistant:my-device:light:main:color_temp',
        type: 'temperature',
        min: 150,
        max: 450,
      });
      expect(features[3]).to.deep.include({
        external_id: 'homeassistant:my-device:light:main:color',
        type: 'color',
        min: 0,
        max: 16777215,
      });
    });

    it('should convert a json schema light with default bounds', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'light:main', {
        schema: 'json',
        command_topic: 'my-device/set',
        state_topic: 'my-device/state',
        brightness: true,
        supported_color_modes: ['color_temp', 'rgb'],
      });
      expect(features).to.have.lengthOf(4);
      expect(features[1]).to.deep.include({ type: 'brightness', min: 0, max: 255 });
      expect(features[2]).to.deep.include({ type: 'temperature', min: 153, max: 500 });
      expect(features[3]).to.deep.include({ type: 'color' });
    });

    it('should convert a json schema light without brightness and colors', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'light:main', {
        schema: 'json',
        command_topic: 'my-device/set',
      });
      expect(features).to.have.lengthOf(1);
    });
  });

  describe('cover', () => {
    it('should convert a cover with state and position', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'cover:shutter', {
        command_topic: 'my-device/set',
        state_topic: 'my-device/state',
        position_topic: 'my-device/position',
        set_position_topic: 'my-device/position/set',
      });
      expect(features).to.have.lengthOf(2);
      expect(features[0]).to.deep.include({
        external_id: 'homeassistant:my-device:cover:shutter:state',
        category: 'shutter',
        type: 'state',
        read_only: false,
        has_feedback: true,
        min: -1,
        max: 1,
      });
      expect(features[1]).to.deep.include({
        external_id: 'homeassistant:my-device:cover:shutter:position',
        category: 'shutter',
        type: 'position',
        read_only: false,
        has_feedback: true,
        min: 0,
        max: 100,
      });
    });

    it('should convert a cover with a read-only position', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'cover:shutter', {
        position_topic: 'my-device/position',
      });
      expect(features).to.have.lengthOf(1);
      expect(features[0]).to.deep.include({ type: 'position', read_only: true });
    });

    it('should return no feature when there is no topic at all', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'cover:shutter', {});
      expect(features).to.deep.equal([]);
    });
  });

  describe('lock', () => {
    it('should convert a lock', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'lock:door', {
        command_topic: 'my-device/lock/set',
        state_topic: 'my-device/lock/state',
      });
      expect(features).to.have.lengthOf(1);
      expect(features[0]).to.deep.include({
        category: 'lock',
        type: 'binary',
        read_only: false,
        has_feedback: true,
      });
    });

    it('should return no feature when there is no command topic', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'lock:door', {});
      expect(features).to.deep.equal([]);
    });
  });

  describe('climate', () => {
    it('should convert a climate with target and current temperature', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'climate:thermostat', {
        temperature_command_topic: 'my-device/target/set',
        temperature_state_topic: 'my-device/target',
        current_temperature_topic: 'my-device/current',
        min_temp: 5,
        max_temp: 30,
      });
      expect(features).to.have.lengthOf(2);
      expect(features[0]).to.deep.include({
        external_id: 'homeassistant:my-device:climate:thermostat:target_temperature',
        category: 'thermostat',
        type: 'target-temperature',
        unit: 'celsius',
        read_only: false,
        has_feedback: true,
        min: 5,
        max: 30,
      });
      expect(features[1]).to.deep.include({
        external_id: 'homeassistant:my-device:climate:thermostat:current_temperature',
        category: 'temperature-sensor',
        type: 'decimal',
        read_only: true,
      });
    });

    it('should use default bounds and fahrenheit unit', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'climate:thermostat', {
        temperature_command_topic: 'my-device/target/set',
        temperature_unit: 'F',
      });
      expect(features).to.have.lengthOf(1);
      expect(features[0]).to.deep.include({ unit: 'fahrenheit', min: 7, max: 35, has_feedback: false });
    });

    it('should return no feature without temperature topics', () => {
      const features = convertEntityToFeatures('homeassistant:my-device', 'climate:thermostat', {});
      expect(features).to.deep.equal([]);
    });
  });

  it('should return no feature for an unsupported component', () => {
    const features = convertEntityToFeatures('homeassistant:my-device', 'vacuum:cleaner', {
      command_topic: 'my-device/set',
    });
    expect(features).to.deep.equal([]);
  });
});
