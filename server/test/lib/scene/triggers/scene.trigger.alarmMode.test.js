const sinon = require('sinon');
const EventEmitter = require('events');

const { assert, fake } = sinon;

const { EVENTS, ACTIONS } = require('../../../../utils/constants');
const SceneManager = require('../../../../lib/scene');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('Scene.triggers.alarmMode', () => {
  let sceneManager;

  const device = {
    setValue: fake.resolves(null),
  };

  const brain = {};

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

    sceneManager = new SceneManager(stateManager, event, device, {}, {}, house, {}, {}, {}, scheduler, brain);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should execute scene with alarm.arm trigger', async () => {
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
          type: EVENTS.ALARM.ARM,
          house: 'house-1',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.ALARM.ARM,
      house: 'house-1',
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
  it('should execute scene with alarm.arming trigger', async () => {
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
          type: EVENTS.ALARM.ARMING,
          house: 'house-1',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.ALARM.ARMING,
      house: 'house-1',
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
  it('should execute scene with alarm.disarm trigger', async () => {
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
          type: EVENTS.ALARM.DISARM,
          house: 'house-1',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.ALARM.DISARM,
      house: 'house-1',
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
  it('should execute scene with alarm.partial-arm trigger', async () => {
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
          type: EVENTS.ALARM.PARTIAL_ARM,
          house: 'house-1',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.ALARM.PARTIAL_ARM,
      house: 'house-1',
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
  it('should execute scene with alarm.panic trigger', async () => {
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
          type: EVENTS.ALARM.PANIC,
          house: 'house-1',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.ALARM.PANIC,
      house: 'house-1',
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
  it('should not execute scene (house not matching)', async () => {
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
          type: EVENTS.ALARM.ARM,
          house: 'house-2',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.ALARM.ARM,
      house: 'house-1',
    });
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.notCalled(device.setValue);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
