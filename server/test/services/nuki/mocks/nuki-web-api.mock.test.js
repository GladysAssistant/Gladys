const smartlockData = {
  smartlockId: 18144654068,
  accountId: 1989075864,
  type: 4,
  lmType: 0,
  authId: 1915420675,
  name: 'Maison',
  favorite: false,
  config: {
    name: 'Maison',
    latitude: 48.50615,
    longitude: 7.5245657,
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

class NukiWebApiMock {
  constructor(apiKey) {
    this.apiKey = apiKey;
    console.log(apiKey);
  }

  async getSmartlocks() {
    console.log(`get smart locks ${this.apiKey}`);
    return [smartlockData];
  }

  async getSmartlock(smartlockId) {
    console.log(`get smart lock info ${smartlockId} with api ${this.apiKey}`);
    return smartlockData;
  }
}

module.exports = {
  NukiWebApiMock,
};
