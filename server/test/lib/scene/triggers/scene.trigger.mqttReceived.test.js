const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const EventEmitter = require('events');
const StateManager = require('../../../../lib/state');
const SceneManager = require('../../../../lib/scene');
const MqttHandler = require('../../../../services/mqtt/lib');
const { ACTIONS, EVENTS } = require('../../../../utils/constants');

const event = new EventEmitter();

describe('Scene.triggers.mqttReceived', () => {
  let sceneManager;

  const device = {
    setValue: fake.resolves(null),
  };

  const brain = {};

  const service = {
    getService: fake.returns({
      device: {
        subscribe: fake.returns(null),
      },
    }),
  };

  beforeEach(() => {
    const house = {
      get: fake.resolves([]),
    };

    const scheduler = {
      scheduleJob: (date, callback) => {
        return {
          callback,
          date,
          cancel: () => {},
        };
      },
    };

    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);

    const stateManager = new StateManager();

    sceneManager = new SceneManager(stateManager, event, device, {}, {}, house, {}, {}, {}, scheduler, brain, service);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should execute scene with message received trigger', async () => {
    await sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_OFF,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.MQTT.RECEIVED,
          topic: 'my/topic',
          message: '',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      topic: 'my/topic',
      message: 'ON',
    });
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

  it('should execute scene with message received trigger with undefined message (match any)', async () => {
    await sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_OFF,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.MQTT.RECEIVED,
          topic: 'my/topic',
          // message is undefined - should match any message
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      topic: 'my/topic',
      message: '{"event":"S","event_cnt":47}',
    });
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

  it('should execute scene with message received trigger whit message', async () => {
    await sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_OFF,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.MQTT.RECEIVED,
          topic: 'my/topic',
          message: 'ON',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      topic: 'my/topic',
      message: 'ON',
    });
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
  const addSceneWithTopic = (topic, message) =>
    sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_OFF,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.MQTT.RECEIVED,
          topic,
          message,
        },
      ],
    });

  const checkSceneExecuted = (calledCount) =>
    new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.callCount(device.setValue, calledCount);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });

  it('should execute scene when topic matches a single-level wildcard (+) filter', async () => {
    await addSceneWithTopic('test/+/button');
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      topic: 'test/kitchen/button',
      message: 'pressed',
    });
    return checkSceneExecuted(1);
  });

  it('should execute scene when topic matches a multi-level wildcard (#) filter', async () => {
    await addSceneWithTopic('test/#', 'ON');
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      topic: 'test/kitchen/light/state',
      message: 'ON',
    });
    return checkSceneExecuted(1);
  });

  it('should not execute scene when topic does not match the wildcard filter', async () => {
    await addSceneWithTopic('test/+/button');
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      topic: 'test/kitchen/light',
      message: 'pressed',
    });
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      topic: 'test/kitchen/sub/button',
      message: 'pressed',
    });
    return checkSceneExecuted(0);
  });

  it('should not execute scene when topic matches the wildcard filter but message differs', async () => {
    await addSceneWithTopic('test/#', 'ON');
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      topic: 'test/kitchen/light',
      message: 'OFF',
    });
    return checkSceneExecuted(0);
  });

  it('should not execute scene when event or trigger has no topic', async () => {
    await addSceneWithTopic(undefined);
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      topic: 'test/kitchen/light',
      message: 'ON',
    });
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      message: 'ON',
    });
    return checkSceneExecuted(0);
  });

  it('should not execute scene when the event comes from the subscription of another filter', async () => {
    await addSceneWithTopic('test/+/button');
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      topic: 'test/kitchen/button',
      message: 'pressed',
      topic_filter: 'test/#',
    });
    return checkSceneExecuted(0);
  });

  it('should execute each scene once when a message matches overlapping subscriptions', async () => {
    // A real MQTT handler and its own event bus, so that the message goes through
    // handleNewMessage, which calls every subscription matching the topic.
    const mqttEvent = new EventEmitter();
    const mqttHandler = new MqttHandler({ event: mqttEvent }, null, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    const mqttSceneManager = new SceneManager(
      new StateManager(),
      mqttEvent,
      device,
      {},
      {},
      { get: fake.resolves([]) },
      {},
      {},
      {},
      { scheduleJob: () => ({ cancel: () => {} }) },
      brain,
      { getService: () => ({ device: mqttHandler }) },
    );
    const addMqttScene = (selector, topic) =>
      mqttSceneManager.addScene({
        selector,
        active: true,
        actions: [[{ type: ACTIONS.LIGHT.TURN_OFF, devices: ['light-1'] }]],
        triggers: [{ type: EVENTS.MQTT.RECEIVED, topic }],
      });
    await addMqttScene('scene-plus', 'test/+/button');
    await addMqttScene('scene-plus-same-filter', 'test/+/button');
    await addMqttScene('scene-hash', 'test/#');
    await addMqttScene('scene-other', 'other/topic');

    mqttHandler.handleNewMessage('test/kitchen/button', 'pressed');

    return new Promise((resolve, reject) => {
      mqttSceneManager.queue.start(() => {
        try {
          // 3 matching scenes, each run once (6 runs if each subscription checked every scene)
          assert.callCount(device.setValue, 3);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
