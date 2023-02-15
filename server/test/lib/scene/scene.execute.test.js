const { assert, fake, createSandbox } = require('sinon');
const EventEmitter = require('events');
const { expect } = require('chai');
const { ACTIONS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const StateManager = require('../../../lib/state');

describe('scene.execute', () => {
  let sandbox;
  const event = new EventEmitter();
  const brain = {};
  const device = {};
  let stateManager;
  let sceneManager;

  beforeEach(() => {
    sandbox = createSandbox();
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    device.setValue = fake.resolves(null);
    stateManager = new StateManager(event);
    sceneManager = new SceneManager(stateManager, event, device, {}, {}, {}, {}, {}, {}, {}, brain);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should execute one scene', async () => {
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
  it('should execute one scene and abort scene', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const scene = {
      selector: 'my-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
            conditions: [
              {
                variable: '0.0.last_value',
                operator: '=',
                value: 20,
              },
            ],
          },
        ],
      ],
    };
    sceneManager.addScene(scene);
    const scope = {};
    await sceneManager.execute('my-scene', scope);
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.notCalled(device.setValue);
          expect(scope).to.have.property('0');
          expect(scope['0']).to.deep.equal({ '0': { category: 'light', type: 'binary', last_value: 15 } });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
  it('should execute one scene, crash but not crash here', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const scene = {
      selector: 'my-scene',
      triggers: [],
      actions: [
        [
          {
            type: 'this type does not exist',
            device_feature: 'my-device-feature',
          },
        ],
      ],
    };
    sceneManager.addScene(scene);
    const scope = {};
    await sceneManager.execute('my-scene', scope);
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        resolve();
      });
    });
  });
  it('scene does not exist', async () => {
    return sceneManager.execute('thisscenedoesnotexist');
  });
  it('should execute chained scenes', async () => {
    const executeSpy = sandbox.spy(sceneManager, 'execute');
    const scope = {};
    const scene = {
      selector: 'my-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.SCENE.START,
            scene: 'second-scene',
          },
        ],
      ],
    };
    const secondScene = {
      selector: 'second-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.SCENE.START,
            scene: 'my-scene',
          },
        ],
      ],
    };
    sceneManager.addScene(scene);
    sceneManager.addScene(secondScene);
    await sceneManager.execute('my-scene', scope);
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledTwice(executeSpy);
          assert.calledWith(executeSpy.firstCall, 'my-scene', {
            alreadyExecutedScenes: new Set(['my-scene']),
          });
          assert.calledWith(executeSpy.secondCall, 'second-scene', {
            alreadyExecutedScenes: new Set(['my-scene', 'second-scene']),
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should prevent infinite loop', async () => {
    const executeSpy = sandbox.spy(sceneManager, 'execute');
    const scope = {};
    const scene = {
      selector: 'my-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.SCENE.START,
            scene: 'second-scene',
          },
        ],
      ],
    };
    const secondScene = {
      selector: 'second-scene',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.SCENE.START,
            scene: 'my-scene',
          },
        ],
      ],
    };
    sceneManager.addScene(scene);
    sceneManager.addScene(secondScene);
    await sceneManager.execute('my-scene', scope);
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledTwice(executeSpy);
          assert.calledWith(executeSpy.firstCall, 'my-scene', {
            alreadyExecutedScenes: new Set(['my-scene']),
          });
          assert.calledWith(executeSpy.secondCall, 'second-scene', {
            alreadyExecutedScenes: new Set(['my-scene', 'second-scene']),
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
