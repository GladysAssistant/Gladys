const { assert, fake } = require('sinon');
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
});
