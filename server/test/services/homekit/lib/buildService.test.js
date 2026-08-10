const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub } = sinon;
const { buildService } = require('../../../../services/homekit/lib/buildService');
const { mappings } = require('../../../../services/homekit/lib/deviceMappings');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  ACTIONS,
  ACTIONS_STATUS,
  DEVICE_FEATURE_UNITS,
  FAN_MODE,
  FAN_ROCK_SETTING,
  FAN_AIRFLOW_DIRECTION,
  LOCK,
  AC_MODE,
} = require('../../../../utils/constants');

// The Thermostat service binds many characteristics, so they are stubbed by name instead of by call
// order. Each stub records its GET/SET handlers so tests can trigger them directly.
const THERMOSTAT_CHARACTERISTIC_PROPS = {
  CurrentTemperature: { minValue: -270, maxValue: 100 },
  TargetTemperature: { minValue: 10, maxValue: 38 },
  HeatingThresholdTemperature: { minValue: 0, maxValue: 25 },
  CoolingThresholdTemperature: { minValue: 10, maxValue: 35 },
};

/**
 * @description Build a HomeKit stub exposing a Thermostat service.
 * @returns {object} An object holding the fake hap library and the stubbed characteristics.
 * @example
 * const { hap, characteristics } = buildThermostatHapStub();
 */
function buildThermostatHapStub() {
  const names = [
    'CurrentTemperature',
    'TargetTemperature',
    'CurrentHeatingCoolingState',
    'TargetHeatingCoolingState',
    'HeatingThresholdTemperature',
    'CoolingThresholdTemperature',
  ];

  const Characteristic = { TemperatureDisplayUnits: { name: 'TemperatureDisplayUnits', CELSIUS: 0 } };
  const characteristics = {
    TemperatureDisplayUnits: { handlers: {}, props: {}, setProps: stub() },
  };

  names.forEach((name) => {
    Characteristic[name] = { name };
    characteristics[name] = {
      handlers: {},
      props: THERMOSTAT_CHARACTERISTIC_PROPS[name] || {},
      setProps: stub(),
    };
  });

  Object.values(characteristics).forEach((characteristic) => {
    characteristic.on = (event, handler) => {
      characteristic.handlers[event] = handler;
      return characteristic;
    };
  });

  const updateCharacteristic = stub();
  const Thermostat = stub().returns({
    getCharacteristic: (type) => characteristics[type.name],
    updateCharacteristic,
  });

  return {
    characteristics,
    updateCharacteristic,
    hap: {
      Characteristic,
      CharacteristicEventTypes: { GET: 'get', SET: 'set' },
      Perms: { PAIRED_READ: 'PAIRED_READ', PAIRED_WRITE: 'PAIRED_WRITE' },
      Service: { Thermostat },
    },
  };
}

/**
 * @description Call the GET handler of a stubbed characteristic and return the value it reports.
 * @param {object} characteristic - Stubbed characteristic holding the handlers.
 * @returns {Promise} The value passed to the HomeKit callback.
 * @example
 * const value = await readCharacteristic(characteristics.TargetTemperature);
 */
async function readCharacteristic(characteristic) {
  let read;
  await characteristic.handlers.get((error, value) => {
    read = value;
  });
  return read;
}

describe('Build service', () => {
  const homekitHandler = {
    serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
    buildService,
    gladys: {
      device: {},
      event: {},
      stateManager: {
        get: stub(),
      },
    },
  };

  it('should build light service', async () => {
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'lampe-brightness').returns({
      id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
      name: 'Luminosité',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      last_value: 50,
    });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'lampe-color').returns({
      id: '81d2dc15-cb98-4235-96f4-5c12007b6ccd',
      name: 'Couleur',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
      last_value: 3500000,
    });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'lampe-temperature').returns({
      id: '77f26d98-49a5-4338-97c8-ab51fb5d2164',
      name: 'Température',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
      last_value: 255,
    });

    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const getCharacteristic = stub()
      .onCall(0)
      .returns({
        on,
        props: {
          perms: ['PAIRED_READ', 'PAIRED_WRITE'],
        },
      })
      .onCall(1)
      .returns({
        on,
        props: {
          minValue: 0,
          maxValue: 100,
          perms: ['PAIRED_READ', 'PAIRED_WRITE'],
        },
      })
      .onCall(2)
      .returns({
        on,
        props: {
          perms: ['PAIRED_READ', 'PAIRED_WRITE'],
        },
      })
      .onCall(3)
      .returns({
        on,
        props: {
          perms: ['PAIRED_READ', 'PAIRED_WRITE'],
        },
      })
      .onCall(4)
      .returns({
        on,
        props: {
          minValue: 140,
          maxValue: 500,
          perms: ['PAIRED_READ', 'PAIRED_WRITE'],
        },
      });
    const Lightbulb = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        On: 'ON',
        Brightness: 'BRIGHTNESS',
        Hue: 'HUE',
        Saturation: 'SATURATION',
        ColorTemperature: 'COLORTEMPERATURE',
      },
      CharacteristicEventTypes: stub(),
      Perms: {
        PAIRED_READ: 'PAIRED_READ',
        PAIRED_WRITE: 'PAIRED_WRITE',
      },
      Service: {
        Lightbulb,
      },
    };
    const device = {
      name: 'Lampe',
    };
    const features = [
      {
        name: 'onoff',
        selector: 'lampe-onoff',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      },
      {
        id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
        selector: 'lampe-brightness',
        name: 'Luminosité',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
        min: 0,
        max: 100,
      },
      {
        id: '81d2dc15-cb98-4235-96f4-5c12007b6ccd',
        selector: 'lampe-color',
        name: 'Couleur',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
      },
      {
        id: '77f26d98-49a5-4338-97c8-ab51fb5d2164',
        selector: 'lampe-temperature',
        name: 'Température',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
        min: 0,
        max: 255,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.LIGHT]);
    await on.args[2][1](cb);
    await on.args[3][1](90, cb);
    await on.args[4][1](cb);
    await on.args[5][1](300, cb);
    await on.args[6][1](cb);
    await on.args[7][1](5, cb);
    await on.args[8][1](cb);
    await on.args[9][1](140, cb);

    expect(Lightbulb.args[0][0]).to.equal('Lampe');
    expect(on.callCount).to.equal(10);
    expect(getCharacteristic.args[0][0]).to.equal('ON');
    expect(getCharacteristic.args[1][0]).to.equal('BRIGHTNESS');
    expect(getCharacteristic.args[2][0]).to.equal('HUE');
    expect(getCharacteristic.args[3][0]).to.equal('SATURATION');
    expect(getCharacteristic.args[4][0]).to.equal('COLORTEMPERATURE');
    expect(cb.args[0][1]).to.equal(50);
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 90,
      device: device.selector,
      device_feature: features[1].selector,
    });
    expect(cb.args[2][1]).to.equal(222);
    expect(homekitHandler.gladys.event.emit.args[1][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 14694112,
      device: device.selector,
      device_feature: features[2].selector,
    });
    expect(cb.args[4][1]).to.equal(76);
    expect(homekitHandler.gladys.event.emit.args[2][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 14014944,
      device: device.selector,
      device_feature: features[2].selector,
    });
    expect(cb.args[6][1]).to.equal(500);
    expect(homekitHandler.gladys.event.emit.args[3][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 0,
      device: device.selector,
      device_feature: features[3].selector,
    });
  });

  it('should build switch service', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({
      name: 'onoff',
      device_feature: 'lampe-onoff',
      last_value: 1,
    });
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: {
        perms: ['PAIRED_READ', 'PAIRED_WRITE'],
      },
    });
    const Switch = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        On: 'ON',
      },
      CharacteristicEventTypes: stub(),
      Perms: {
        PAIRED_READ: 'PAIRED_READ',
        PAIRED_WRITE: 'PAIRED_WRITE',
      },
      Service: {
        Switch,
      },
    };
    const device = {
      name: 'Commutateur',
      selector: 'commutateur',
    };
    const features = [
      {
        name: 'onoff',
        selector: 'switch-onoff',
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      },
    ];
    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.SWITCH]);
    await on.args[0][1](cb);
    await on.args[1][1](0, cb);

    expect(Switch.args[0][0]).to.equal('Commutateur');
    expect(on.callCount).to.equal(2);
    expect(getCharacteristic.args[0][0]).to.equal('ON');
    expect(cb.callCount).to.equal(2);
    expect(cb.args[0][1]).to.equal(1);
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 0,
      device: device.selector,
      device_feature: features[0].selector,
    });
  });

  it('should build current temperature service', async () => {
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'temp-celsius').returns({
      id: '26df6983-5127-4122-874a-b6ed0590badc',
      name: 'Température Celsius',
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      last_value: 15,
    });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'temp-kelvin').returns({
      id: '91ee488c-068b-4328-8563-e1e15678c5a1',
      name: 'Température Kelvin',
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.KELVIN,
      last_value: 293.15,
    });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'temp-fahrenheit').returns({
      id: '110eb9f0-a84d-40df-b0c6-05791fb2ec15',
      name: 'Température Fahrenheit',
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
      last_value: 77,
    });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
    });
    const TemperatureSensor = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        CurrentTemperature: 'CURRENTTEMPERATURE',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        TemperatureSensor,
      },
    };
    const device = {
      name: 'Capteur',
    };
    const features = [
      {
        id: '26df6983-5127-4122-874a-b6ed0590badc',
        name: 'Température Celsius',
        selector: 'temp-celsius',
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
      {
        id: '91ee488c-068b-4328-8563-e1e15678c5a1',
        name: 'Température Kelvin',
        selector: 'temp-kelvin',
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.KELVIN,
      },
      {
        id: '110eb9f0-a84d-40df-b0c6-05791fb2ec15',
        name: 'Température Fahrenheit',
        selector: 'temp-fahrenheit',
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
      },
    ];
    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]);
    await on.args[0][1](cb);
    await on.args[1][1](cb);
    await on.args[2][1](cb);

    expect(TemperatureSensor.args[0][0]).to.equal('Capteur');
    expect(on.callCount).to.equal(3);
    expect(getCharacteristic.args[0][0]).to.equal('CURRENTTEMPERATURE');
    expect(cb.args[0][1]).to.equal(15);
    expect(cb.args[1][1]).to.equal(20);
    expect(cb.args[2][1]).to.equal(25);
  });

  it('should build motion sensor service', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({
      id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
      name: 'Motion Detection',
      category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      last_value: 0,
    });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: {
        perms: ['PAIRED_READ'],
      },
    });
    const MotionSensor = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        MotionDetected: 'MOTIONDETECTED',
      },
      CharacteristicEventTypes: stub(),
      Perms: {
        PAIRED_READ: 'PAIRED_READ',
        PAIRED_WRITE: 'PAIRED_WRITE',
      },
      Service: {
        MotionSensor,
      },
    };
    const device = {
      name: 'Détecteur garage',
    };
    const features = [
      {
        id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
        name: 'Motion Detection',
        category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR]);
    await on.args[0][1](cb);

    expect(MotionSensor.args[0][0]).to.equal('Détecteur garage');
    expect(on.callCount).to.equal(1);
    expect(getCharacteristic.args[0][0]).to.equal('MOTIONDETECTED');
    expect(cb.args[0][1]).to.equal(0);
  });

  it('should build stateless programmable switch service', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    const on = stub();
    const getCharacteristic = stub().returns({ on, props: {} });
    const StatelessProgrammableSwitch = stub().returns({ getCharacteristic });

    homekitHandler.hap = {
      Characteristic: { ProgrammableSwitchEvent: 'PROGRAMMABLESWITCHEVENT' },
      CharacteristicEventTypes: stub(),
      Service: { StatelessProgrammableSwitch },
    };
    const features = [
      {
        name: 'Clic',
        selector: 'bouton-clic',
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
      },
      {
        name: 'Appui',
        selector: 'bouton-appui',
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.PUSH,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService({ name: 'Télécommande' }, features, mappings[DEVICE_FEATURE_CATEGORIES.BUTTON]);
    await on.args[0][1](cb);
    await on.args[1][1](cb);

    expect(StatelessProgrammableSwitch.args[0][0]).to.equal('Télécommande');
    expect(getCharacteristic.args[0][0]).to.equal('PROGRAMMABLESWITCHEVENT');
    // a stateless switch reports no state
    expect(cb.args[0][1]).to.equal(null);
    expect(cb.args[1][1]).to.equal(null);
  });

  it('should not debounce button presses', async () => {
    expect(
      mappings[DEVICE_FEATURE_CATEGORIES.BUTTON].capabilities[DEVICE_FEATURE_TYPES.BUTTON.CLICK].notifDelay,
    ).to.equal(0);
    expect(
      mappings[DEVICE_FEATURE_CATEGORIES.BUTTON].capabilities[DEVICE_FEATURE_TYPES.BUTTON.PUSH].notifDelay,
    ).to.equal(0);
  });

  it('should build contact sensor service', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({
      id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
      name: "Porte d'entrée",
      category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      last_value: 0,
    });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
    });
    const ContactSensor = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        ContactSensorState: 'CONTACTSENSORSTATE',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        ContactSensor,
      },
    };
    const device = {
      name: "Porte d'entrée",
    };
    const features = [
      {
        id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
        name: 'Capteur ouverture',
        category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]);
    await on.args[0][1](cb);

    expect(ContactSensor.args[0][0]).to.equal("Porte d'entrée");
    expect(on.callCount).to.equal(1);
    expect(getCharacteristic.args[0][0]).to.equal('CONTACTSENSORSTATE');
    expect(cb.args[0][1]).to.equal(1);
  });

  it('should build light sensor service', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'capteur-luminosite')
      .returns({ last_value: 150000 });
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'capteur-luminosite-entier')
      .returns({ last_value: 300 });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: {
        minValue: 0.0001,
        maxValue: 100000,
      },
    });
    const LightSensor = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        CurrentAmbientLightLevel: 'CURRENTAMBIENTLIGHTLEVEL',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        LightSensor,
      },
    };
    const device = {
      name: 'Capteur luminosité',
    };
    // integrations report the illuminance either as a decimal or as an integer
    const features = [
      {
        id: '2d5b1e13-9ee7-4a02-9b28-2df9f1e63bd6',
        name: 'Luminosité',
        selector: 'capteur-luminosite',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.LUX,
        min: 0,
        max: 100000,
      },
      {
        id: 'f0a2c6f7-4a6d-4d3c-9f6a-0f0d5ac2b6a1',
        name: 'Luminosité entière',
        selector: 'capteur-luminosite-entier',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        unit: DEVICE_FEATURE_UNITS.LUX,
        min: 0,
        max: 100000,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR]);
    await on.args[0][1](cb);
    await on.args[1][1](cb);

    expect(LightSensor.args[0][0]).to.equal('Capteur luminosité');
    expect(on.callCount).to.equal(2);
    expect(getCharacteristic.args[0][0]).to.equal('CURRENTAMBIENTLIGHTLEVEL');
    expect(getCharacteristic.args[1][0]).to.equal('CURRENTAMBIENTLIGHTLEVEL');
    // the raw value is in lux, it's only clamped to the HomeKit bounds, never rescaled
    expect(cb.args[0][1]).to.equal(100000);
    expect(cb.args[1][1]).to.equal(300);
  });

  it('should build carbon dioxide sensor service', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({
      id: 'a5cf8ff5-1ff3-4a3a-9a29-6d0a5be3f9d6',
      name: 'CO2',
      category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.PPM,
      last_value: 1200,
    });
    const on = stub();
    const getCharacteristic = stub()
      .onCall(0)
      .returns({
        on,
        props: {
          minValue: 0,
          maxValue: 100000,
        },
      })
      .onCall(1)
      .returns({
        on,
        props: {
          minValue: 0,
          maxValue: 1,
        },
      });
    const CarbonDioxideSensor = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        CarbonDioxideLevel: 'CARBONDIOXIDELEVEL',
        CarbonDioxideDetected: 'CARBONDIOXIDEDETECTED',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        CarbonDioxideSensor,
      },
    };
    const device = {
      name: 'Capteur CO2',
    };
    const features = [
      {
        id: 'a5cf8ff5-1ff3-4a3a-9a29-6d0a5be3f9d6',
        name: 'CO2',
        selector: 'capteur-co2',
        category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PPM,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]);
    await on.args[0][1](cb);
    await on.args[1][1](cb);

    expect(CarbonDioxideSensor.args[0][0]).to.equal('Capteur CO2');
    expect(on.callCount).to.equal(2);
    expect(getCharacteristic.args[0][0]).to.equal('CARBONDIOXIDELEVEL');
    expect(getCharacteristic.args[1][0]).to.equal('CARBONDIOXIDEDETECTED');
    expect(cb.args[0][1]).to.equal(1200);
    // 1200 ppm is above the 1000 ppm threshold
    expect(cb.args[1][1]).to.equal(1);
  });

  it('should build carbon monoxide sensor service from a concentration', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'co-decimal').returns({ last_value: 40 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'co-integer').returns({ last_value: 10 });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: {
        minValue: 0,
        maxValue: 100,
      },
    });
    const CarbonMonoxideSensor = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        CarbonMonoxideLevel: 'CARBONMONOXIDELEVEL',
        CarbonMonoxideDetected: 'CARBONMONOXIDEDETECTED',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        CarbonMonoxideSensor,
      },
    };
    const device = {
      name: 'Détecteur CO',
    };
    // integrations report the concentration either as a decimal or as an integer
    const features = [
      {
        name: 'CO decimal',
        selector: 'co-decimal',
        category: DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PPM,
      },
      {
        name: 'CO integer',
        selector: 'co-integer',
        category: DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        unit: DEVICE_FEATURE_UNITS.PPM,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.CO_SENSOR]);
    await on.args[0][1](cb);
    await on.args[1][1](cb);
    await on.args[2][1](cb);
    await on.args[3][1](cb);

    expect(cb.args[0][1]).to.equal(40);
    // 40 ppm is above the 25 ppm threshold
    expect(cb.args[1][1]).to.equal(1);
    expect(cb.args[2][1]).to.equal(10);
    // 10 ppm is not
    expect(cb.args[3][1]).to.equal(0);
  });

  it('should build carbon monoxide sensor service from a binary feature', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({
      id: '3d0f4a08-05a3-4a2f-8f4d-7bbd2a6d54c2',
      name: 'CO',
      category: DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      last_value: 1,
    });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: {
        perms: ['PAIRED_READ'],
      },
    });
    const CarbonMonoxideSensor = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        CarbonMonoxideDetected: 'CARBONMONOXIDEDETECTED',
      },
      CharacteristicEventTypes: stub(),
      Perms: {
        PAIRED_READ: 'PAIRED_READ',
        PAIRED_WRITE: 'PAIRED_WRITE',
      },
      Service: {
        CarbonMonoxideSensor,
      },
    };
    const device = {
      name: 'Détecteur CO',
    };
    const features = [
      {
        id: '3d0f4a08-05a3-4a2f-8f4d-7bbd2a6d54c2',
        name: 'CO',
        selector: 'detecteur-co',
        category: DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.CO_SENSOR]);
    await on.args[0][1](cb);

    expect(CarbonMonoxideSensor.args[0][0]).to.equal('Détecteur CO');
    expect(on.callCount).to.equal(1);
    expect(getCharacteristic.args[0][0]).to.equal('CARBONMONOXIDEDETECTED');
    expect(cb.args[0][1]).to.equal(1);
  });

  it('should build carbon dioxide sensor service from a binary feature', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({
      id: '8b2b0d47-3a4e-4d0f-9c5b-2f6a1d3e7c90',
      name: 'CO2',
      category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      last_value: 1,
    });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: {
        perms: ['PAIRED_READ'],
      },
    });
    const CarbonDioxideSensor = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        CarbonDioxideDetected: 'CARBONDIOXIDEDETECTED',
      },
      CharacteristicEventTypes: stub(),
      Perms: {
        PAIRED_READ: 'PAIRED_READ',
        PAIRED_WRITE: 'PAIRED_WRITE',
      },
      Service: {
        CarbonDioxideSensor,
      },
    };
    const device = {
      name: 'Détecteur CO2',
    };
    const features = [
      {
        id: '8b2b0d47-3a4e-4d0f-9c5b-2f6a1d3e7c90',
        name: 'CO2',
        selector: 'detecteur-co2',
        category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]);
    await on.args[0][1](cb);

    expect(CarbonDioxideSensor.args[0][0]).to.equal('Détecteur CO2');
    expect(on.callCount).to.equal(1);
    expect(getCharacteristic.args[0][0]).to.equal('CARBONDIOXIDEDETECTED');
    expect(cb.args[0][1]).to.equal(1);
  });

  it('should report a gas as detected at the exact threshold', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'co-seuil').returns({ last_value: 25 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'co2-seuil').returns({ last_value: 1000 });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: {
        minValue: 0,
        maxValue: 100000,
      },
    });
    const CarbonMonoxideSensor = stub().returns({ getCharacteristic });
    const CarbonDioxideSensor = stub().returns({ getCharacteristic });

    homekitHandler.hap = {
      Characteristic: {
        CarbonMonoxideLevel: 'CARBONMONOXIDELEVEL',
        CarbonMonoxideDetected: 'CARBONMONOXIDEDETECTED',
        CarbonDioxideLevel: 'CARBONDIOXIDELEVEL',
        CarbonDioxideDetected: 'CARBONDIOXIDEDETECTED',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        CarbonMonoxideSensor,
        CarbonDioxideSensor,
      },
    };

    const cb = stub();

    await homekitHandler.buildService(
      { name: 'Détecteur CO' },
      [
        {
          name: 'CO',
          selector: 'co-seuil',
          category: DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
          unit: DEVICE_FEATURE_UNITS.PPM,
        },
      ],
      mappings[DEVICE_FEATURE_CATEGORIES.CO_SENSOR],
    );
    await homekitHandler.buildService(
      { name: 'Détecteur CO2' },
      [
        {
          name: 'CO2',
          selector: 'co2-seuil',
          category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
          unit: DEVICE_FEATURE_UNITS.PPM,
        },
      ],
      mappings[DEVICE_FEATURE_CATEGORIES.CO2_SENSOR],
    );
    await on.args[1][1](cb);
    await on.args[3][1](cb);

    // the comparison is inclusive: sitting exactly on the alarm level is alarming, not safe
    expect(cb.args[0][1]).to.equal(1);
    expect(cb.args[1][1]).to.equal(1);
  });

  it('should build battery service and derive the low flag from the level', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'batterie').returns({ last_value: 15 });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: { minValue: 0, maxValue: 100 },
    });
    const Battery = stub().returns({ getCharacteristic });

    homekitHandler.hap = {
      Characteristic: { BatteryLevel: 'BATTERYLEVEL', StatusLowBattery: 'STATUSLOWBATTERY' },
      CharacteristicEventTypes: stub(),
      Service: { Battery },
    };
    const features = [
      {
        name: 'Batterie',
        selector: 'batterie',
        category: DEVICE_FEATURE_CATEGORIES.BATTERY,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService({ name: 'Capteur' }, features, mappings[DEVICE_FEATURE_CATEGORIES.BATTERY]);
    await on.args[0][1](cb);
    await on.args[1][1](cb);

    expect(getCharacteristic.args[0][0]).to.equal('BATTERYLEVEL');
    expect(getCharacteristic.args[1][0]).to.equal('STATUSLOWBATTERY');
    expect(cb.args[0][1]).to.equal(15);
    // 15% is at or below the 20% threshold
    expect(cb.args[1][1]).to.equal(1);

    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'batterie').returns({ last_value: 80 });
    await on.args[1][1](cb);
    expect(cb.args[2][1]).to.equal(0);

    // the comparison is inclusive: exactly 20% is low, 21% is not
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'batterie').returns({ last_value: 20 });
    await on.args[1][1](cb);
    expect(cb.args[3][1]).to.equal(1);
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'batterie').returns({ last_value: 21 });
    await on.args[1][1](cb);
    expect(cb.args[4][1]).to.equal(0);

    // a device that has not reported yet must not be announced as low: null <= 20 is true in JS
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'batterie').returns({ last_value: null });
    await on.args[1][1](cb);
    expect(cb.args[5][1]).to.equal(0);
  });

  it('should let a dedicated low battery feature win over the derived flag', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'nuki-batterie').returns({ last_value: 5 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'nuki-faible').returns({ last_value: 0 });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: { minValue: 0, maxValue: 100 },
    });
    const Battery = stub().returns({ getCharacteristic });

    homekitHandler.hap = {
      Characteristic: { BatteryLevel: 'BATTERYLEVEL', StatusLowBattery: 'STATUSLOWBATTERY' },
      CharacteristicEventTypes: stub(),
      Service: { Battery },
    };
    // Nuki reports its battery percentage as a lock integer, not a sensor integer
    const features = [
      {
        name: 'Batterie',
        selector: 'nuki-batterie',
        category: DEVICE_FEATURE_CATEGORIES.BATTERY,
        type: DEVICE_FEATURE_TYPES.LOCK.INTEGER,
      },
      {
        name: 'Batterie faible',
        selector: 'nuki-faible',
        category: DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
        type: DEVICE_FEATURE_TYPES.BATTERY_LOW.BINARY,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService({ name: 'Serrure' }, features, mappings[DEVICE_FEATURE_CATEGORIES.BATTERY]);
    await on.args[0][1](cb);
    await on.args[1][1](cb);

    // the level alone would say low at 5%, the dedicated feature says it is not
    expect(on.callCount).to.equal(2);
    expect(cb.args[0][1]).to.equal(5);
    expect(cb.args[1][1]).to.equal(0);
  });

  it('should not claim a battery level for a device that only reports a low flag', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'contact-faible').returns({ last_value: 1 });
    const on = stub();
    const getCharacteristic = stub().returns({ on, props: { minValue: 0, maxValue: 100 } });
    const Battery = stub().returns({ getCharacteristic });

    homekitHandler.hap = {
      Characteristic: { BatteryLevel: 'BATTERYLEVEL', StatusLowBattery: 'STATUSLOWBATTERY' },
      CharacteristicEventTypes: stub(),
      Service: { Battery },
    };
    const features = [
      {
        name: 'Batterie faible',
        selector: 'contact-faible',
        category: DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
        type: DEVICE_FEATURE_TYPES.BATTERY_LOW.BINARY,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService({ name: 'Contact' }, features, mappings[DEVICE_FEATURE_CATEGORIES.BATTERY_LOW]);
    await on.args[0][1](cb);

    // BatteryLevel is optional on the HAP Battery service, so it is never added and the Home app
    // does not show a made-up 0%. Only the flag the device actually reports is exposed.
    expect(getCharacteristic.args).eql([['STATUSLOWBATTERY']]);
    expect(cb.args[0][1]).to.equal(1);
  });

  it('should build smoke sensor service', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({
      id: '5c1d3f2a-7b8e-4c9d-a0f1-2e3b4c5d6e7f',
      name: 'Fumée',
      category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      last_value: 1,
    });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: {
        perms: ['PAIRED_READ'],
      },
    });
    const SmokeSensor = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        SmokeDetected: 'SMOKEDETECTED',
      },
      CharacteristicEventTypes: stub(),
      Perms: {
        PAIRED_READ: 'PAIRED_READ',
        PAIRED_WRITE: 'PAIRED_WRITE',
      },
      Service: {
        SmokeSensor,
      },
    };
    const device = {
      name: 'Détecteur de fumée',
    };
    const features = [
      {
        id: '5c1d3f2a-7b8e-4c9d-a0f1-2e3b4c5d6e7f',
        name: 'Fumée',
        selector: 'detecteur-fumee',
        category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR]);
    await on.args[0][1](cb);

    expect(SmokeSensor.args[0][0]).to.equal('Détecteur de fumée');
    expect(on.callCount).to.equal(1);
    expect(getCharacteristic.args[0][0]).to.equal('SMOKEDETECTED');
    expect(cb.args[0][1]).to.equal(1);
  });

  it('should build air quality sensor service', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({
      id: 'ec9de6a2-6f0a-4f0e-9d0e-1b5f1cb0a5ce',
      name: 'Qualité air',
      category: DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.AIRQUALITY_SENSOR.AQI,
      last_value: 75,
    });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: {
        minValue: 0,
        maxValue: 5,
      },
    });
    const AirQualitySensor = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        AirQuality: 'AIRQUALITY',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        AirQualitySensor,
      },
    };
    const device = {
      name: 'Capteur qualité air',
    };
    const features = [
      {
        id: 'ec9de6a2-6f0a-4f0e-9d0e-1b5f1cb0a5ce',
        name: 'Qualité air',
        selector: 'capteur-aqi',
        category: DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR,
        type: DEVICE_FEATURE_TYPES.AIRQUALITY_SENSOR.AQI,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR]);
    // an AQI of 75 is in the "good" band
    await on.args[0][1](cb);
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: 20 });
    await on.args[0][1](cb);
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: 350 });
    await on.args[0][1](cb);
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: null });
    await on.args[0][1](cb);

    expect(AirQualitySensor.args[0][0]).to.equal('Capteur qualité air');
    expect(on.callCount).to.equal(1);
    expect(getCharacteristic.args[0][0]).to.equal('AIRQUALITY');
    expect(cb.args[0][1]).to.equal(2);
    expect(cb.args[1][1]).to.equal(1);
    expect(cb.args[2][1]).to.equal(5);
    expect(cb.args[3][1]).to.equal(0);
  });

  it('should build siren service', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({
      id: '8c1a2b3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d',
      name: 'Alarme',
      category: DEVICE_FEATURE_CATEGORIES.SIREN,
      type: DEVICE_FEATURE_TYPES.SIREN.BINARY,
      last_value: 0,
    });
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: {
        perms: ['PAIRED_READ', 'PAIRED_WRITE'],
      },
    });
    const Switch = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        On: 'ON',
      },
      CharacteristicEventTypes: stub(),
      Perms: {
        PAIRED_READ: 'PAIRED_READ',
        PAIRED_WRITE: 'PAIRED_WRITE',
      },
      Service: {
        Switch,
      },
    };
    const device = {
      name: 'Sirène',
      selector: 'sirene',
    };
    const features = [
      {
        id: '8c1a2b3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d',
        name: 'Alarme',
        selector: 'sirene-alarme',
        category: DEVICE_FEATURE_CATEGORIES.SIREN,
        type: DEVICE_FEATURE_TYPES.SIREN.BINARY,
      },
    ];
    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.SIREN]);
    await on.args[0][1](cb);
    await on.args[1][1](1, cb);

    expect(Switch.args[0][0]).to.equal('Sirène');
    expect(on.callCount).to.equal(2);
    expect(getCharacteristic.args[0][0]).to.equal('ON');
    expect(cb.args[0][1]).to.equal(0);
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 1,
      device: device.selector,
      device_feature: features[0].selector,
    });
  });

  it('should build particulate density characteristics on the air quality service', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'pm25-microgram').returns({ last_value: 42 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'pm25-milligram').returns({ last_value: 0.05 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'pm10-nanogram').returns({ last_value: 8000 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'pm10-sans-unite').returns({ last_value: 5000 });
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
      props: {
        minValue: 0,
        maxValue: 1000,
      },
    });
    const AirQualitySensor = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        PM2_5Density: 'PM25DENSITY',
        PM10Density: 'PM10DENSITY',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        AirQualitySensor,
      },
    };
    const device = {
      name: 'Capteur particules',
    };
    // integrations report densities in milligrams, micrograms or nanograms per cubic meter
    const features = [
      {
        name: 'PM2.5 µg',
        selector: 'pm25-microgram',
        category: DEVICE_FEATURE_CATEGORIES.PM25_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER,
      },
      {
        name: 'PM2.5 mg',
        selector: 'pm25-milligram',
        category: DEVICE_FEATURE_CATEGORIES.PM25_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.MILLIGRAM_PER_CUBIC_METER,
      },
      {
        name: 'PM10 ng',
        selector: 'pm10-nanogram',
        category: DEVICE_FEATURE_CATEGORIES.PM10_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        unit: DEVICE_FEATURE_UNITS.NANOGRAM_PER_CUBIC_METER,
      },
      {
        name: 'PM10 sans unité',
        selector: 'pm10-sans-unite',
        category: DEVICE_FEATURE_CATEGORIES.PM10_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR]);
    await on.args[0][1](cb);
    await on.args[1][1](cb);
    await on.args[2][1](cb);
    await on.args[3][1](cb);

    expect(on.callCount).to.equal(4);
    expect(getCharacteristic.args[0][0]).to.equal('PM25DENSITY');
    expect(getCharacteristic.args[2][0]).to.equal('PM10DENSITY');
    // already in µg/m³
    expect(cb.args[0][1]).to.equal(42);
    // 0.05 mg/m³ is 50 µg/m³
    expect(cb.args[1][1]).to.equal(50);
    // 8000 ng/m³ is 8 µg/m³
    expect(cb.args[2][1]).to.equal(8);
    // no unit declared, the value is taken as µg/m³ and only clamped
    expect(cb.args[3][1]).to.equal(1000);
  });

  it('should build lock service', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'serrure-button').returns({
      id: 'b3f4e0f5-8f5e-4b0e-9d3a-3f7c8b1d2e4a',
      name: 'Verrouillage',
      category: DEVICE_FEATURE_CATEGORIES.LOCK,
      type: DEVICE_FEATURE_TYPES.LOCK.BINARY,
      last_value: 0,
    });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'serrure-state').returns({
      id: 'd4a1c2b3-7e6f-4a5b-8c9d-0e1f2a3b4c5d',
      name: 'État',
      category: DEVICE_FEATURE_CATEGORIES.LOCK,
      type: DEVICE_FEATURE_TYPES.LOCK.STATE,
      last_value: LOCK.STATE.ACTIVITY,
    });
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const updateCharacteristic = stub();
    const getCharacteristic = stub().returns({ on });
    const LockMechanism = stub().returns({
      getCharacteristic,
      updateCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        LockCurrentState: 'LOCKCURRENTSTATE',
        LockTargetState: 'LOCKTARGETSTATE',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        LockMechanism,
      },
    };
    const device = {
      name: 'Serrure',
      selector: 'serrure',
    };
    const features = [
      {
        id: 'b3f4e0f5-8f5e-4b0e-9d3a-3f7c8b1d2e4a',
        name: 'Verrouillage',
        selector: 'serrure-button',
        category: DEVICE_FEATURE_CATEGORIES.LOCK,
        type: DEVICE_FEATURE_TYPES.LOCK.BINARY,
      },
      {
        id: 'd4a1c2b3-7e6f-4a5b-8c9d-0e1f2a3b4c5d',
        name: 'État',
        selector: 'serrure-state',
        category: DEVICE_FEATURE_CATEGORIES.LOCK,
        type: DEVICE_FEATURE_TYPES.LOCK.STATE,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.LOCK]);
    await on.args[0][1](cb);
    await on.args[1][1](1, cb);
    await on.args[2][1](cb);

    expect(LockMechanism.args[0][0]).to.equal('Serrure');
    expect(on.callCount).to.equal(3);
    expect(getCharacteristic.args[0][0]).to.equal('LOCKTARGETSTATE');
    expect(getCharacteristic.args[1][0]).to.equal('LOCKCURRENTSTATE');
    expect(cb.args[0][1]).to.equal(0);
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: LOCK.ACTION.LOCK,
      device: device.selector,
      device_feature: features[0].selector,
    });
    // the state feature is the source of truth, no optimistic update of the current state
    expect(updateCharacteristic.callCount).to.equal(0);
    // a lock in motion has no HomeKit equivalent, it's reported as unknown
    expect(cb.args[2][1]).to.equal(3);
  });

  it('should build lock service without state feature', async () => {
    const buttonState = {
      id: 'b3f4e0f5-8f5e-4b0e-9d3a-3f7c8b1d2e4a',
      name: 'Verrouillage',
      category: DEVICE_FEATURE_CATEGORIES.LOCK,
      type: DEVICE_FEATURE_TYPES.LOCK.BINARY,
      last_value: 1,
    };
    homekitHandler.gladys.stateManager.get = stub().returns(buttonState);
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const updateCharacteristic = stub();
    const getCharacteristic = stub().returns({ on });
    const LockMechanism = stub().returns({
      getCharacteristic,
      updateCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        LockCurrentState: 'LOCKCURRENTSTATE',
        LockTargetState: 'LOCKTARGETSTATE',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        LockMechanism,
      },
    };
    const device = {
      name: 'Serrure',
      selector: 'serrure',
    };
    const features = [
      {
        id: 'b3f4e0f5-8f5e-4b0e-9d3a-3f7c8b1d2e4a',
        name: 'Verrouillage',
        selector: 'serrure-button',
        category: DEVICE_FEATURE_CATEGORIES.LOCK,
        type: DEVICE_FEATURE_TYPES.LOCK.BINARY,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.LOCK]);
    await on.args[0][1](cb);
    await on.args[1][1](0, cb);
    await on.args[2][1](cb);

    expect(on.callCount).to.equal(3);
    expect(getCharacteristic.args[0][0]).to.equal('LOCKTARGETSTATE');
    expect(getCharacteristic.args[1][0]).to.equal('LOCKCURRENTSTATE');
    expect(cb.args[0][1]).to.equal(1);
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: LOCK.ACTION.UNLOCK,
      device: device.selector,
      device_feature: features[0].selector,
    });
    // no state feature, so the command optimistically drives the current state
    expect(updateCharacteristic.args[0]).to.eql(['LOCKCURRENTSTATE', 0]);
    // and a read landing before the device reports back answers the command, not the old position
    expect(cb.args[2][1]).to.equal(0);

    // as soon as the device reports the new position, the optimistic value steps aside
    buttonState.last_value = 0;
    await on.args[2][1](cb);
    expect(cb.args[3][1]).to.equal(0);

    // and the other way round: locking again drives it back to secured
    await on.args[1][1](1, cb);
    await on.args[0][1](cb);
    await on.args[2][1](cb);

    expect(updateCharacteristic.args[1]).to.eql(['LOCKCURRENTSTATE', 1]);
    expect(cb.args[5][1]).to.equal(1);
    expect(cb.args[6][1]).to.equal(1);
  });

  it('should build lock service without command feature', async () => {
    const lockState = { last_value: LOCK.STATE.LOCKED };
    homekitHandler.gladys.stateManager.get = stub().returns(lockState);
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const updateCharacteristic = stub();
    const setProps = stub();
    const getCharacteristic = stub().returns({
      on,
      setProps,
      props: { perms: ['PAIRED_READ', 'PAIRED_WRITE', 'EVENTS'] },
    });
    const LockMechanism = stub().returns({
      getCharacteristic,
      updateCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        LockCurrentState: 'LOCKCURRENTSTATE',
        LockTargetState: 'LOCKTARGETSTATE',
      },
      CharacteristicEventTypes: stub(),
      Perms: { PAIRED_READ: 'PAIRED_READ', PAIRED_WRITE: 'PAIRED_WRITE' },
      Service: {
        LockMechanism,
      },
    };
    const device = {
      name: 'Serrure',
      selector: 'serrure',
    };
    const features = [
      {
        id: 'd4a1c2b3-7e6f-4a5b-8c9d-0e1f2a3b4c5d',
        name: 'État',
        selector: 'serrure-state',
        category: DEVICE_FEATURE_CATEGORIES.LOCK,
        type: DEVICE_FEATURE_TYPES.LOCK.STATE,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.LOCK]);
    await on.args[0][1](cb);
    await on.args[1][1](cb);
    // HomeKit still requires a target state on a lock Gladys can only read
    lockState.last_value = LOCK.STATE.UNLOCKED;
    await on.args[1][1](cb);

    expect(on.callCount).to.equal(2);
    expect(getCharacteristic.args[0][0]).to.equal('LOCKCURRENTSTATE');
    // nothing to write to, so the Home app must show a read-only accessory rather than accept a
    // lock command that silently does nothing
    expect(setProps.args[0][0].perms).to.not.include('PAIRED_WRITE');
    expect(getCharacteristic.args[1][0]).to.equal('LOCKTARGETSTATE');
    expect(cb.args[0][1]).to.equal(1);
    expect(cb.args[1][1]).to.equal(1);
    expect(cb.args[2][1]).to.equal(0);
    // nothing to command, so no action is ever emitted
    expect(homekitHandler.gladys.event.emit.callCount).to.equal(0);
  });

  it('should build fan service', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'ventilateur-mode')
      .returns({ last_value: FAN_MODE.MEDIUM });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'ventilateur-percent').returns({ last_value: 40 });
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'ventilateur-rock')
      .returns({ last_value: FAN_ROCK_SETTING.OFF });
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'ventilateur-airflow')
      .returns({ last_value: FAN_AIRFLOW_DIRECTION.REVERSE });
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const getCharacteristic = stub()
      .returns({ on })
      .onCall(1)
      .returns({
        on,
        props: {
          minValue: 0,
          maxValue: 100,
        },
      });
    const Fanv2 = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        Active: 'ACTIVE',
        RotationSpeed: 'ROTATIONSPEED',
        SwingMode: 'SWINGMODE',
        RotationDirection: 'ROTATIONDIRECTION',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        Fanv2,
      },
    };
    const device = {
      name: 'Ventilateur',
      selector: 'ventilateur',
    };
    const features = [
      {
        name: 'Mode',
        selector: 'ventilateur-mode',
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.MODE,
        min: FAN_MODE.OFF,
        max: FAN_MODE.AUTO,
      },
      {
        name: 'Vitesse %',
        selector: 'ventilateur-percent',
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.PERCENT,
        min: 0,
        max: 100,
      },
      {
        name: 'Vitesse',
        selector: 'ventilateur-speed',
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.SPEED,
        min: 0,
        max: 10,
      },
      {
        name: 'Oscillation',
        selector: 'ventilateur-rock',
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING,
        min: FAN_ROCK_SETTING.OFF,
        max: FAN_ROCK_SETTING.LEFT_RIGHT_AND_UP_DOWN,
      },
      {
        name: 'Direction',
        selector: 'ventilateur-airflow',
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.AIRFLOW_DIRECTION,
        min: FAN_AIRFLOW_DIRECTION.FORWARD,
        max: FAN_AIRFLOW_DIRECTION.REVERSE,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.FAN]);
    await on.args[0][1](cb);
    await on.args[1][1](0, cb);
    await on.args[2][1](cb);
    await on.args[3][1](60, cb);
    await on.args[4][1](cb);
    await on.args[5][1](1, cb);
    await on.args[6][1](cb);
    await on.args[7][1](0, cb);

    expect(Fanv2.args[0][0]).to.equal('Ventilateur');
    // the raw speed feature is ignored, the percentage already drives RotationSpeed
    expect(getCharacteristic.callCount).to.equal(4);
    expect(on.callCount).to.equal(8);
    expect(getCharacteristic.args[0][0]).to.equal('ACTIVE');
    expect(getCharacteristic.args[1][0]).to.equal('ROTATIONSPEED');
    expect(getCharacteristic.args[2][0]).to.equal('SWINGMODE');
    expect(getCharacteristic.args[3][0]).to.equal('ROTATIONDIRECTION');
    expect(cb.args[0][1]).to.equal(1);
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: FAN_MODE.OFF,
      device: device.selector,
      device_feature: features[0].selector,
    });
    expect(cb.args[2][1]).to.equal(40);
    expect(homekitHandler.gladys.event.emit.args[1][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 60,
      device: device.selector,
      device_feature: features[1].selector,
    });
    expect(cb.args[4][1]).to.equal(0);
    // enabling oscillation uses every axis the device supports
    expect(homekitHandler.gladys.event.emit.args[2][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: FAN_ROCK_SETTING.LEFT_RIGHT_AND_UP_DOWN,
      device: device.selector,
      device_feature: features[3].selector,
    });
    expect(cb.args[6][1]).to.equal(1);
    expect(homekitHandler.gladys.event.emit.args[3][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: FAN_AIRFLOW_DIRECTION.FORWARD,
      device: device.selector,
      device_feature: features[4].selector,
    });

    // same characteristics read and written the other way round
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'ventilateur-mode')
      .returns({ last_value: FAN_MODE.OFF });
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'ventilateur-rock')
      .returns({ last_value: FAN_ROCK_SETTING.UP_DOWN });
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'ventilateur-airflow')
      .returns({ last_value: FAN_AIRFLOW_DIRECTION.FORWARD });

    await on.args[0][1](cb);
    await on.args[4][1](cb);
    await on.args[5][1](0, cb);
    await on.args[6][1](cb);
    await on.args[7][1](1, cb);

    expect(cb.args[8][1]).to.equal(0);
    expect(cb.args[9][1]).to.equal(1);
    expect(homekitHandler.gladys.event.emit.args[4][1].value).to.equal(FAN_ROCK_SETTING.OFF);
    expect(cb.args[11][1]).to.equal(0);
    expect(homekitHandler.gladys.event.emit.args[5][1].value).to.equal(FAN_AIRFLOW_DIRECTION.REVERSE);
  });

  it('should fall back to sane defaults when the fan declares no bounds', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: 0 });
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const getCharacteristic = stub().returns({ on });
    const Fanv2 = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        Active: 'ACTIVE',
        SwingMode: 'SWINGMODE',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        Fanv2,
      },
    };
    const device = {
      name: 'Ventilateur',
      selector: 'ventilateur',
    };
    // neither feature declares a max
    const features = [
      {
        name: 'Mode',
        selector: 'ventilateur-mode',
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.MODE,
      },
      {
        name: 'Oscillation',
        selector: 'ventilateur-rock',
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.FAN]);
    // the fan is off, turning it on falls back to the highest standard mode
    await on.args[1][1](1, cb);
    // no supported axis bitmap, oscillation falls back to left/right
    await on.args[3][1](1, cb);

    expect(homekitHandler.gladys.event.emit.args[0][1].value).to.equal(FAN_MODE.HIGH);
    expect(homekitHandler.gladys.event.emit.args[1][1].value).to.equal(FAN_ROCK_SETTING.LEFT_RIGHT);
  });

  it('should restore the last fan mode when switched back on', async () => {
    const modeState = { last_value: FAN_MODE.LOW };
    homekitHandler.gladys.stateManager.get = stub().returns(modeState);
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const getCharacteristic = stub().returns({ on });
    const Fanv2 = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        Active: 'ACTIVE',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        Fanv2,
      },
    };
    const device = {
      name: 'Ventilateur',
      selector: 'ventilateur',
    };
    const features = [
      {
        name: 'Mode',
        selector: 'ventilateur-mode',
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.MODE,
        min: FAN_MODE.OFF,
        max: FAN_MODE.AUTO,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.FAN]);
    // the fan is running in LOW, then HomeKit turns it off and back on
    await on.args[0][1](cb);
    modeState.last_value = FAN_MODE.OFF;
    await on.args[1][1](1, cb);

    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: FAN_MODE.LOW,
      device: device.selector,
      device_feature: features[0].selector,
    });
  });

  it('should build fan service without mode feature', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: 0 });
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const getCharacteristic = stub()
      .returns({ on })
      .onCall(0)
      .returns({
        on,
        props: {
          minValue: 0,
          maxValue: 100,
        },
      });
    const Fanv2 = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        Active: 'ACTIVE',
        RotationSpeed: 'ROTATIONSPEED',
      },
      CharacteristicEventTypes: stub(),
      Service: {
        Fanv2,
      },
    };
    const device = {
      name: 'Ventilateur',
      selector: 'ventilateur',
    };
    const features = [
      {
        name: 'Vitesse',
        selector: 'ventilateur-speed',
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.SPEED,
        min: 0,
        max: 10,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.FAN]);
    await on.args[2][1](cb);
    await on.args[3][1](1, cb);
    // running at speed 6, then switched off from HomeKit
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: 6 });
    await on.args[2][1](cb);
    await on.args[3][1](0, cb);

    expect(getCharacteristic.args[0][0]).to.equal('ROTATIONSPEED');
    expect(getCharacteristic.args[1][0]).to.equal('ACTIVE');
    expect(on.callCount).to.equal(4);
    expect(cb.args[0][1]).to.equal(0);
    expect(cb.args[2][1]).to.equal(1);
    // switching off writes the minimum speed
    expect(homekitHandler.gladys.event.emit.args[1][1].value).to.equal(0);
    // no mode feature, so turning the fan on falls back to the top speed
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 10,
      device: device.selector,
      device_feature: features[0].selector,
    });
  });

  it('should send fan speed commands to the writable feature, not the read-only one', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'ventilo-percent').returns({ last_value: 50 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'ventilo-speed').returns({ last_value: 3 });
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const getCharacteristic = stub().returns({ on, props: { minValue: 0, maxValue: 100 } });
    const Fanv2 = stub().returns({ getCharacteristic });

    homekitHandler.hap = {
      Characteristic: { RotationSpeed: 'ROTATIONSPEED', Active: 'ACTIVE' },
      CharacteristicEventTypes: stub(),
      Service: { Fanv2 },
    };
    // Matter can expose the reached percentage read-only, and the speed setting as the command
    const features = [
      {
        name: 'Pourcentage',
        selector: 'ventilo-percent',
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.PERCENT,
        read_only: true,
        min: 0,
        max: 100,
      },
      {
        name: 'Vitesse',
        selector: 'ventilo-speed',
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.SPEED,
        read_only: false,
        min: 0,
        max: 5,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService({ name: 'Ventilateur' }, features, mappings[DEVICE_FEATURE_CATEGORIES.FAN]);
    // reads come from the percentage, which is already on the HomeKit scale
    await on.args[0][1](cb);
    expect(cb.args[0][1]).to.equal(50);

    // writes must reach the speed feature, rescaled to its own bounds
    await on.args[1][1](60, cb);
    expect(homekitHandler.gladys.event.emit.args[0][1].device_feature).to.equal('ventilo-speed');
    expect(homekitHandler.gladys.event.emit.args[0][1].value).to.equal(3);
  });

  it('should remember the fan speed when switched off without a prior read', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: 40 });
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const getCharacteristic = stub().returns({ on, props: { minValue: 0, maxValue: 100 } });
    const Fanv2 = stub().returns({ getCharacteristic });

    homekitHandler.hap = {
      Characteristic: { RotationSpeed: 'ROTATIONSPEED', Active: 'ACTIVE' },
      CharacteristicEventTypes: stub(),
      Service: { Fanv2 },
    };
    const features = [
      {
        name: 'Vitesse',
        selector: 'ventilo-percent',
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.PERCENT,
        min: 0,
        max: 100,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService({ name: 'Ventilateur' }, features, mappings[DEVICE_FEATURE_CATEGORIES.FAN]);
    // switch off straight away, with no GET beforehand
    await on.args[3][1](0, cb);
    expect(homekitHandler.gladys.event.emit.args[0][1].value).to.equal(0);

    // switching back on must restore the speed it had, not jump to full
    await on.args[3][1](1, cb);
    expect(homekitHandler.gladys.event.emit.args[1][1].value).to.equal(40);
  });

  it('should not bind TargetTemperature on a device with no setpoint', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: 1 });
    homekitHandler.gladys.event.emit = stub();
    const { hap, characteristics } = buildThermostatHapStub();
    homekitHandler.hap = hap;

    // an air conditioner exposing only an on/off command has nothing to back TargetTemperature,
    // and binding a handler there would throw on the first HomeKit poll
    const features = [
      {
        name: 'Marche',
        selector: 'clim-power',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
      },
    ];

    await homekitHandler.buildService({ name: 'Clim' }, features, mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    expect(characteristics.TargetTemperature.handlers.get).to.equal(undefined);
    expect(characteristics.TargetTemperature.handlers.set).to.equal(undefined);
    // the states it can honour are still offered
    expect(characteristics.TargetHeatingCoolingState.handlers.get).to.be.a('function');
  });

  it('should leave the target state unconstrained when no mode maps to HomeKit', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: 0 });
    homekitHandler.gladys.event.emit = stub();
    const { hap, characteristics } = buildThermostatHapStub();
    homekitHandler.hap = hap;

    // an integration declaring only modes HomeKit has no equivalent for would produce an empty
    // validValues list, which HAP rejects: setProps must be skipped rather than called with []
    const features = [
      {
        name: 'Mode',
        selector: 'clim-mode-inconnu',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
        supported_options: [{ value: 99 }],
      },
    ];

    await homekitHandler.buildService({ name: 'Clim' }, features, mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    expect(characteristics.TargetHeatingCoolingState.setProps.callCount).to.equal(0);
  });

  it('should compare against the single setpoint it has when running in auto', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-mode').returns({ last_value: AC_MODE.AUTO });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-heat').returns({ last_value: 21 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-temp').returns({ last_value: 18.5 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildThermostatHapStub();
    homekitHandler.hap = hap;

    const features = [
      {
        name: 'Mode',
        selector: 'clim-mode',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
        min: AC_MODE.AUTO,
        max: AC_MODE.HEATING,
      },
      {
        name: 'Consigne',
        selector: 'clim-heat',
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
      {
        name: 'Température',
        selector: 'clim-temp',
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
    ];

    await homekitHandler.buildService({ name: 'Clim' }, features, mappings[DEVICE_FEATURE_CATEGORIES.THERMOSTAT]);

    // with a single setpoint there is no idle band: below it the device heats, above it it cools
    expect(await readCharacteristic(characteristics.CurrentHeatingCoolingState)).to.equal(1);

    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-temp').returns({ last_value: 23 });
    expect(await readCharacteristic(characteristics.CurrentHeatingCoolingState)).to.equal(2);
  });

  it('should not write an auto mode the air conditioner never declared', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({ last_value: AC_MODE.COOLING });
    homekitHandler.gladys.event.emit = stub();
    const { hap, characteristics } = buildThermostatHapStub();
    homekitHandler.hap = hap;

    // a Matter cooling-only air conditioner: cool, dry and fan, no auto
    const features = [
      {
        name: 'Marche',
        selector: 'clim-power',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
      },
      {
        name: 'Mode',
        selector: 'clim-mode',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
        supported_options: [{ value: AC_MODE.COOLING }, { value: AC_MODE.DRYING }, { value: AC_MODE.FAN }],
      },
    ];

    await homekitHandler.buildService({ name: 'Clim' }, features, mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    // dry and fan are reported to HomeKit as auto, so auto stays selectable
    expect(characteristics.TargetHeatingCoolingState.setProps.args[0][0]).to.eql({ validValues: [0, 2, 3] });

    const cb = stub();
    await characteristics.TargetHeatingCoolingState.handlers.set(3, cb);

    // the device is powered on, but its mode is left alone rather than written to an auto it never
    // declared and could not honour
    expect(homekitHandler.gladys.event.emit.callCount).to.equal(1);
    expect(homekitHandler.gladys.event.emit.args[0][1].device_feature).to.equal('clim-power');

    // a mode it does declare is written
    await characteristics.TargetHeatingCoolingState.handlers.set(2, cb);

    expect(homekitHandler.gladys.event.emit.args[2][1].device_feature).to.equal('clim-mode');
    expect(homekitHandler.gladys.event.emit.args[2][1].value).to.equal(AC_MODE.COOLING);
  });

  it('should build thermostat service from a setpoint and a temperature sensor', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'chauffage-setpoint').returns({ last_value: 21 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'chauffage-temp').returns({ last_value: 18.5 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildThermostatHapStub();
    homekitHandler.hap = hap;

    const device = { name: 'Chauffage', selector: 'chauffage' };
    const features = [
      {
        name: 'Consigne',
        selector: 'chauffage-setpoint',
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        min: 5,
        max: 30,
      },
      {
        name: 'Température',
        selector: 'chauffage-temp',
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
    ];

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.THERMOSTAT]);

    expect(await readCharacteristic(characteristics.CurrentTemperature)).to.equal(18.5);
    expect(await readCharacteristic(characteristics.TargetTemperature)).to.equal(21);
    expect(await readCharacteristic(characteristics.TemperatureDisplayUnits)).to.equal(0);
    // heating only device: HomeKit is told it cannot be switched off or set to cool
    expect(characteristics.TargetHeatingCoolingState.setProps.args[0][0]).to.eql({ validValues: [1] });
    expect(await readCharacteristic(characteristics.TargetHeatingCoolingState)).to.equal(1);
    expect(await readCharacteristic(characteristics.CurrentHeatingCoolingState)).to.equal(1);
    // no second setpoint, so no range in the Home app
    expect(characteristics.HeatingThresholdTemperature.handlers.get).to.equal(undefined);

    const cb = stub();
    await characteristics.TargetTemperature.handlers.set(22.5, cb);
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 22.5,
      device: device.selector,
      device_feature: features[0].selector,
    });
  });

  it('should build thermostat service for an air conditioner', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-power').returns({ last_value: 1 });
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'clim-mode')
      .returns({ last_value: AC_MODE.COOLING });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-setpoint').returns({ last_value: 24 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildThermostatHapStub();
    homekitHandler.hap = hap;

    const device = { name: 'Clim', selector: 'clim' };
    const features = [
      {
        name: 'Marche',
        selector: 'clim-power',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
        min: 0,
        max: 1,
      },
      {
        name: 'Mode',
        selector: 'clim-mode',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
        min: AC_MODE.AUTO,
        max: AC_MODE.FAN,
      },
      {
        name: 'Consigne',
        selector: 'clim-setpoint',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        min: 16,
        max: 31,
      },
    ];

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    expect(characteristics.TargetHeatingCoolingState.setProps.args[0][0]).to.eql({ validValues: [0, 1, 2, 3] });
    expect(await readCharacteristic(characteristics.TargetHeatingCoolingState)).to.equal(2);
    expect(await readCharacteristic(characteristics.CurrentHeatingCoolingState)).to.equal(2);
    // no temperature sensor on the device, the setpoint is the closest reading available
    expect(await readCharacteristic(characteristics.CurrentTemperature)).to.equal(24);

    const cb = stub();
    await characteristics.TargetHeatingCoolingState.handlers.set(1, cb);
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 1,
      device: device.selector,
      device_feature: features[0].selector,
    });
    expect(homekitHandler.gladys.event.emit.args[1][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: AC_MODE.HEATING,
      device: device.selector,
      device_feature: features[1].selector,
    });

    // switching off only writes the binary feature, Gladys has no "off" AC mode
    homekitHandler.gladys.event.emit = stub();
    await characteristics.TargetHeatingCoolingState.handlers.set(0, cb);
    expect(homekitHandler.gladys.event.emit.callCount).to.equal(1);
    expect(homekitHandler.gladys.event.emit.args[0][1].value).to.equal(0);
    expect(homekitHandler.gladys.event.emit.args[0][1].device_feature).to.equal(features[0].selector);

    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-power').returns({ last_value: 0 });
    expect(await readCharacteristic(characteristics.TargetHeatingCoolingState)).to.equal(0);
    expect(await readCharacteristic(characteristics.CurrentHeatingCoolingState)).to.equal(0);
  });

  it('should build thermostat service with both setpoints in Fahrenheit', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'matter-heat').returns({ last_value: 68 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'matter-cool').returns({ last_value: 77 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'matter-temp').returns({ last_value: 71.6 });
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'matter-mode')
      .returns({ last_value: AC_MODE.AUTO });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildThermostatHapStub();
    homekitHandler.hap = hap;

    const device = { name: 'Matter', selector: 'matter' };
    const features = [
      {
        name: 'Température',
        selector: 'matter-temp',
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
      },
      {
        name: 'Chauffage',
        selector: 'matter-heat',
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
      },
      {
        name: 'Refroidissement',
        selector: 'matter-cool',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
        unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
      },
      {
        name: 'Mode',
        selector: 'matter-mode',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
        min: AC_MODE.AUTO,
        max: AC_MODE.HEATING,
      },
    ];

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.THERMOSTAT]);

    // 71.6 °F is 22 °C
    expect(await readCharacteristic(characteristics.CurrentTemperature)).to.be.closeTo(22, 0.001);
    expect(await readCharacteristic(characteristics.HeatingThresholdTemperature)).to.equal(20);
    expect(await readCharacteristic(characteristics.CoolingThresholdTemperature)).to.equal(25);
    // the mode is auto, so TargetTemperature follows the heating setpoint
    expect(await readCharacteristic(characteristics.TargetTemperature)).to.equal(20);
    expect(await readCharacteristic(characteristics.TargetHeatingCoolingState)).to.equal(3);
    // in AUTO, 22 °C sits between the 20 °C heating and 25 °C cooling setpoints: the device has
    // nothing to do, and reporting it as cooling would show the Home app working on an idle unit
    expect(await readCharacteristic(characteristics.CurrentHeatingCoolingState)).to.equal(0);
    // no device with an off command, so HomeKit is not offered the off state
    expect(characteristics.TargetHeatingCoolingState.setProps.args[0][0]).to.eql({ validValues: [1, 2, 3] });

    const cb = stub();
    await characteristics.CoolingThresholdTemperature.handlers.set(26, cb);
    // written back in the unit of the feature
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 78.8,
      device: device.selector,
      device_feature: features[2].selector,
    });

    // switched to cooling, TargetTemperature follows the cooling setpoint instead
    homekitHandler.gladys.stateManager.get
      .withArgs('deviceFeature', 'matter-mode')
      .returns({ last_value: AC_MODE.COOLING });
    expect(await readCharacteristic(characteristics.TargetTemperature)).to.equal(25);
  });

  it('should report cooling in auto when only a cooling setpoint is known', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-mode').returns({ last_value: AC_MODE.AUTO });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-cool').returns({ last_value: 24 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildThermostatHapStub();
    homekitHandler.hap = hap;

    const device = { name: 'Clim', selector: 'clim' };
    const features = [
      {
        name: 'Mode',
        selector: 'clim-mode',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
        min: AC_MODE.AUTO,
        max: AC_MODE.COOLING,
      },
      {
        name: 'Consigne froid',
        selector: 'clim-cool',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
    ];

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    expect(await readCharacteristic(characteristics.TargetHeatingCoolingState)).to.equal(3);
    // no room temperature to compare against, but the device can only cool
    expect(await readCharacteristic(characteristics.CurrentHeatingCoolingState)).to.equal(2);
  });

  it('should build thermostat service with both setpoints and no mode feature', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'pac-heat').returns({ last_value: 22 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'pac-cool').returns({ last_value: 26 });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'pac-temp').returns({ last_value: 19 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildThermostatHapStub();
    homekitHandler.hap = hap;

    const device = { name: 'PAC', selector: 'pac' };
    const features = [
      {
        name: 'Température',
        selector: 'pac-temp',
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
      {
        name: 'Consigne chaud',
        selector: 'pac-heat',
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
      {
        name: 'Consigne froid',
        selector: 'pac-cool',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
    ];

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.THERMOSTAT]);

    // both setpoints and no mode: the device covers the whole range, so auto
    expect(characteristics.TargetHeatingCoolingState.setProps.args[0][0]).to.eql({ validValues: [3] });
    expect(await readCharacteristic(characteristics.TargetHeatingCoolingState)).to.equal(3);
    // the room is below the heating setpoint, so the device is heating
    expect(await readCharacteristic(characteristics.CurrentHeatingCoolingState)).to.equal(1);
    // not cooling, so TargetTemperature follows the heating setpoint
    expect(await readCharacteristic(characteristics.TargetTemperature)).to.equal(22);

    const cb = stub();
    await characteristics.TargetTemperature.handlers.set(23, cb);
    expect(homekitHandler.gladys.event.emit.args[0][1].device_feature).to.equal(features[1].selector);
    expect(homekitHandler.gladys.event.emit.args[0][1].value).to.equal(23);

    // between the two setpoints the device is idle, not cooling
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'pac-temp').returns({ last_value: 24 });
    expect(await readCharacteristic(characteristics.CurrentHeatingCoolingState)).to.equal(0);

    // above the cooling setpoint it is cooling
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'pac-temp').returns({ last_value: 28 });
    expect(await readCharacteristic(characteristics.CurrentHeatingCoolingState)).to.equal(2);
  });

  it('should build thermostat service for a cooling only device', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-cool').returns({ last_value: 24 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildThermostatHapStub();
    homekitHandler.hap = hap;

    const device = { name: 'Clim', selector: 'clim' };
    const features = [
      {
        name: 'Consigne froid',
        selector: 'clim-cool',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
    ];

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    // no mode and no heating setpoint: the device can only cool
    expect(characteristics.TargetHeatingCoolingState.setProps.args[0][0]).to.eql({ validValues: [2] });
    expect(await readCharacteristic(characteristics.TargetHeatingCoolingState)).to.equal(2);
    expect(await readCharacteristic(characteristics.CurrentHeatingCoolingState)).to.equal(2);
    // the cooling setpoint is the only setpoint, so it drives TargetTemperature
    expect(await readCharacteristic(characteristics.TargetTemperature)).to.equal(24);
    // and it stands in for the missing room temperature
    expect(await readCharacteristic(characteristics.CurrentTemperature)).to.equal(24);

    const cb = stub();
    await characteristics.TargetTemperature.handlers.set(25, cb);
    expect(homekitHandler.gladys.event.emit.args[0][1].value).to.equal(25);
    expect(homekitHandler.gladys.event.emit.args[0][1].device_feature).to.equal(features[0].selector);
  });

  it('should build thermostat service without any temperature feature', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-power').returns({ last_value: 1 });
    // a mode value the AC_MODE mapping does not know about
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'clim-mode').returns({ last_value: 99 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildThermostatHapStub();
    homekitHandler.hap = hap;

    const device = { name: 'Clim', selector: 'clim' };
    const features = [
      {
        name: 'Marche',
        selector: 'clim-power',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
      },
      {
        name: 'Mode',
        selector: 'clim-mode',
        category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
        type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
        min: AC_MODE.AUTO,
        max: AC_MODE.FAN,
      },
    ];

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]);

    // nothing carries a temperature, CurrentTemperature is left unbound
    expect(characteristics.CurrentTemperature.handlers.get).to.equal(undefined);
    // an unknown AC mode falls back to auto
    expect(await readCharacteristic(characteristics.TargetHeatingCoolingState)).to.equal(3);
    // in auto without any temperature to compare, heating is the assumed state
    expect(await readCharacteristic(characteristics.CurrentHeatingCoolingState)).to.equal(1);
  });

  it('should build thermostat service without an on/off command', async () => {
    homekitHandler.gladys.stateManager.get = stub();
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'chauffage-setpoint').returns({ last_value: 21 });
    homekitHandler.gladys.event.emit = stub();

    const { hap, characteristics } = buildThermostatHapStub();
    homekitHandler.hap = hap;

    const device = { name: 'Chauffage', selector: 'chauffage' };
    const features = [
      {
        name: 'Consigne',
        selector: 'chauffage-setpoint',
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
    ];

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.THERMOSTAT]);

    const cb = stub();
    // HomeKit can still send those, they are simply not actionable without an on/off feature
    await characteristics.TargetHeatingCoolingState.handlers.set(0, cb);
    await characteristics.TargetHeatingCoolingState.handlers.set(1, cb);

    expect(homekitHandler.gladys.event.emit.callCount).to.equal(0);
    expect(cb.callCount).to.equal(2);
  });

  it('should build shutter/curtain service', async () => {
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'shutter-state').returns({
      id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
      name: 'Shutter State',
      category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
      type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
      last_value: 0,
    });
    homekitHandler.gladys.stateManager.get.withArgs('deviceFeature', 'shutter-position').returns({
      id: '81d2dc15-cb98-4235-96f4-5c12007b6ccd',
      name: 'Shutter position',
      category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
      type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
      last_value: 80,
    });
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const getCharacteristic = stub()
      .onCall(0)
      .returns({
        on,
        props: {
          perms: ['PAIRED_READ'],
        },
      })
      .onCall(1)
      .returns({
        on,
        props: {
          perms: ['PAIRED_READ'],
          minValue: 0,
          maxValue: 100,
        },
      })
      .onCall(2)
      .returns({
        on,
        props: {
          perms: ['PAIRED_READ', 'PAIRED_WRITE'],
          minValue: 0,
          maxValue: 100,
        },
      });
    const WindowCovering = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        CurrentPosition: 'CURRENTPOSITION',
        PositionState: 'POSITIONSTATE',
        TargetPosition: 'TARGETPOSITION',
      },
      CharacteristicEventTypes: stub(),
      Perms: {
        PAIRED_READ: 'PAIRED_READ',
        PAIRED_WRITE: 'PAIRED_WRITE',
      },
      Service: {
        WindowCovering,
      },
    };
    const device = {
      name: 'Shutter',
    };
    const features = [
      {
        id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
        selector: 'shutter-state',
        name: 'Shutter State',
        category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
        type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
      },
      {
        id: '81d2dc15-cb98-4235-96f4-5c12007b6ccd',
        selector: 'shutter-position',
        name: 'Shutter Position',
        category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
        type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
        min: 0,
        max: 100,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.SHUTTER]);
    await on.args[0][1](cb);
    await on.args[1][1](cb);
    await on.args[2][1](cb);
    await on.args[3][1](70, cb);

    expect(WindowCovering.args[0][0]).to.equal('Shutter');
    expect(on.callCount).to.equal(4);
    expect(getCharacteristic.args[0][0]).to.equal('POSITIONSTATE');
    expect(getCharacteristic.args[1][0]).to.equal('CURRENTPOSITION');
    expect(getCharacteristic.args[2][0]).to.equal('TARGETPOSITION');
    expect(cb.args[0][1]).to.equal(2);
    expect(cb.args[1][1]).to.equal(80);
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 70,
      device: device.selector,
      device_feature: features[1].selector,
    });
  });

  it('should build shutter/curtain service without real position', async () => {
    homekitHandler.gladys.stateManager.get = stub().returns({
      id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
      name: 'Shutter State',
      selector: 'shutter-state',
      category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
      type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
      last_value: 0,
    });
    homekitHandler.gladys.event.emit = stub();
    const on = stub();
    const getCharacteristic = stub()
      .onCall(0)
      .returns({
        on,
        props: {
          perms: ['PAIRED_READ'],
        },
      })
      .onCall(1)
      .returns({
        on,
        props: {
          perms: ['PAIRED_READ', 'PAIRED_WRITE'],
          minValue: 0,
          maxValue: 100,
        },
      });
    const WindowCovering = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        PositionState: 'POSITIONSTATE',
        TargetPosition: 'TARGETPOSITION',
      },
      CharacteristicEventTypes: stub(),
      Perms: {
        PAIRED_READ: 'PAIRED_READ',
        PAIRED_WRITE: 'PAIRED_WRITE',
      },
      Service: {
        WindowCovering,
      },
    };
    const device = {
      name: 'Shutter',
      selector: 'shutter',
    };
    const features = [
      {
        id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
        selector: 'shutter-state',
        name: 'Shutter State',
        category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
        type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
        min: -1,
        max: 1,
      },
    ];

    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.SHUTTER]);
    await on.args[0][1](cb);
    await on.args[1][1](70, cb);

    expect(WindowCovering.args[0][0]).to.equal('Shutter');
    expect(on.callCount).to.equal(2);
    expect(getCharacteristic.args[0][0]).to.equal('POSITIONSTATE');
    expect(getCharacteristic.args[1][0]).to.equal('TARGETPOSITION');
    expect(cb.args[0][1]).to.equal(2);
    expect(homekitHandler.gladys.event.emit.args[0][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      // we don't have a real position, it's normalized and rounded between -1 and 1
      value: 0,
      device: device.selector,
      device_feature: features[0].selector,
    });
  });
});
