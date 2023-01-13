const { expect } = require('chai');
const { stub } = require('sinon');
const { notifyChange } = require('../../../../services/homekit/lib/notifyChange');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../../utils/constants');

describe('Notify change to HomeKit', () => {
  const homekitHandler = {
    serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
    notifyChange,
    gladys: {
      stateManager: {},
    },
    notifyTimeouts: {},
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

  it('should create timeout to notify', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 0,
      device_feature: 'home:door:binary',
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

    homekitHandler.notifyTimeouts = {};

    await homekitHandler.notifyChange([accessory], event);

    expect(homekitHandler.notifyTimeouts['home:door:binary']).haveOwnProperty('timeout');
    expect(homekitHandler.notifyTimeouts['home:door:binary']).haveOwnProperty('startDateTime');
  });

  it('should update timeout to notify', async () => {
    const updateCharacteristic = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic }),
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 0,
      device_feature: 'home:door:binary',
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

    homekitHandler.notifyTimeouts = {
      'home:door:binary': {
        startDateTime: new Date().getTime(),
      },
    };

    await homekitHandler.notifyChange([accessory], event);

    expect(homekitHandler.notifyTimeouts['home:door:binary']).haveOwnProperty('timeout');
    expect(homekitHandler.notifyTimeouts['home:door:binary']).haveOwnProperty('startDateTime');
  });

  it('should send state immediatly if too long delay', async () => {
    const sendState = stub().returns();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
    };

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 1,
      device_feature: 'home:door:binary',
    };

    homekitHandler.sendState = sendState;

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
        device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
        name: 'Door sensor',
        category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      }),
    };

    homekitHandler.notifyTimeouts = {
      'home:door:binary': {
        startDateTime: new Date().getTime() - 30 * 1000,
      },
    };

    await homekitHandler.notifyChange([accessory], event);

    expect(sendState.args[0]).eql([
      {
        UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      },
      {
        category: 'opening-sensor',
        device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
        id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
        name: 'Door sensor',
        type: 'binary',
      },
      {
        device_feature: 'home:door:binary',
        last_value: 1,
        type: 'device.new-state',
      },
    ]);
  });
});
