const { expect } = require('chai');
const EventEmitter = require('events');
const { fake } = require('sinon');
const { ACTIONS, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const StateManager = require('../../../lib/state');

describe('scene.stop', () => {
  const event = new EventEmitter();
  const brain = {};
  const device = {};
  let stateManager;
  let sceneManager;

  beforeEach(() => {
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    device.setValue = fake.resolves(null);
    stateManager = new StateManager(event);
    sceneManager = new SceneManager(stateManager, event, device, {}, {}, {}, {}, {}, {}, {}, brain);
  });

  // Wait until `count` websocket messages of a given type have been received
  const waitForWebsocketCount = (type, count) =>
    new Promise((resolve) => {
      const messages = [];
      const listener = (message) => {
        if (message.type === type) {
          messages.push(message);
          if (messages.length === count) {
            event.removeListener(EVENTS.WEBSOCKET.SEND_ALL, listener);
            resolve(messages);
          }
        }
      };
      event.on(EVENTS.WEBSOCKET.SEND_ALL, listener);
    });

  // Wait for the next websocket message of a given type
  const waitForWebsocket = async (type) => {
    const messages = await waitForWebsocketCount(type, 1);
    return messages[0];
  };

  it('should stop a running scene by executionId while it waits in a delay', async () => {
    const scene = {
      selector: 'my-scene',
      name: 'My scene',
      icon: 'zap',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.TIME.DELAY,
            value: 60,
            unit: 'minutes', // long delay: only a stop can interrupt it
          },
        ],
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
    };
    await sceneManager.addScene(scene);

    const started = waitForWebsocket(WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED);
    const stopped = waitForWebsocket(WEBSOCKET_MESSAGE_TYPES.SCENE.STOPPED);

    sceneManager.execute('my-scene');
    const startedMessage = await started;
    const { executionId } = startedMessage.payload;

    // The scene is now waiting in the (very long) delay
    expect(sceneManager.getRunning()).to.have.lengthOf(1);

    const result = sceneManager.stop(executionId);
    expect(result).to.equal(true);

    await stopped;
    // The scene stopped: it is no longer running and the action after the
    // delay was never executed.
    expect(sceneManager.getRunning()).to.have.lengthOf(0);
    expect(device.setValue.called).to.equal(false);
  });

  it('should stop all running executions of a scene by its selector', async () => {
    const scene = {
      selector: 'my-scene',
      name: 'My scene',
      icon: 'zap',
      triggers: [],
      actions: [[{ type: ACTIONS.TIME.DELAY, value: 60, unit: 'minutes' }]],
    };
    await sceneManager.addScene(scene);

    const firstStarted = waitForWebsocket(WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED);
    sceneManager.execute('my-scene');
    await firstStarted;
    const secondStarted = waitForWebsocket(WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED);
    sceneManager.execute('my-scene');
    await secondStarted;

    expect(sceneManager.getRunning()).to.have.lengthOf(2);

    const bothStopped = waitForWebsocketCount(WEBSOCKET_MESSAGE_TYPES.SCENE.STOPPED, 2);
    const stoppedCount = sceneManager.stopBySelector('my-scene');
    expect(stoppedCount).to.equal(2);

    await bothStopped;
    expect(sceneManager.getRunning()).to.have.lengthOf(0);
  });

  it('should stop a scene while it is actively waiting in a delay (abort listener)', async () => {
    const scene = {
      selector: 'my-scene',
      name: 'My scene',
      icon: 'zap',
      triggers: [],
      actions: [[{ type: ACTIONS.TIME.DELAY, value: 60, unit: 'minutes' }]],
    };
    await sceneManager.addScene(scene);

    const started = waitForWebsocket(WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED);
    sceneManager.execute('my-scene');
    const { executionId } = (await started).payload;

    // Let the delay action actually start waiting (so it registers its abort
    // listener) before stopping — this exercises the listener path, not the
    // "already aborted" guard in executeAction.
    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });

    const stopped = waitForWebsocket(WEBSOCKET_MESSAGE_TYPES.SCENE.STOPPED);
    expect(sceneManager.stop(executionId)).to.equal(true);

    await stopped;
    expect(sceneManager.getRunning()).to.have.lengthOf(0);
  });

  it('should only stop executions matching the selector, leaving the others running', async () => {
    const sceneToStop = {
      selector: 'scene-to-stop',
      name: 'Scene to stop',
      icon: 'zap',
      triggers: [],
      actions: [[{ type: ACTIONS.TIME.DELAY, value: 60, unit: 'minutes' }]],
    };
    const otherScene = {
      selector: 'other-scene',
      name: 'Other scene',
      icon: 'zap',
      triggers: [],
      actions: [[{ type: ACTIONS.TIME.DELAY, value: 60, unit: 'minutes' }]],
    };
    await sceneManager.addScene(sceneToStop);
    await sceneManager.addScene(otherScene);

    const firstStarted = waitForWebsocket(WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED);
    sceneManager.execute('scene-to-stop');
    await firstStarted;
    const secondStarted = waitForWebsocket(WEBSOCKET_MESSAGE_TYPES.SCENE.STARTED);
    sceneManager.execute('other-scene');
    await secondStarted;

    expect(sceneManager.getRunning()).to.have.lengthOf(2);

    const stopped = waitForWebsocket(WEBSOCKET_MESSAGE_TYPES.SCENE.STOPPED);
    const stoppedCount = sceneManager.stopBySelector('scene-to-stop');
    expect(stoppedCount).to.equal(1);

    await stopped;
    // Only the "other-scene" execution is still running
    const running = sceneManager.getRunning();
    expect(running).to.have.lengthOf(1);
    expect(running[0]).to.have.property('sceneSelector', 'other-scene');
  });

  it('should return false when stopping an unknown execution', () => {
    expect(sceneManager.stop('does-not-exist')).to.equal(false);
  });

  it('should return 0 when stopping a scene with no running execution', () => {
    expect(sceneManager.stopBySelector('does-not-exist')).to.equal(0);
  });
});
