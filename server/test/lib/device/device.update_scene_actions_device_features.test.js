const { expect } = require('chai');
const { fake } = require('sinon');
const { up } = require('../../../migrations/20230816115900-update-scene-actions-device-features');
const StateManager = require('../../../lib/state');
const SceneManager = require('../../../lib/scene');
const Event = require('../../../lib/event');

describe('Device', () => {
  it('should create device alone', async () => {
    const event = new Event();
    const stateManager = new StateManager(event);
    const sceneManager = new SceneManager(
      stateManager,
      event,
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {
        addNamedEntity: fake.returns(null),
      },
    );

    const scene = await sceneManager.create({
      id: 'device.update_scene_actions_device_features.test',
      selector: 'device_update_scene_actions_device_features_test',
      name: 'device.update_scene_actions_device_features.test',
      icon: 'fe-scene',
      triggers: [],
      actions: [],
    });

    up(null, null);

    expect(scene).to.have.property('name', 'Philips Hue 1');
  });
});
