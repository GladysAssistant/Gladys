const { assert, fake } = require('sinon');
const EventEmitter = require('events');
const { ACTIONS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const deviceFeatureLightBinary = {
  category: DEVICE_FEATURE_CATEGORIES.LIGHT,
  type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
  device_id: 'light-1',
  last_value: 0,
};

const lightDevice = {
  features: [deviceFeatureLightBinary],
};

const deviceFeatureSwitchBinary = {
  category: DEVICE_FEATURE_CATEGORIES.SWITCH,
  type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  device_id: 'switch-1',
  last_value: 0,
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
    stateManager.setState('deviceById', 'light-1', lightDevice);
    stateManager.setState('deviceFeature', 'light-1-binary', deviceFeatureLightBinary);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.LIGHT.TURN_ON,
      device_features: ['light-1-binary'],
    });
    assert.calledWith(device.setValue, lightDevice, deviceFeatureLightBinary, 1);
  });
  it('should execute one action', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('deviceById', 'light-1', lightDevice);
    stateManager.setState('deviceFeature', 'light-1-binary', deviceFeatureLightBinary);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.LIGHT.TURN_OFF,
      device_features: ['light-1-binary'],
    });
    assert.calledWith(device.setValue, lightDevice, deviceFeatureLightBinary, 0);
  });
  it('should execute one action', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('deviceById', 'light-1', lightDevice);
    stateManager.setState('deviceFeature', 'light-1-binary', deviceFeatureLightBinary);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.LIGHT.TOGGLE,
      device_features: ['light-1-binary'],
    });
    assert.calledWith(device.setValue, lightDevice, deviceFeatureLightBinary, 1);
  });
  it('should execute one action', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('deviceById', 'switch-1', switchDevice);
    stateManager.setState('deviceFeature', 'switch-1-binary', deviceFeatureSwitchBinary);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      device_features: ['switch-1-binary'],
    });
    assert.calledWith(device.setValue, switchDevice, deviceFeatureSwitchBinary, 1);
  });
  it('should execute one action', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('deviceById', 'switch-1', switchDevice);
    stateManager.setState('deviceFeature', 'switch-1-binary', deviceFeatureSwitchBinary);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_OFF,
      device_features: ['switch-1-binary'],
    });
    assert.calledWith(device.setValue, switchDevice, deviceFeatureSwitchBinary, 0);
  });
  it('should fail to setValue device but still resolves', async () => {
    const device = {
      setValue: fake.rejects(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('deviceById', 'switch-1', switchDevice);
    stateManager.setState('deviceFeature', 'switch-1-binary', deviceFeatureSwitchBinary);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_OFF,
      device_features: ['switch-1-binary'],
    });
    assert.calledWith(device.setValue, switchDevice, deviceFeatureSwitchBinary, 0);
  });
  it('should fail to setValue device but still resolves', async () => {
    const device = {
      setValue: fake.rejects(null),
    };
    const stateManager = new StateManager();
    stateManager.setState('deviceById', 'switch-1', switchDevice);
    stateManager.setState('deviceFeature', 'switch-1-binary', deviceFeatureSwitchBinary);
    const sceneManager = new SceneManager(stateManager, event, device);
    await sceneManager.executeSingleAction({
      type: ACTIONS.SWITCH.TURN_ON,
      device_features: ['switch-1-binary'],
    });
    assert.calledWith(device.setValue, switchDevice, deviceFeatureSwitchBinary, 1);
  });
});
