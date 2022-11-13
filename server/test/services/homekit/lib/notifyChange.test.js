const { expect } = require('chai');
const { stub } = require('sinon');
const { notifyChange } = require('../../../../services/homekit/lib/notifyChange');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  EVENTS,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

describe('Notify change to HomeKit', () => {
  const homekitHandler = {
    serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
    notifyChange,
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
        CurrentTemperature: 'CURRENTTEMPERATURE',
      },
      Service: {
        ContactSensor: 'CONTACTSENSOR',
      },
    },
  };

  it('should do nothing not NEW_STATE event', async () => {
    const event = {
      type: EVENTS.DEVICE.CREATE,
    };

    await homekitHandler.notifyChange([], event);
  });

  it('should do nothing no HomeKit accessory found', async () => {
    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        device_id: '5bc6e7f3-9061-4b40-b444-8d31d632d71d',
      }),
    };

    await homekitHandler.notifyChange([{ UUID: '4d92c108-9e58-4400-b6a3-8811f8242c09' }], event);
  });

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

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
        device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
        name: 'Door sensor',
        category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      }),
    };

    await homekitHandler.notifyChange([accessory], event);

    expect(updateCharacteristic.args[0]).eql(['CONTACTSENSORSTATE', 0]);
  });

  it('should notify light brightness', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 70,
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
        device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
        name: 'Bulb brightness',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
        min: 0,
        max: 140,
      }),
    };

    await homekitHandler.notifyChange([accessory], event);

    expect(updateCharacteristic.args[0]).eql(['BRIGHTNESS', 50]);
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

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
        device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
        name: 'Bulb color',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
      }),
    };

    await homekitHandler.notifyChange([accessory], event);

    expect(updateCharacteristic.callCount).eq(2);
    expect(updateCharacteristic.args[0]).eql(['HUE', 222]);
    expect(updateCharacteristic.args[1]).eql(['SATURATION', 76]);
  });

  it('should notify light temperature', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 50,
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
        device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
        name: 'Bulb temperature',
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
        min: 0,
        max: 100,
      }),
    };

    await homekitHandler.notifyChange([accessory], event);

    expect(updateCharacteristic.args[0]).eql(['COLORTEMPERATURE', 320]);
  });
  it('should notify sensor temperature', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 294.15,
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
        device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
        name: 'Sensor temperature',
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.KELVIN,
      }),
    };

    await homekitHandler.notifyChange([accessory], event);

    expect(updateCharacteristic.args[0]).eql(['CURRENTTEMPERATURE', 21]);
  });
});
