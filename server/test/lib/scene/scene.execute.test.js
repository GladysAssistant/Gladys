const { assert, fake } = require('sinon');
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
  it('scene does not exist', async () => {
    const sceneManager = new SceneManager(light, event);
    return sceneManager.execute('thisscenedoesnotexist');
  });
});
