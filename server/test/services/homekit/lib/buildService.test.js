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
    },
  };

  it('should build light service', async () => {
    homekitHandler.gladys.device.getBySelector = stub().resolves({
      features: [
        {
          id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
          name: 'Luminosité',
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
          last_value: 50,
        },
        {
          id: '81d2dc15-cb98-4235-96f4-5c12007b6ccd',
          name: 'Couleur',
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
          last_value: 3500000,
        },
        {
          id: '77f26d98-49a5-4338-97c8-ab51fb5d2164',
          name: 'Température',
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
          last_value: 255,
        },
      ],
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
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      },
      {
        id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
        name: 'Luminosité',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
        min: 0,
        max: 100,
      },
      {
        id: '81d2dc15-cb98-4235-96f4-5c12007b6ccd',
        name: 'Couleur',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
      },
      {
        id: '77f26d98-49a5-4338-97c8-ab51fb5d2164',
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
      feature_category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      feature_type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    });
    expect(cb.args[2][1]).to.equal(222);
    expect(homekitHandler.gladys.event.emit.args[1][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 14694112,
      device: device.selector,
      feature_category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      feature_type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    });
    expect(cb.args[4][1]).to.equal(76);
    expect(homekitHandler.gladys.event.emit.args[2][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 14014944,
      device: device.selector,
      feature_category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      feature_type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    });
    expect(cb.args[6][1]).to.equal(500);
    expect(homekitHandler.gladys.event.emit.args[3][1]).to.eql({
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value: 0,
      device: device.selector,
      feature_category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      feature_type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
    });
  });

  it('should build switch service', async () => {
    homekitHandler.gladys.device.getBySelector = stub().resolves({
      features: [
        {
          name: 'onoff',
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          last_value: 1,
        },
      ],
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
      feature_category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      feature_type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    });
  });

  it('should build current temperature service', async () => {
    homekitHandler.gladys.device.getBySelector = stub().resolves({
      features: [
        {
          id: '26df6983-5127-4122-874a-b6ed0590badc',
          name: 'Température Celsius',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          last_value: 15,
        },
        {
          id: '91ee488c-068b-4328-8563-e1e15678c5a1',
          name: 'Température Kelvin',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.KELVIN,
          last_value: 293.15,
        },
        {
          id: '110eb9f0-a84d-40df-b0c6-05791fb2ec15',
          name: 'Température Fahrenheit',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
          last_value: 77,
        },
      ],
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
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
      {
        id: '91ee488c-068b-4328-8563-e1e15678c5a1',
        name: 'Température Kelvin',
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.KELVIN,
      },
      {
        id: '110eb9f0-a84d-40df-b0c6-05791fb2ec15',
        name: 'Température Fahrenheit',
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

  it('should build contact sensor service', async () => {
    homekitHandler.gladys.device.getBySelector = stub().resolves({
      features: [
        {
          id: '31c6a4a7-9710-4951-bf34-04eeae5b9ff7',
          name: "Porte d'entrée",
          category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
          last_value: 0,
        },
      ],
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
});
