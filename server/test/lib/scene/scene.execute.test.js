const { assert, fake } = require('sinon');
const { expect } = require('chai');

const EventEmitter = require('events');
const { ACTIONS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const light = {
  turnOn: fake.resolves(null),
};

describe('SceneManager', () => {
  it('should execute one scene', async () => {
    const stateManager = new StateManager(event);
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    const scene = {
      selector: 'my-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      active: true,
    };
    sceneManager.addScene(scene);
    await sceneManager.execute('my-scene');
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledOnce(device.setValue);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
  it('scene is not active', async () => {
    const stateManager = new StateManager(event);
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    const scene = {
      selector: 'my-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      active: false,
    };
    sceneManager.addScene(scene);
    await sceneManager.execute('my-scene');
    expect(sceneManager.queue.length).to.equal(0);
  });
  it('scene does not exist', async () => {
    const sceneManager = new SceneManager(light, event);
    return sceneManager.execute('thisscenedoesnotexist');
  });

  it('should execute one scene with invalid action', async () => {
    const stateManager = new StateManager(event);
    const device = {
      setValue: fake.resolves(null),
    };

    const sceneManager = new SceneManager(stateManager, event, device);
    const scene = {
      selector: 'my-bad-scene',
      triggers: [],
      actions: [
        [
          {
            type: 'BAD-TYPE',
            devices: ['light-1'],
          },
        ],
      ],
      active: true,
    };
    sceneManager.addScene(scene);
    await sceneManager.execute('my-bad-scene');
    expect(sceneManager.queue.length).to.equal(1);
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.callCount(device.setValue, 0);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
