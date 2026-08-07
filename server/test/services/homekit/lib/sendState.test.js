const { expect } = require('chai');
const { stub } = require('sinon');
const { sendState } = require('../../../../services/homekit/lib/sendState');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  EVENTS,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

describe('Send state to HomeKit', () => {
  const homekitHandler = {
    serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
    sendState,
    gladys: {
      stateManager: {},
    },
    hap: {
      Characteristic: {
        On: 'ON',
        Brightness: 'BRIGHTNESS',
        Hue: 'HUE',
        Saturation: 'SATURATION',
        ColorTemperature: 'COLORTEMPERATURE',
        ContactSensorState: 'CONTACTSENSORSTATE',
        MotionDetected: 'MOTIONDETECTED',
        CurrentTemperature: 'CURRENTTEMPERATURE',
        CurrentPosition: 'CURRENTPOSITION',
        PositionState: 'POSITIONSTATE',
        TargetPosition: 'TARGETPOSITION',
        CurrentAmbientLightLevel: 'CURRENTAMBIENTLIGHTLEVEL',
        CarbonMonoxideDetected: 'CARBONMONOXIDEDETECTED',
        CarbonMonoxideLevel: 'CARBONMONOXIDELEVEL',
        CarbonDioxideLevel: 'CARBONDIOXIDELEVEL',
        CarbonDioxideDetected: 'CARBONDIOXIDEDETECTED',
        AirQuality: 'AIRQUALITY',
        SmokeDetected: 'SMOKEDETECTED',
        PM2_5Density: 'PM25DENSITY',
        PM10Density: 'PM10DENSITY',
      },
      Service: {
        ContactSensor: 'CONTACTSENSOR',
        MotionSensor: 'MOTIONSENSOR',
        WindowCovering: 'WINDOWCOVERING',
        LightSensor: 'LIGHTSENSOR',
        CarbonMonoxideSensor: 'CARBONMONOXIDESENSOR',
        CarbonDioxideSensor: 'CARBONDIOXIDESENSOR',
        AirQualitySensor: 'AIRQUALITYSENSOR',
        SmokeSensor: 'SMOKESENSOR',
      },
    },
    notifyTimeouts: {},
  };

  it('should notify binary sensor', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 0,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Light on/off',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0]).eql(['ON', 0]);
  });

  it('should notify binary sensor (reversed)', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 0,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Door sensor',
      category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0]).eql(['CONTACTSENSORSTATE', 1]);
  });

  it('should notify siren', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 1,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Siren',
      category: DEVICE_FEATURE_CATEGORIES.SIREN,
      type: DEVICE_FEATURE_TYPES.SIREN.BINARY,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0]).eql(['ON', 1]);
  });

  it('should notify motion sensor', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 0,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Motion sensor',
      category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0]).eql(['MOTIONDETECTED', 0]);
  });

  it('should notify light brightness', async () => {
    const updateCharacteristic = stub().returns();
    const getCharacteristic = stub().returns({
      props: {
        minValue: 0,
        maxValue: 100,
      },
    });
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({
        updateCharacteristic,
        getCharacteristic,
      }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 70,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Bulb brightness',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      min: 0,
      max: 140,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0][0]).eql('BRIGHTNESS');
    expect(updateCharacteristic.args[0][1]).eql(50);
  });

  it('should notify light color', async () => {
    const updateCharacteristic = stub();
    updateCharacteristic.returns({ updateCharacteristic });

    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 3500000,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Bulb color',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.callCount).eq(2);
    expect(updateCharacteristic.args[0]).eql(['HUE', 222]);
    expect(updateCharacteristic.args[1]).eql(['SATURATION', 76]);
  });

  it('should notify light temperature', async () => {
    const updateCharacteristic = stub().returns();
    const getCharacteristic = stub().returns({
      props: {
        minValue: 140,
        maxValue: 500,
      },
    });
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({
        updateCharacteristic,
        getCharacteristic,
      }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 50,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Bulb temperature',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
      min: 0,
      max: 100,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0][0]).eql('COLORTEMPERATURE');
    expect(updateCharacteristic.args[0][1]).eql(320);
  });

  it('should clamp light temperature above HomeKit ColorTemperature max', async () => {
    const updateCharacteristic = stub().returns();
    const getCharacteristic = stub().returns({
      props: {
        minValue: 140,
        maxValue: 500,
      },
    });
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({
        updateCharacteristic,
        getCharacteristic,
      }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 525,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Bande LED chambre Color Temperature',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
      min: 150,
      max: 500,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0][0]).eql('COLORTEMPERATURE');
    expect(updateCharacteristic.args[0][1]).eql(500);
  });

  it('should notify sensor temperature Kelvin', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 294.15,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Sensor temperature',
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.KELVIN,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0]).eql(['CURRENTTEMPERATURE', 21]);
  });

  it('should notify sensor temperature Fahrenheit', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 68,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Sensor temperature',
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0]).eql(['CURRENTTEMPERATURE', 20]);
  });

  it('should notify shutter state', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 0,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Shutter state',
      category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
      type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0]).eql(['POSITIONSTATE', 2]);
  });

  it('should notify shutter current/target position', async () => {
    const updateCharacteristic = stub();
    updateCharacteristic.returns({ updateCharacteristic });
    const getCharacteristic = stub().returns({
      props: {
        minValue: 0,
        maxValue: 100,
      },
    });

    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic, getCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 60,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Shutter position',
      category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
      type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
      min: 0,
      max: 100,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.callCount).eq(2);
    expect(updateCharacteristic.args[0][0]).eql('CURRENTPOSITION');
    expect(updateCharacteristic.args[0][1]).eql(60);
    expect(updateCharacteristic.args[1][0]).eql('TARGETPOSITION');
    expect(updateCharacteristic.args[1][1]).eql(60);
  });

  it('should notify light sensor', async () => {
    const updateCharacteristic = stub().returns();
    const getCharacteristic = stub().returns({
      props: {
        minValue: 0.0001,
        maxValue: 100000,
      },
    });
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic, getCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 250,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Light sensor',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.LUX,
      min: 0,
      max: 100000,
    };

    await homekitHandler.sendState(accessory, feature, event);
    // integrations report the illuminance either as a decimal or as an integer
    await homekitHandler.sendState(
      accessory,
      { ...feature, type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER },
      { ...event, last_value: 300 },
    );

    expect(updateCharacteristic.args[0]).eql(['CURRENTAMBIENTLIGHTLEVEL', 250]);
    expect(updateCharacteristic.args[1]).eql(['CURRENTAMBIENTLIGHTLEVEL', 300]);
  });

  it('should notify carbon monoxide sensor', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 1,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'CO sensor',
      category: DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    };

    await homekitHandler.sendState(accessory, feature, event);
    // Z-Wave binary sensors are remapped to the CO2 category while staying binary
    await homekitHandler.sendState(accessory, { ...feature, category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR }, event);

    expect(updateCharacteristic.args[0]).eql(['CARBONMONOXIDEDETECTED', 1]);
    expect(updateCharacteristic.args[1]).eql(['CARBONDIOXIDEDETECTED', 1]);
  });

  it('should notify carbon dioxide sensor level and alarm', async () => {
    const updateCharacteristic = stub();
    updateCharacteristic.returns({ updateCharacteristic });
    const getCharacteristic = stub().returns({
      props: {
        minValue: 0,
        maxValue: 100000,
      },
    });
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic, getCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 900,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'CO2 sensor',
      category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
      unit: DEVICE_FEATURE_UNITS.PPM,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.callCount).eq(2);
    expect(updateCharacteristic.args[0]).eql(['CARBONDIOXIDELEVEL', 900]);
    // below the 1000 ppm threshold, no alarm
    expect(updateCharacteristic.args[1]).eql(['CARBONDIOXIDEDETECTED', 0]);

    // above the threshold, and the decimal flavour of the same category
    await homekitHandler.sendState(
      accessory,
      { ...feature, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
      { ...event, last_value: 1500 },
    );

    expect(updateCharacteristic.args[2]).eql(['CARBONDIOXIDELEVEL', 1500]);
    expect(updateCharacteristic.args[3]).eql(['CARBONDIOXIDEDETECTED', 1]);

    // and a carbon monoxide sensor reporting a concentration, both flavours
    const coFeature = {
      ...feature,
      category: DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
    };
    await homekitHandler.sendState(
      accessory,
      { ...coFeature, type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL },
      { ...event, last_value: 40 },
    );
    await homekitHandler.sendState(
      accessory,
      { ...coFeature, type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER },
      { ...event, last_value: 10 },
    );

    expect(updateCharacteristic.args[4]).eql(['CARBONMONOXIDELEVEL', 40]);
    expect(updateCharacteristic.args[5]).eql(['CARBONMONOXIDEDETECTED', 1]);
    expect(updateCharacteristic.args[7]).eql(['CARBONMONOXIDEDETECTED', 0]);

    // sitting exactly on the alarm level is alarming, not safe
    await homekitHandler.sendState(accessory, coFeature, { ...event, last_value: 25 });
    await homekitHandler.sendState(accessory, feature, { ...event, last_value: 1000 });

    expect(updateCharacteristic.args[9]).eql(['CARBONMONOXIDEDETECTED', 1]);
    expect(updateCharacteristic.args[11]).eql(['CARBONDIOXIDEDETECTED', 1]);
  });

  it('should notify air quality sensor', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 160,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Air quality sensor',
      category: DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.AIRQUALITY_SENSOR.AQI,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0]).eql(['AIRQUALITY', 4]);
  });

  it('should notify particulate densities', async () => {
    const updateCharacteristic = stub().returns();
    const getCharacteristic = stub().returns({
      props: {
        minValue: 0,
        maxValue: 1000,
      },
    });
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic, getCharacteristic }),
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'PM2.5 sensor',
      category: DEVICE_FEATURE_CATEGORIES.PM25_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER,
    };
    const event = { type: EVENTS.DEVICE.NEW_STATE, last_value: 42 };

    await homekitHandler.sendState(accessory, feature, event);
    // 0.05 mg/m³ is 50 µg/m³
    await homekitHandler.sendState(
      accessory,
      { ...feature, unit: DEVICE_FEATURE_UNITS.MILLIGRAM_PER_CUBIC_METER },
      { ...event, last_value: 0.05 },
    );
    // 8000 ng/m³ is 8 µg/m³, on the PM10 category this time
    await homekitHandler.sendState(
      accessory,
      {
        ...feature,
        category: DEVICE_FEATURE_CATEGORIES.PM10_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        unit: DEVICE_FEATURE_UNITS.NANOGRAM_PER_CUBIC_METER,
      },
      { ...event, last_value: 8000 },
    );

    expect(updateCharacteristic.args[0]).eql(['PM25DENSITY', 42]);
    expect(updateCharacteristic.args[1]).eql(['PM25DENSITY', 50]);
    expect(updateCharacteristic.args[2]).eql(['PM10DENSITY', 8]);
  });

  it('should notify smoke sensor', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Smoke sensor',
      category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    };

    await homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 1 });

    expect(updateCharacteristic.args[0]).eql(['SMOKEDETECTED', 1]);
  });

  it('should do nothing wrong device category & type', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 68,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Sensor temperature',
      category: DEVICE_FEATURE_CATEGORIES.UNKNOWN,
      type: DEVICE_FEATURE_TYPES.UNKNOWN.UNKNOWN,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.callCount).eql(0);
  });
});
