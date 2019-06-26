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
    stateManager.setState('device', 'light-1', light);
    const sceneManager = new SceneManager(stateManager, event);
    const scene = {
      selector: 'my-scene',
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            device: 'light-1',
          },
        ],
      ],
    };
    sceneManager.addScene(scene);
    await sceneManager.execute('my-scene');
    return new Promise((resolve) => {
      sceneManager.queue.start(() => {
        assert.calledOnce(light.turnOn);
        resolve();
      });
    });
  });
  it('scene does not exist', async () => {
    const sceneManager = new SceneManager(light, event);
    return sceneManager.execute('thisscenedoesnotexist');
  });
});
