const { assert, fake } = require('sinon');
const chaiAssert = require('chai').assert;
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
  it('should throw error, action type does not exist', async () => {
    const light = {
      turnOn: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'light-1', light);
    const sceneManager = new SceneManager(stateManager, event, light);
    const promise = sceneManager.executeSingleAction({
      type: 'THISDOESNOTEXIST',
      devices: ['light-1'],
    });
    return chaiAssert.isRejected(promise, 'There was an error executing action THISDOESNOTEXIST');
  });
  it('should throw error, action type does not exist', async () => {
    const switchs = {
      turnOn: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'mySwitch-1', switchs);
    const sceneManager = new SceneManager(stateManager, event, switchs);
    const promise = sceneManager.executeSingleAction({
      type: 'THISDOESNOTEXIST',
      devices: ['switchs-1'],
    });
    return chaiAssert.isRejected(promise, 'There was an error executing action THISDOESNOTEXIST');
  });
  it('should throw error, action type does not exist', async () => {
    const light = {
      turnOff: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'light-1', light);
    const sceneManager = new SceneManager(stateManager, event, light);
    const promise = sceneManager.executeSingleAction({
      type: 'THISDOESNOTEXIST',
      devices: ['light-1'],
    });
    return chaiAssert.isRejected(promise, 'There was an error executing action THISDOESNOTEXIST');
  });
  it('should throw error, action type does not exist', async () => {
    const switchs = {
      turnOff: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'mySwitch-1', switchs);
    const sceneManager = new SceneManager(stateManager, event, switchs);
    const promise = sceneManager.executeSingleAction({
      type: 'THISDOESNOTEXIST',
      devices: ['switchs-1'],
    });
    return chaiAssert.isRejected(promise, 'There was an error executing action THISDOESNOTEXIST');
  });
});
