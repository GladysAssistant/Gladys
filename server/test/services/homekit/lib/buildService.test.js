const { expect } = require('chai');
const { stub } = require('sinon');
const { buildService } = require('../../../../services/homekit/lib/buildService');
const { mappings } = require('../../../../services/homekit/lib/deviceMappings');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  ACTIONS,
  ACTIONS_STATUS,
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
    const on = stub();
    const getCharacteristic = stub().returns({
      on,
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
        name: 'Luminosité',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      },
      {
        name: 'Couleur',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
      },
      {
        name: 'Température',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
      },
    ];

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.LIGHT]);

    expect(Lightbulb.args[0][0]).to.equal('Lampe');
    expect(on.callCount).to.equal(10);
    expect(getCharacteristic.args[0][0]).to.equal('ON');
    expect(getCharacteristic.args[1][0]).to.equal('BRIGHTNESS');
    expect(getCharacteristic.args[2][0]).to.equal('HUE');
    expect(getCharacteristic.args[3][0]).to.equal('SATURATION');
    expect(getCharacteristic.args[4][0]).to.equal('COLORTEMPERATURE');
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
    });
    const Switch = stub().returns({
      getCharacteristic,
    });

    homekitHandler.hap = {
      Characteristic: {
        On: 'ON',
      },
      CharacteristicEventTypes: stub(),
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
          name: 'Température',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          last_value: 21,
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
        name: 'Température',
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      },
    ];
    const cb = stub();

    await homekitHandler.buildService(device, features, mappings[DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]);
    await on.args[0][1](cb);

    expect(TemperatureSensor.args[0][0]).to.equal('Capteur');
    expect(on.callCount).to.equal(1);
    expect(getCharacteristic.args[0][0]).to.equal('CURRENTTEMPERATURE');
    expect(cb.args[0][1]).to.equal(21);
  });
});
