const { expect } = require('chai');
const { stub } = require('sinon');
const { buildService } = require('../../../../services/homekit/lib/buildService');
const { mappings } = require('../../../../services/homekit/lib/deviceMappings');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  ACTIONS,
  ACTIONS_STATUS,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

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
