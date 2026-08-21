const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const EventEmitter = require('events');
const StateManager = require('../../../../lib/state');
const SceneManager = require('../../../../lib/scene');
const { ACTIONS, EVENTS } = require('../../../../utils/constants');

const event = new EventEmitter();

describe('Scene.triggers.mqttReceived', () => {
  let sceneManager;

  const device = {
    setValue: fake.resolves(null),
  };

  const brain = {};

  const message = {
    sendToUser: fake.resolves(null),
  };

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

    sceneManager = new SceneManager(
      stateManager,
      event,
      device,
      message,
      {},
      house,
      {},
      {},
      {},
      scheduler,
      brain,
      service,
    );
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

  it('should inject the received topic and message as variables in the scene actions', async () => {
    await sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.MESSAGE.SEND,
            user: 'john',
            text: 'Received on {{triggerEvent.topic}}: {{triggerEvent.message}}',
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.MQTT.RECEIVED,
          topic: 'my/topic',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      topic: 'my/topic',
      message: 'Hello world',
    });
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledWith(message.sendToUser, 'john', 'Received on my/topic: Hello world', null, {
            service: undefined,
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should not continue the scene if the received message does not verify the condition', async () => {
    await sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
            conditions: [
              {
                variable: 'triggerEvent.message',
                operator: '=',
                value: 'ON',
              },
            ],
          },
        ],
        [
          {
            type: ACTIONS.MESSAGE.SEND,
            user: 'john',
            text: 'The light is {{triggerEvent.message}}',
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.MQTT.RECEIVED,
          topic: 'my/topic',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.MQTT.RECEIVED,
      topic: 'my/topic',
      message: 'OFF',
    });
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.notCalled(message.sendToUser);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should continue the scene if the received message verifies the condition', async () => {
    await sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
            conditions: [
              {
                variable: 'triggerEvent.message',
                operator: '=',
                value: 'ON',
              },
            ],
          },
        ],
        [
          {
            type: ACTIONS.MESSAGE.SEND,
            user: 'john',
            text: 'The light is {{triggerEvent.message}}',
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.MQTT.RECEIVED,
          topic: 'my/topic',
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
          assert.calledWith(message.sendToUser, 'john', 'The light is ON', null, { service: undefined });
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
});
