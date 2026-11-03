const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;
const EventEmitter = require('events');
const { ACTIONS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const deviceFeatureLightBinary = {
  category: DEVICE_FEATURE_CATEGORIES.LIGHT,
  type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
};

const lightDevice = {
  features: [deviceFeatureLightBinary],
};

const deviceFeatureSwitchBinary = {
  category: DEVICE_FEATURE_CATEGORIES.SWITCH,
  type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
};

const switchDevice = {
  features: [deviceFeatureSwitchBinary],
};

describe('scene.executeSingleAction', () => {
  it('should execute one action', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('device', 'light-1', lightDevice);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.LIGHT.TURN_ON,
      devices: ['light-1'],
    });
    assert.calledWith(device.setValue, lightDevice, deviceFeatureLightBinary, 1);
  });
  it('should execute one action', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('device', 'light-1', lightDevice);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.LIGHT.TURN_OFF,
      devices: ['light-1'],
    });
    assert.calledWith(device.setValue, lightDevice, deviceFeatureLightBinary, 0);
  });
  it('should execute one action', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('device', 'switch-1', switchDevice);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      devices: ['switch-1'],
    });
    assert.calledWith(device.setValue, switchDevice, deviceFeatureSwitchBinary, 1);
  });
  it('should execute one action', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('device', 'switch-1', switchDevice);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_OFF,
      devices: ['switch-1'],
    });
    assert.calledWith(device.setValue, switchDevice, deviceFeatureSwitchBinary, 0);
  });
  it('should fail to setValue device but still resolves', async () => {
    const device = {
      setValue: fake.rejects(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('device', 'switch-1', switchDevice);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_OFF,
      devices: ['switch-1'],
    });
    assert.calledWith(device.setValue, switchDevice, deviceFeatureSwitchBinary, 0);
  });
  it('should fail to setValue device but still resolves', async () => {
    const device = {
      setValue: fake.rejects(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('device', 'switch-1', switchDevice);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      devices: ['switch-1'],
    });
    assert.calledWith(device.setValue, switchDevice, deviceFeatureSwitchBinary, 1);
  });
});

describe('scene.executeSingleAction multi-switch device', () => {
  const socket1 = {
    selector: 'power-strip-socket-1',
    device_id: 'power-strip-id',
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    read_only: false,
    last_value: 0,
  };
  const socket2 = { ...socket1, selector: 'power-strip-socket-2', last_value: 1 };
  const readOnlySwitch = { ...socket1, selector: 'power-strip-read-only', read_only: true };
  const powerStrip = { id: 'power-strip-id', features: [socket1, socket2, readOnlySwitch] };
  let stateManager;
  let device;
  let sceneManager;

  beforeEach(() => {
    device = { setValue: fake.resolves(null) };
    stateManager = new StateManager();
    stateManager.setState('device', 'power-strip', powerStrip);
    stateManager.setState('deviceById', 'power-strip-id', powerStrip);
    [socket1, socket2, readOnlySwitch].forEach((feature) =>
      stateManager.setState('deviceFeature', feature.selector, feature),
    );
    sceneManager = new SceneManager(stateManager, event, device);
  });

  it('should turn on only the selected switches', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      device_features: ['power-strip-socket-2'],
    });
    assert.calledOnceWithExactly(device.setValue, powerStrip, socket2, 1);
  });
  it('should toggle each selected switch from its own state', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TOGGLE,
      device_features: ['power-strip-socket-1', 'power-strip-socket-2'],
    });
    assert.calledTwice(device.setValue);
    assert.calledWith(device.setValue, powerStrip, socket1, 1);
    assert.calledWith(device.setValue, powerStrip, socket2, 0);
  });
  it('should turn off every writable switch of a device selected the legacy way', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_OFF,
      devices: ['power-strip'],
    });
    assert.calledTwice(device.setValue);
    assert.calledWith(device.setValue, powerStrip, socket1, 0);
    assert.calledWith(device.setValue, powerStrip, socket2, 0);
  });
  it('should skip a switch that no longer exists', async () => {
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      device_features: ['deleted-switch', 'power-strip-socket-1'],
      devices: ['deleted-device'],
    });
    assert.calledOnceWithExactly(device.setValue, powerStrip, socket1, 1);
  });
});
