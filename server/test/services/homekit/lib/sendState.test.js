const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub } = sinon;
const logger = require('../../../../utils/logger');
const { sendState } = require('../../../../services/homekit/lib/sendState');
const { indexFeatureService } = require('../../../../services/homekit/lib/featureServices');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  EVENTS,
  DEVICE_FEATURE_UNITS,
  FAN_MODE,
  FAN_ROCK_SETTING,
  FAN_AIRFLOW_DIRECTION,
  LOCK,
  BUTTON_STATUS,
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
        CoolingThresholdTemperature: 'COOLINGTHRESHOLDTEMPERATURE',
        HeatingThresholdTemperature: 'HEATINGTHRESHOLDTEMPERATURE',
        TargetHeatingCoolingState: 'TARGETHEATINGCOOLINGSTATE',
        CurrentHeatingCoolingState: 'CURRENTHEATINGCOOLINGSTATE',
        TargetTemperature: 'TARGETTEMPERATURE',
        MotionDetected: 'MOTIONDETECTED',
        OccupancyDetected: 'OCCUPANCYDETECTED',
        CurrentTemperature: 'CURRENTTEMPERATURE',
        CurrentPosition: 'CURRENTPOSITION',
        Active: 'ACTIVE',
        RotationSpeed: 'ROTATIONSPEED',
        SwingMode: 'SWINGMODE',
        RotationDirection: 'ROTATIONDIRECTION',
        PositionState: 'POSITIONSTATE',
        TargetPosition: 'TARGETPOSITION',
        LockCurrentState: 'LOCKCURRENTSTATE',
        LockTargetState: 'LOCKTARGETSTATE',
        CurrentAmbientLightLevel: 'CURRENTAMBIENTLIGHTLEVEL',
        CarbonMonoxideDetected: 'CARBONMONOXIDEDETECTED',
        CarbonMonoxideLevel: 'CARBONMONOXIDELEVEL',
        CarbonDioxideLevel: 'CARBONDIOXIDELEVEL',
        CarbonDioxideDetected: 'CARBONDIOXIDEDETECTED',
        AirQuality: 'AIRQUALITY',
        SmokeDetected: 'SMOKEDETECTED',
        BatteryLevel: 'BATTERYLEVEL',
        StatusLowBattery: 'STATUSLOWBATTERY',
        Fanv2: 'FANV2',
        ProgrammableSwitchEvent: 'PROGRAMMABLESWITCHEVENT',
        PM2_5Density: 'PM25DENSITY',
        PM10Density: 'PM10DENSITY',
        NitrogenDioxideDensity: 'NO2DENSITY',
        OzoneDensity: 'O3DENSITY',
        SulphurDioxideDensity: 'SO2DENSITY',
      },
      CharacteristicEventTypes: { GET: 'get', SET: 'set' },
      Service: {
        ContactSensor: 'CONTACTSENSOR',
        MotionSensor: 'MOTIONSENSOR',
        OccupancySensor: 'OCCUPANCYSENSOR',
        WindowCovering: 'WINDOWCOVERING',
        Thermostat: 'THERMOSTAT',
        TemperatureSensor: 'TEMPERATURESENSOR',
        LockMechanism: 'LOCKMECHANISM',
        LightSensor: 'LIGHTSENSOR',
        CarbonMonoxideSensor: 'CARBONMONOXIDESENSOR',
        CarbonDioxideSensor: 'CARBONDIOXIDESENSOR',
        AirQualitySensor: 'AIRQUALITYSENSOR',
        SmokeSensor: 'SMOKESENSOR',
        Battery: 'BATTERY',
        StatelessProgrammableSwitch: 'STATELESSPROGRAMMABLESWITCH',
      },
    },
    notifyTimeouts: {},
  };

  it('should notify binary sensor', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({
        updateCharacteristic,
        testCharacteristic: stub().returns(false),
        getCharacteristic: stub().returns({ props: { minValue: -270, maxValue: 100 } }),
      }),
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
      getService: stub().returns({
        updateCharacteristic,
        testCharacteristic: stub().returns(false),
        getCharacteristic: stub().returns({ props: { minValue: -270, maxValue: 100 } }),
      }),
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
      getService: stub().returns({
        updateCharacteristic,
        testCharacteristic: stub().returns(false),
        getCharacteristic: stub().returns({ props: { minValue: -270, maxValue: 100 } }),
      }),
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
      getService: stub().returns({
        updateCharacteristic,
        testCharacteristic: stub().returns(false),
        getCharacteristic: stub().returns({ props: { minValue: -270, maxValue: 100 } }),
      }),
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

  it('should notify presence sensor', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Presence',
      category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.PUSH,
    };

    // the scanner reports the device answering, then no longer answering
    await homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 1 });
    await homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 0 });

    // an integration exposing presence as a plain binary reaches the same branch
    await homekitHandler.sendState(
      accessory,
      { ...feature, type: DEVICE_FEATURE_TYPES.SENSOR.BINARY },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: 1 },
    );

    expect(updateCharacteristic.args).eql([
      ['OCCUPANCYDETECTED', 1],
      ['OCCUPANCYDETECTED', 0],
      ['OCCUPANCYDETECTED', 1],
    ]);
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
      getService: stub().returns({
        updateCharacteristic,
        testCharacteristic: stub().returns(false),
        getCharacteristic: stub().returns({ props: { minValue: -270, maxValue: 100 } }),
      }),
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
      getService: stub().returns({
        updateCharacteristic,
        testCharacteristic: stub().returns(false),
        getCharacteristic: stub().returns({ props: { minValue: -270, maxValue: 100 } }),
      }),
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
      getService: stub().returns({
        updateCharacteristic,
        testCharacteristic: stub().returns(false),
        getCharacteristic: stub().returns({ props: { minValue: -270, maxValue: 100 } }),
      }),
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
      getService: stub().returns({
        updateCharacteristic,
        testCharacteristic: stub().returns(false),
        getCharacteristic: stub().returns({ props: { minValue: -270, maxValue: 100 } }),
      }),
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
      getService: stub().returns({
        updateCharacteristic,
        testCharacteristic: stub().returns(false),
        getCharacteristic: stub().returns({ props: { minValue: -270, maxValue: 100 } }),
      }),
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
      getService: stub().returns({
        updateCharacteristic,
        testCharacteristic: stub().returns(false),
        getCharacteristic: stub().returns({ props: { minValue: -270, maxValue: 100 } }),
      }),
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

  it('should notify gas densities', async () => {
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
      name: 'NO2 sensor',
      category: DEVICE_FEATURE_CATEGORIES.NO2_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER,
    };
    const event = { type: EVENTS.DEVICE.NEW_STATE, last_value: 35 };

    await homekitHandler.sendState(accessory, feature, event);
    // 0.12 mg/m³ is 120 µg/m³, on the O3 category
    await homekitHandler.sendState(
      accessory,
      {
        ...feature,
        category: DEVICE_FEATURE_CATEGORIES.O3_SENSOR,
        unit: DEVICE_FEATURE_UNITS.MILLIGRAM_PER_CUBIC_METER,
      },
      { ...event, last_value: 0.12 },
    );
    // 45000 ng/m³ is 45 µg/m³, on the SO2 category
    await homekitHandler.sendState(
      accessory,
      {
        ...feature,
        category: DEVICE_FEATURE_CATEGORIES.SO2_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        unit: DEVICE_FEATURE_UNITS.NANOGRAM_PER_CUBIC_METER,
      },
      { ...event, last_value: 45000 },
    );

    expect(updateCharacteristic.args[0]).eql(['NO2DENSITY', 35]);
    expect(updateCharacteristic.args[1]).eql(['O3DENSITY', 120]);
    expect(updateCharacteristic.args[2]).eql(['SO2DENSITY', 45]);
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

  it('should notify battery level and low battery flag', async () => {
    const updateCharacteristic = stub().returns();
    const getCharacteristic = stub().returns({ props: { minValue: 0, maxValue: 100 } });
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic, getCharacteristic }),
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Battery',
      category: DEVICE_FEATURE_CATEGORIES.BATTERY,
      type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    };

    // this device reports its own low-battery flag, so the level must not derive a second one
    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4756151c-369e-4772-8bf7-943a6ac70583',
        features: [feature, { ...feature, category: DEVICE_FEATURE_CATEGORIES.BATTERY_LOW }],
      }),
    };

    await homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 42 });
    // Nuki reports the same thing as a lock integer
    await homekitHandler.sendState(
      accessory,
      { ...feature, type: DEVICE_FEATURE_TYPES.LOCK.INTEGER },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: 8 },
    );
    await homekitHandler.sendState(
      accessory,
      {
        ...feature,
        category: DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
        type: DEVICE_FEATURE_TYPES.BATTERY_LOW.BINARY,
      },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: 1 },
    );

    expect(updateCharacteristic.args[0]).eql(['BATTERYLEVEL', 42]);
    expect(updateCharacteristic.args[1]).eql(['BATTERYLEVEL', 8]);
    // the two remaining type flavours reach the same branches
    await homekitHandler.sendState(
      accessory,
      { ...feature, type: DEVICE_FEATURE_TYPES.BATTERY.INTEGER },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: 60 },
    );
    await homekitHandler.sendState(
      accessory,
      { ...feature, category: DEVICE_FEATURE_CATEGORIES.BATTERY_LOW, type: DEVICE_FEATURE_TYPES.SENSOR.BINARY },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: 0 },
    );

    expect(updateCharacteristic.args[2]).eql(['STATUSLOWBATTERY', 1]);
    expect(updateCharacteristic.args[3]).eql(['BATTERYLEVEL', 60]);
    expect(updateCharacteristic.args[4]).eql(['STATUSLOWBATTERY', 0]);

    // a reading outside the HomeKit 0-100 range is clamped, not rejected
    await homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 120 });
    await homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: -5 });

    expect(updateCharacteristic.args[5]).eql(['BATTERYLEVEL', 100]);
    expect(updateCharacteristic.args[6]).eql(['BATTERYLEVEL', 0]);
  });

  it('should derive the low battery flag when the device only reports a percentage', async () => {
    const updateCharacteristic = stub().returns();
    const getCharacteristic = stub().returns({ props: { minValue: 0, maxValue: 100 } });
    // narrowed to the battery service, so picking the wrong one fails here rather than passing
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub()
        .withArgs('BATTERY')
        .returns({ updateCharacteristic, getCharacteristic }),
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Battery',
      category: DEVICE_FEATURE_CATEGORIES.BATTERY,
      type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({ id: '4756151c-369e-4772-8bf7-943a6ac70583', features: [feature] }),
    };

    // the threshold is inclusive, and crossing it has to notify HomeKit rather than wait for a poll
    await homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 21 });
    await homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 20 });

    expect(updateCharacteristic.args).eql([
      ['BATTERYLEVEL', 21],
      ['STATUSLOWBATTERY', 0],
      ['BATTERYLEVEL', 20],
      ['STATUSLOWBATTERY', 1],
    ]);

    // and back up: a battery that has been changed has to clear the warning as fast as it raised it
    await homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 21 });

    expect(updateCharacteristic.args[4]).eql(['BATTERYLEVEL', 21]);
    expect(updateCharacteristic.args[5]).eql(['STATUSLOWBATTERY', 0]);

    // a device that reports nothing is not low on battery: `null <= 20` is true in JavaScript
    await homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: null });

    expect(updateCharacteristic.args[7]).eql(['STATUSLOWBATTERY', 0]);
  });

  it('should notify lock target state', async () => {
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
      name: 'Lock button',
      category: DEVICE_FEATURE_CATEGORIES.LOCK,
      type: DEVICE_FEATURE_TYPES.LOCK.BINARY,
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({ id: '4756151c-369e-4772-8bf7-943a6ac70583', features: [feature] }),
    };

    await homekitHandler.sendState(accessory, feature, event);
    await homekitHandler.sendState(accessory, feature, { ...event, last_value: 0 });

    expect(updateCharacteristic.args[0]).eql(['LOCKTARGETSTATE', 1]);
    // with no state feature the command is also what HomeKit reads as the current position
    expect(updateCharacteristic.args[1]).eql(['LOCKCURRENTSTATE', 1]);
    expect(updateCharacteristic.args[2]).eql(['LOCKTARGETSTATE', 0]);
    expect(updateCharacteristic.args[3]).eql(['LOCKCURRENTSTATE', 0]);
  });

  it('should leave the current state alone when the lock reports one', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const binaryFeature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Lock button',
      category: DEVICE_FEATURE_CATEGORIES.LOCK,
      type: DEVICE_FEATURE_TYPES.LOCK.BINARY,
    };
    const stateFeature = {
      id: '0e2d1e1a-0a67-4b58-a2ff-0eb0e13a4b32',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Lock state',
      category: DEVICE_FEATURE_CATEGORIES.LOCK,
      type: DEVICE_FEATURE_TYPES.LOCK.STATE,
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4756151c-369e-4772-8bf7-943a6ac70583',
        features: [binaryFeature, stateFeature],
      }),
    };

    await homekitHandler.sendState(accessory, binaryFeature, {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 1,
    });

    // the state feature is the one that knows about motion and jamming: the command must move the
    // target only, or a Nuki reporting `locking` would be shown as secured while it is still moving
    expect(updateCharacteristic.args).eql([['LOCKTARGETSTATE', 1]]);
  });

  it('should notify lock current state', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: LOCK.STATE.ERROR,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Lock state',
      category: DEVICE_FEATURE_CATEGORIES.LOCK,
      type: DEVICE_FEATURE_TYPES.LOCK.STATE,
    };

    await homekitHandler.sendState(accessory, feature, event);

    // a Gladys lock error is reported as jammed to HomeKit
    expect(updateCharacteristic.args[0]).eql(['LOCKCURRENTSTATE', 2]);

    // the three other states, so the whole mapping is covered
    await homekitHandler.sendState(accessory, feature, { ...event, last_value: LOCK.STATE.UNLOCKED });
    await homekitHandler.sendState(accessory, feature, { ...event, last_value: LOCK.STATE.LOCKED });
    // a lock in motion has no HomeKit equivalent and is reported as unknown, not as locked
    await homekitHandler.sendState(accessory, feature, { ...event, last_value: LOCK.STATE.ACTIVITY });

    expect(updateCharacteristic.args[1]).eql(['LOCKCURRENTSTATE', 0]);
    expect(updateCharacteristic.args[2]).eql(['LOCKCURRENTSTATE', 1]);
    expect(updateCharacteristic.args[3]).eql(['LOCKCURRENTSTATE', 3]);
  });

  it('should notify the three button events HomeKit knows, and drop the others', async () => {
    const sendEventNotification = stub();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ getCharacteristic: stub().returns({ sendEventNotification }) }),
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Button',
      category: DEVICE_FEATURE_CATEGORIES.BUTTON,
      type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
    };
    const press = (status, overrides = {}) =>
      homekitHandler.sendState(
        accessory,
        { ...feature, ...overrides },
        { type: EVENTS.DEVICE.NEW_STATE, last_value: status },
      );

    await press(BUTTON_STATUS.CLICK);
    await press(BUTTON_STATUS.DOUBLE_CLICK);
    await press(BUTTON_STATUS.LONG_CLICK, { type: DEVICE_FEATURE_TYPES.BUTTON.PUSH });

    expect(sendEventNotification.args[0][0]).to.equal(0);
    expect(sendEventNotification.args[1][0]).to.equal(1);
    expect(sendEventNotification.args[2][0]).to.equal(2);

    // two identical presses in a row must both be delivered, which updateCharacteristic would not do
    await press(BUTTON_STATUS.CLICK);
    await press(BUTTON_STATUS.CLICK);

    expect(sendEventNotification.callCount).to.equal(5);
    expect(sendEventNotification.args[3][0]).to.equal(0);
    expect(sendEventNotification.args[4][0]).to.equal(0);

    // a gesture with no HomeKit equivalent must not fire one of the three above
    await press(BUTTON_STATUS.SHAKE);
    await press(BUTTON_STATUS.ROTATE_LEFT);

    expect(sendEventNotification.callCount).to.equal(5);
  });

  it('should notify a Xiaomi long press, sent through its own status table', async () => {
    const sendEventNotification = stub();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ getCharacteristic: stub().returns({ sendEventNotification }) }),
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Button',
      category: DEVICE_FEATURE_CATEGORIES.BUTTON,
      type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
    };
    const press = (status) =>
      homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: status });

    // xiaomi.newValueSwitch emits its own SWITCH_STATUS values on a button:click feature, and
    // SWITCH_STATUS.LONG_CLICK_PRESS is the same 3 as BUTTON_STATUS.LONG_CLICK_PRESS
    await press(BUTTON_STATUS.LONG_CLICK_PRESS);

    expect(sendEventNotification.args).eql([[2]]);

    // the matching release is dropped, or a single hold would fire twice
    await press(BUTTON_STATUS.LONG_CLICK_RELEASE);

    expect(sendEventNotification.callCount).to.equal(1);
  });

  it('should notify the press names used by Matter and Zigbee2MQTT', async () => {
    const sendEventNotification = stub();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ getCharacteristic: stub().returns({ sendEventNotification }) }),
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Button',
      category: DEVICE_FEATURE_CATEGORIES.BUTTON,
      type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
    };
    const press = (status) =>
      homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: status });

    await press(BUTTON_STATUS.SHORT_RELEASE);
    await press(BUTTON_STATUS.PRESSED);
    await press(BUTTON_STATUS.DOUBLE_PRESS);
    await press(BUTTON_STATUS.LONG_PRESS);
    await press(BUTTON_STATUS.HOLD_CLICK);

    expect(sendEventNotification.args.map(([value]) => value)).eql([0, 0, 1, 2, 2]);

    // Matter opens every press with INITIAL_PRESS, long ones included: forwarding it would fire a
    // single press each time the button is held down
    await press(BUTTON_STATUS.INITIAL_PRESS);
    await press(BUTTON_STATUS.LONG_RELEASE);

    expect(sendEventNotification.callCount).to.equal(5);
  });

  it('should notify the button that was actually pressed on a multi-button remote', async () => {
    const firstButton = stub();
    const secondButton = stub();
    const leftFeature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      selector: 'remote-button-left',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Left',
      category: DEVICE_FEATURE_CATEGORIES.BUTTON,
      type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
    };
    const rightFeature = { ...leftFeature, selector: 'remote-button-right', name: 'Right' };
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ getCharacteristic: stub().returns({ sendEventNotification: firstButton }) }),
    };

    // The remote carries one StatelessProgrammableSwitch service per button, as buildAccessory
    // builds them.
    indexFeatureService(accessory, { getCharacteristic: stub().returns({ sendEventNotification: firstButton }) }, [
      leftFeature,
    ]);
    indexFeatureService(accessory, { getCharacteristic: stub().returns({ sendEventNotification: secondButton }) }, [
      rightFeature,
    ]);

    await homekitHandler.sendState(accessory, rightFeature, {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: BUTTON_STATUS.CLICK,
    });

    expect(secondButton.args).eql([[0]]);
    expect(firstButton.callCount).to.equal(0);
    // getService — which returns the first service of a type — is never consulted
    expect(accessory.getService.callCount).to.equal(0);
  });

  it('should notify a shutter position on the shutter it belongs to', async () => {
    const firstShutter = stub();
    const secondShutter = stub();
    const getCharacteristic = stub().returns({ props: { minValue: 0, maxValue: 100 } });
    const leftFeature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      selector: 'shutter-left-position',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Volet gauche',
      category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
      type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
      min: 0,
      max: 100,
    };
    const rightFeature = { ...leftFeature, selector: 'shutter-right-position', name: 'Volet droit' };
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic: firstShutter, getCharacteristic }),
    };

    indexFeatureService(accessory, { updateCharacteristic: firstShutter, getCharacteristic }, [leftFeature]);
    indexFeatureService(accessory, { updateCharacteristic: secondShutter, getCharacteristic }, [rightFeature]);

    await homekitHandler.sendState(accessory, rightFeature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 42 });

    expect(secondShutter.args).eql([
      ['CURRENTPOSITION', 42],
      ['TARGETPOSITION', 42],
    ]);
    expect(firstShutter.callCount).to.equal(0);
  });

  it('should notify the temperature merged into a thermostat rather than a standalone sensor', async () => {
    const thermostat = stub();
    const standaloneSensor = stub();
    const getCharacteristic = stub().returns({ props: { minValue: -270, maxValue: 100 } });
    const mergedFeature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      selector: 'thermostat-room-temperature',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Température intérieure',
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    };
    const outsideFeature = { ...mergedFeature, selector: 'thermostat-outside-temperature', name: 'Extérieur' };
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      // the extra sensor keeps its own TemperatureSensor service, and comes first
      getService: stub().returns({
        updateCharacteristic: standaloneSensor,
        getCharacteristic,
        testCharacteristic: stub().returns(false),
      }),
    };

    indexFeatureService(
      accessory,
      { updateCharacteristic: standaloneSensor, getCharacteristic, testCharacteristic: stub().returns(false) },
      [outsideFeature],
    );
    indexFeatureService(
      accessory,
      { updateCharacteristic: thermostat, getCharacteristic, testCharacteristic: stub().returns(false) },
      [mergedFeature],
    );

    await homekitHandler.sendState(accessory, mergedFeature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 21 });

    expect(thermostat.args).eql([['CURRENTTEMPERATURE', 21]]);
    expect(standaloneSensor.callCount).to.equal(0);
  });

  it('should notify fan mode, speed, oscillation and direction', async () => {
    const updateCharacteristic = stub().returns();
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

    const baseFeature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Fan',
      category: DEVICE_FEATURE_CATEGORIES.FAN,
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4756151c-369e-4772-8bf7-943a6ac70583',
        features: [{ ...baseFeature, type: DEVICE_FEATURE_TYPES.FAN.SPEED }],
      }),
    };

    await homekitHandler.sendState(
      accessory,
      { ...baseFeature, type: DEVICE_FEATURE_TYPES.FAN.MODE },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: FAN_MODE.HIGH },
    );
    await homekitHandler.sendState(
      accessory,
      { ...baseFeature, type: DEVICE_FEATURE_TYPES.FAN.SPEED, min: 0, max: 10 },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: 5 },
    );
    await homekitHandler.sendState(
      accessory,
      { ...baseFeature, type: DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: FAN_ROCK_SETTING.UP_DOWN },
    );
    await homekitHandler.sendState(
      accessory,
      { ...baseFeature, type: DEVICE_FEATURE_TYPES.FAN.AIRFLOW_DIRECTION },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: FAN_AIRFLOW_DIRECTION.FORWARD },
    );

    expect(updateCharacteristic.args[0]).eql(['ACTIVE', 1]);
    expect(updateCharacteristic.args[1]).eql(['ROTATIONSPEED', 50]);
    expect(updateCharacteristic.args[2]).eql(['SWINGMODE', 1]);
    expect(updateCharacteristic.args[3]).eql(['ROTATIONDIRECTION', 0]);

    // and the opposite value of each
    await homekitHandler.sendState(
      accessory,
      { ...baseFeature, type: DEVICE_FEATURE_TYPES.FAN.MODE },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: FAN_MODE.OFF },
    );
    await homekitHandler.sendState(
      accessory,
      { ...baseFeature, type: DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: FAN_ROCK_SETTING.OFF },
    );
    await homekitHandler.sendState(
      accessory,
      { ...baseFeature, type: DEVICE_FEATURE_TYPES.FAN.AIRFLOW_DIRECTION },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: FAN_AIRFLOW_DIRECTION.REVERSE },
    );

    expect(updateCharacteristic.args[4]).eql(['ACTIVE', 0]);
    expect(updateCharacteristic.args[5]).eql(['SWINGMODE', 0]);
    expect(updateCharacteristic.args[6]).eql(['ROTATIONDIRECTION', 1]);

    // a fan exposing a percentage rather than a raw speed
    await homekitHandler.sendState(
      accessory,
      { ...baseFeature, type: DEVICE_FEATURE_TYPES.FAN.PERCENT, min: 0, max: 100 },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: 30 },
    );

    expect(updateCharacteristic.args[7]).eql(['ROTATIONSPEED', 30]);
  });

  it('should ignore the raw speed of a fan that also reports a percentage', async () => {
    const updateCharacteristic = stub().returns();
    const getCharacteristic = stub().returns({ props: { minValue: 0, maxValue: 100 } });
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic, getCharacteristic }),
    };

    const baseFeature = {
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Fan',
      category: DEVICE_FEATURE_CATEGORIES.FAN,
    };
    const percentFeature = {
      ...baseFeature,
      id: 'e9ba4c39-4e8c-4dd1-9a4f-1a5c3b3f9b4d',
      type: DEVICE_FEATURE_TYPES.FAN.PERCENT,
      min: 0,
      max: 100,
    };
    const speedFeature = {
      ...baseFeature,
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      type: DEVICE_FEATURE_TYPES.FAN.SPEED,
      min: 0,
      max: 10,
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4756151c-369e-4772-8bf7-943a6ac70583',
        features: [percentFeature, speedFeature],
      }),
    };

    await homekitHandler.sendState(accessory, speedFeature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 5 });

    // buildService reads RotationSpeed from the percentage, so rescaling the raw speed here would
    // overwrite it with a value HomeKit is not showing
    expect(updateCharacteristic.callCount).to.equal(0);

    await homekitHandler.sendState(accessory, percentFeature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 30 });

    expect(updateCharacteristic.args).eql([['ROTATIONSPEED', 30]]);
  });

  it('should notify current temperature on a merged thermostat', async () => {
    const updateCharacteristic = stub().returns();
    const currentStateCharacteristic = { emit: stub().callsArgWith(1, undefined, 2) };
    const thermostatService = {
      updateCharacteristic,
      testCharacteristic: stub().returns(true),
      getCharacteristic: stub().returns(currentStateCharacteristic),
    };
    // the device has no standalone TemperatureSensor service, it was merged into the thermostat
    const getService = stub();
    getService.withArgs('TEMPERATURESENSOR').returns(undefined);
    getService.withArgs('THERMOSTAT').returns(thermostatService);
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService,
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 19.5,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Room temperature',
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0]).eql(['CURRENTTEMPERATURE', 19.5]);
    // heating or cooling in AUTO depends on the room temperature, so it is recomputed
    expect(updateCharacteristic.args[1]).eql(['CURRENTHEATINGCOOLINGSTATE', 2]);
  });

  it('should notify a thermostat setpoint', async () => {
    const updateCharacteristic = stub().returns();
    const characteristic = { emit: stub().callsArgWith(1, undefined, 21) };
    const thermostatService = {
      updateCharacteristic,
      testCharacteristic: stub().returns(true),
      getCharacteristic: stub().returns(characteristic),
    };
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns(thermostatService),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 69.8,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Setpoint',
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
      unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
    };

    await homekitHandler.sendState(accessory, feature, event);

    // 69.8 °F is 21 °C
    expect(updateCharacteristic.args[0][0]).eql('HEATINGTHRESHOLDTEMPERATURE');
    expect(updateCharacteristic.args[0][1]).to.be.closeTo(21, 0.001);
    expect(updateCharacteristic.args[1]).eql(['TARGETTEMPERATURE', 21]);
  });

  it('should notify an air conditioning setpoint on a thermostat without thresholds', async () => {
    const updateCharacteristic = stub().returns();
    const characteristic = { emit: stub().callsArgWith(1, undefined, 24) };
    const thermostatService = {
      updateCharacteristic,
      // a device with a single setpoint has no threshold characteristic
      testCharacteristic: stub().returns(false),
      getCharacteristic: stub().returns(characteristic),
    };
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns(thermostatService),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 24,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Cooling setpoint',
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
    };

    await homekitHandler.sendState(accessory, feature, event);

    // a service exposing none of those characteristics is left untouched
    expect(updateCharacteristic.callCount).eql(0);
  });

  it('should notify an air conditioning mode change', async () => {
    const updateCharacteristic = stub().returns();
    const characteristic = { emit: stub().callsArgWith(1, undefined, 2) };
    const thermostatService = {
      updateCharacteristic,
      testCharacteristic: stub().returns(true),
      getCharacteristic: stub().returns(characteristic),
    };
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns(thermostatService),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 1,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Mode',
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0]).eql(['TARGETHEATINGCOOLINGSTATE', 2]);
    expect(updateCharacteristic.args[1]).eql(['CURRENTHEATINGCOOLINGSTATE', 2]);
    expect(updateCharacteristic.args[2]).eql(['TARGETTEMPERATURE', 2]);
  });

  it('should not push a thermostat characteristic whose read failed', async () => {
    const updateCharacteristic = stub().returns();
    const characteristic = { emit: stub().callsArgWith(1, new Error('read failed')) };
    const thermostatService = {
      updateCharacteristic,
      testCharacteristic: stub().returns(true),
      getCharacteristic: stub().returns(characteristic),
    };
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns(thermostatService),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 1,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Mode',
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.callCount).eql(0);
  });

  it('should notify an air conditioning power change', async () => {
    const updateCharacteristic = stub().returns();
    const characteristic = { emit: stub().callsArgWith(1, undefined, 0) };
    const thermostatService = {
      updateCharacteristic,
      testCharacteristic: stub().returns(true),
      getCharacteristic: stub().returns(characteristic),
    };
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns(thermostatService),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 0,
    };

    const feature = {
      id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Power',
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
    };

    await homekitHandler.sendState(accessory, feature, event);

    expect(updateCharacteristic.args[0]).eql(['TARGETHEATINGCOOLINGSTATE', 0]);
    expect(updateCharacteristic.args[1]).eql(['CURRENTHEATINGCOOLINGSTATE', 0]);
    expect(updateCharacteristic.args[2]).eql(['TARGETTEMPERATURE', 0]);
  });

  it('should clamp temperatures pushed to a thermostat', async () => {
    const updateCharacteristic = stub().returns();
    const service = {
      updateCharacteristic,
      testCharacteristic: stub().returns(true),
      getCharacteristic: stub().returns({
        props: { minValue: -270, maxValue: 100 },
        emit: (event, cb) => cb(undefined, 0),
      }),
    };
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns(service),
    };

    // a sensor glitching far outside the HomeKit bounds must be clamped, not thrown at HAP
    await homekitHandler.sendState(
      accessory,
      {
        id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
        device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
        name: 'Room temperature',
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      },
      { type: EVENTS.DEVICE.NEW_STATE, last_value: 5000 },
    );

    expect(updateCharacteristic.args[0]).eql(['CURRENTTEMPERATURE', 100]);
  });

  it('should do nothing wrong device category & type', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({
        updateCharacteristic,
        testCharacteristic: stub().returns(false),
        getCharacteristic: stub().returns({ props: { minValue: -270, maxValue: 100 } }),
      }),
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

  it('should warn when the type fallback cannot tell two services of the same type apart', async () => {
    const updateCharacteristic = stub().returns();
    // an accessory that was not built by buildAccessory: nothing is indexed, and it exposes two
    // Switch services, so getService can only return the first one
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      services: [{ UUID: 'switch-uuid' }, { UUID: 'switch-uuid' }],
      getService: stub().returns({ updateCharacteristic }),
    };
    homekitHandler.hap.Service.Switch = { UUID: 'switch-uuid' };
    const warn = stub(logger, 'warn');

    const feature = {
      selector: 'switch-2',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Switch 2',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };

    await homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 1 });
    warn.restore();
    delete homekitHandler.hap.Service.Switch;

    expect(warn.callCount).to.equal(1);
    expect(warn.args[0][0]).to.contain('switch-2');
    // the update is still sent, on the service getService returned
    expect(updateCharacteristic.args[0]).eql(['ON', 1]);
  });

  it('should not warn when the type fallback has a single service to choose from', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      services: [{ UUID: 'switch-uuid' }],
      getService: stub().returns({ updateCharacteristic }),
    };
    homekitHandler.hap.Service.Switch = { UUID: 'switch-uuid' };
    const warn = stub(logger, 'warn');

    const feature = {
      selector: 'switch-1',
      device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
      name: 'Switch 1',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };

    await homekitHandler.sendState(accessory, feature, { type: EVENTS.DEVICE.NEW_STATE, last_value: 1 });
    warn.restore();
    delete homekitHandler.hap.Service.Switch;

    expect(warn.callCount).to.equal(0);
    expect(updateCharacteristic.args[0]).eql(['ON', 1]);
  });
});
