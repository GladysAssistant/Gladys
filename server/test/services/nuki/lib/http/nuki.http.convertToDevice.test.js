const sinon = require('sinon');
const { expect } = require('chai');
const { serviceId } = require('../../mocks/consts.test');
const NukiHandler = require('../../../../../services/nuki/lib');
const NukiHTTPHandler = require('../../../../../services/nuki/lib/http');

const gladys = {};

describe('nuki.http.convertToDevice', () => {
  let nukiHttpHandler;

  beforeEach(() => {
    const nukiHandler = new NukiHandler(gladys, serviceId);
    nukiHttpHandler = new NukiHTTPHandler(nukiHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should convert message to Gladys device', async () => {
    const message = {
      smartlockId: 12345678901,
      accountId: 11234567890,
      type: 4,
      lmType: 0,
      authId: 6664212345,
      name: 'MyLock',
      favorite: false,
      config: {
        name: 'MyLock',
        latitude: 69.50615,
        longitude: 42.5245657,
        capabilities: 1,
        autoUnlatch: false,
        liftUpHandle: false,
        pairingEnabled: true,
        buttonEnabled: true,
        ledEnabled: true,
        ledBrightness: 2,
        timezoneOffset: 0,
        daylightSavingMode: 0,
        fobPaired: false,
        fobAction1: 4,
        fobAction2: 1,
        fobAction3: 2,
        singleLock: false,
        advertisingMode: 0,
        keypadPaired: false,
        keypad2Paired: false,
        homekitState: 1,
        matterState: 0,
        timezoneId: 37,
        deviceType: 4,
        wifiEnabled: true,
      },
      advancedConfig: {
        totalDegrees: 921,
        singleLockedPositionOffsetDegrees: -90,
        unlockedToLockedTransitionOffsetDegrees: 0,
        unlockedPositionOffsetDegrees: 90,
        lockedPositionOffsetDegrees: -90,
        detachedCylinder: false,
        batteryType: 1,
        autoLock: true,
        autoLockTimeout: 600,
        autoUpdateEnabled: true,
        lngTimeout: 30,
        singleButtonPressAction: 1,
        doubleButtonPressAction: 5,
        automaticBatteryTypeDetection: true,
        unlatchDuration: 3,
      },
      state: {
        mode: 2,
        state: 1,
        trigger: 3,
        lastAction: 2,
        batteryCritical: false,
        batteryCharging: false,
        batteryCharge: 38,
        keypadBatteryCritical: false,
        doorsensorBatteryCritical: false,
        doorState: 0,
        ringToOpenTimer: 0,
        nightMode: false,
      },
      firmwareVersion: 199175,
      hardwareVersion: 1292,
      serverState: 0,
      adminPinState: 0,
      virtualDevice: false,
      creationDate: '2023-10-18T06:43:48.733Z',
      updateDate: '2025-03-29T05:02:44.480Z',
      currentSubscription: {
        type: 'B2C',
        state: 'INACTIVE',
        creationDate: '2023-10-18T06:43:49.518Z',
      },
    };
    const expected = {
      name: 'MyLock',
      external_id: 'nuki:12345678901',
      selector: 'nuki-12345678901',
      features: [
        {
          name: 'battery',
          selector: 'nuki:12345678901:battery',
          external_id: 'nuki:12345678901:battery',
          category: 'battery',
          type: 'integer',
          unit: 'percent',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 100,
        },
        {
          name: 'lock',
          selector: 'nuki:12345678901:button',
          external_id: 'nuki:12345678901:button',
          category: 'lock',
          type: 'binary',
          read_only: false,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 1,
        },
        {
          name: 'lock-state',
          selector: 'nuki:12345678901:state',
          external_id: 'nuki:12345678901:state',
          category: 'lock',
          type: 'state',
          read_only: true,
          keep_history: true,
          has_feedback: true,
          min: 0,
          max: 255,
        },
      ],
      model: '',
      service_id: 'de051f90-f34a-4fd5-be2e-e502339ec9bc',
      should_poll: true,
      poll_frequency: 1000,
      params: [{ name: 'protocol', value: 'http' }],
    };
    const result = nukiHttpHandler.convertToDevice(message);
    expect(result).to.deep.eq(expected);
  });
});
