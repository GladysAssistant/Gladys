const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub } = sinon;
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

  it('should not delay a smoke alarm', async () => {
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic: stub() }),
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
        device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
        name: 'Smoke sensor',
        category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      }),
    };
    homekitHandler.sendState = stub();
    homekitHandler.notifyTimeouts = {};

    await homekitHandler.notifyChange([accessory], {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 1,
      device_feature: 'home:smoke:binary',
    });

    // notifDelay is 0: the alarm is forwarded synchronously, without waiting on any timer
    expect(homekitHandler.sendState.callCount).to.equal(1);
    expect(homekitHandler.notifyTimeouts['home:smoke:binary']).to.equal(undefined);
  });

  it('should forward two smoke alarms fired in the same tick', async () => {
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ updateCharacteristic: stub() }),
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
        device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
        name: 'Smoke sensor',
        category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      }),
    };
    homekitHandler.sendState = stub();
    homekitHandler.notifyTimeouts = {};

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 1,
      device_feature: 'home:smoke:binary',
    };
    await homekitHandler.notifyChange([accessory], event);
    await homekitHandler.notifyChange([accessory], event);

    // debouncing a zero delay would clear the first timer and drop the first alarm
    expect(homekitHandler.sendState.callCount).to.equal(2);
  });

  it('should not delay a mapping that asks for no delay', async () => {
    const sendEventNotification = stub();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ getCharacteristic: stub().returns({ sendEventNotification }) }),
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
        device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
        name: 'Button',
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
      }),
    };
    homekitHandler.sendState = stub();
    homekitHandler.notifyTimeouts = {};

    await homekitHandler.notifyChange([accessory], {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 1,
      device_feature: 'home:button:click',
    });

    // notifDelay is 0 on a button: the press is forwarded synchronously, without waiting on a timer
    expect(homekitHandler.sendState.callCount).to.equal(1);
    expect(homekitHandler.notifyTimeouts['home:button:click']).to.equal(undefined);
  });

  it('should forward two presses fired in the same tick', async () => {
    const sendEventNotification = stub();
    const accessory = {
      UUID: '4756151c-369e-4772-8bf7-943a6ac70583',
      getService: stub().returns({ getCharacteristic: stub().returns({ sendEventNotification }) }),
    };

    homekitHandler.gladys.stateManager = {
      get: stub().returns({
        id: '4f7060d7-7960-4c68-b435-8952bf3f40bf',
        device_id: '4756151c-369e-4772-8bf7-943a6ac70583',
        name: 'Button',
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
      }),
    };
    homekitHandler.sendState = stub();
    homekitHandler.notifyTimeouts = {};

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      last_value: 1,
      device_feature: 'home:button:click',
    };
    await homekitHandler.notifyChange([accessory], event);
    await homekitHandler.notifyChange([accessory], event);

    // debouncing a zero delay would clear the first timer and drop the first press
    expect(homekitHandler.sendState.callCount).to.equal(2);
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
  it('should forward an alarm change without any debounce', async () => {
    homekitHandler.sendAlarmState = stub();

    await homekitHandler.notifyChange([], { type: EVENTS.ALARM.ARM, house: 'maison' });
    await homekitHandler.notifyChange([], { type: EVENTS.ALARM.DISARM, house: 'maison' });
    await homekitHandler.notifyChange([], { type: EVENTS.ALARM.PARTIAL_ARM, house: 'maison' });
    await homekitHandler.notifyChange([], { type: EVENTS.ALARM.PANIC, house: 'maison' });

    // an alarm arming or going off is exactly what HomeKit must hear about at once
    expect(homekitHandler.sendAlarmState.args).to.eql([['maison'], ['maison'], ['maison'], ['maison']]);

    // arming only announces the delay before the house actually arms: the mode has not changed yet
    await homekitHandler.notifyChange([], { type: EVENTS.ALARM.ARMING, house: 'maison' });

    expect(homekitHandler.sendAlarmState.callCount).to.equal(4);
  });
});
