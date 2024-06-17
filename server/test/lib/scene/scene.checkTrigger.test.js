const sinon = require('sinon');
const { expect } = require('chai');
const EventEmitter = require('events');

const { assert, fake } = sinon;

const { EVENTS, ACTIONS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

// We are slowly moving this file to
// the "triggers" folder to have smaller test files

describe('scene.checkTrigger', () => {
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

  it('should execute scene', async () => {
    sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.DEVICE.NEW_STATE,
          device_feature: 'light-1',
          value: 12,
          operator: '=',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'light-1',
      last_value: 12,
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
  it('should not execute scene, scene not active', async () => {
    sceneManager.addScene({
      selector: 'my-scene',
      active: false,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.DEVICE.NEW_STATE,
          device_feature: 'light-1',
          value: 12,
          operator: '=',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'light-1',
      last_value: 12,
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
  it('should execute scene', async () => {
    const addedScene = sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'custom-time',
          date: '01-01-1990',
          time: '12:00',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.CHANGED,
      key: addedScene.triggers[0].key,
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
  it('should execute scene', async () => {
    const addedScene = sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.TIME.SUNRISE,
          house: 'house-1',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.SUNRISE,
      house: {
        selector: addedScene.triggers[0].house,
      },
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
  it('should execute scene', async () => {
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
          type: EVENTS.TIME.SUNSET,
          house: 'house-1',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.SUNSET,
      house: {
        selector: 'house-1',
      },
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
  it('should execute scene with empty house trigger', async () => {
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
          type: EVENTS.HOUSE.EMPTY,
          house: 'house-1',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.HOUSE.EMPTY,
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

  it('should execute scene with no longer empty house trigger', async () => {
    const addedScene = sceneManager.addScene({
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
          type: EVENTS.HOUSE.NO_LONGER_EMPTY,
          house: 'house-1',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.HOUSE.NO_LONGER_EMPTY,
      house: addedScene.triggers[0].house,
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

  it('should execute scene with user back home trigger', async () => {
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
          type: EVENTS.USER_PRESENCE.BACK_HOME,
          house: 'house-1',
          user: 'tony',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.USER_PRESENCE.BACK_HOME,
      house: 'house-1',
      user: 'tony',
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

  it('should execute scene with user left home trigger', async () => {
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
          type: EVENTS.USER_PRESENCE.LEFT_HOME,
          house: 'house-1',
          user: 'tony',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.USER_PRESENCE.LEFT_HOME,
      house: 'house-1',
      user: 'tony',
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

  it('should execute scene with user entered area trigger', async () => {
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
          type: EVENTS.AREA.USER_ENTERED,
          area: 'area-1',
          user: 'tony',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.AREA.USER_ENTERED,
      area: 'area-1',
      user: 'tony',
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

  it('should execute scene with user left area trigger', async () => {
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
          type: EVENTS.AREA.USER_LEFT,
          area: 'area-1',
          user: 'tony',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.AREA.USER_LEFT,
      area: 'area-1',
      user: 'tony',
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

  it('should execute scene with system start trigger', async () => {
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
          type: EVENTS.SYSTEM.START,
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.SYSTEM.START,
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

  it('should not execute scene, condition not verified', async () => {
    sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.DEVICE.NEW_STATE,
          device_feature: 'light-1',
          value: 12,
          operator: '=',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'light-1',
      last_value: 14,
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
  it('should not execute scene, threshold already passed', async () => {
    sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.DEVICE.NEW_STATE,
          device_feature: 'light-1',
          value: 12,
          operator: '>',
          threshold_only: true,
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'light-1',
      previous_value: 14,
      last_value: 14,
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
  it('should execute scene, threshold passed for the first time', async () => {
    sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.DEVICE.NEW_STATE,
          device_feature: 'light-1',
          value: 12,
          operator: '>',
          threshold_only: true,
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'light-1',
      previous_value: 11,
      last_value: 14,
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
  it('should not execute scene, event not matching', async () => {
    sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.LIGHT.TURNED_ON,
          device_feature: 'light-1',
          value: 12,
          operator: '=',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'light-1',
      last_value: 12,
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
  it('should throw an error', async () => {
    expect(() => {
      sceneManager.checkTrigger({
        type: 'one-unknown-event',
        device_feature: 'light-1',
        last_value: 12,
      });
    }).to.throw(Error, 'Trigger type "one-unknown-event" has no checker function.');
  });
  it('should execute scene, event & key matching', async () => {
    const addedScene = sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'interval',
          interval: 10,
          unit: 'hour',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.CHANGED,
      key: addedScene.triggers[0].key,
      scheduler_type: 'interval',
      interval: 10,
      unit: 'hour',
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
  it('should not execute scene, key not matching', async () => {
    sceneManager.addScene({
      selector: 'my-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'interval',
          interval: 10,
          unit: 'hour',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.TIME.CHANGED,
      key: 'not-the-same-key',
      scheduler_type: 'interval',
      interval: 10,
      unit: 'hour',
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
