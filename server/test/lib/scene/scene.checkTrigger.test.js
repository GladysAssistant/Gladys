const { assert, fake } = require('sinon');
const { expect } = require('chai');
const EventEmitter = require('events');

const { EVENTS, ACTIONS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('scene.checkTrigger', () => {
  it('should execute scene', async () => {
    const stateManager = new StateManager();
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    sceneManager.addScene({
      selector: 'my-scene',
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
  it('should execute scene', async () => {
    const stateManager = new StateManager();
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    const addedScene = sceneManager.addScene({
      selector: 'my-scene',
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
  it('should not execute scene, condition not verified', async () => {
    const stateManager = new StateManager();
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    sceneManager.addScene({
      selector: 'my-scene',
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
    const stateManager = new StateManager();
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    sceneManager.addScene({
      selector: 'my-scene',
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
    const stateManager = new StateManager();
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    sceneManager.addScene({
      selector: 'my-scene',
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
    const stateManager = new StateManager();
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    sceneManager.addScene({
      selector: 'my-scene',
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
    const stateManager = new StateManager();
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    expect(() => {
      sceneManager.checkTrigger({
        type: 'one-unknown-event',
        device_feature: 'light-1',
        last_value: 12,
      });
    }).to.throw(Error, 'Trigger type "one-unknown-event" has no checker function.');
  });
  it('should execute scene, event & key matching', async () => {
    const stateManager = new StateManager();
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    const addedScene = sceneManager.addScene({
      selector: 'my-scene',
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
    const stateManager = new StateManager();
    const device = {
      setValue: fake.resolves(null),
    };
    const sceneManager = new SceneManager(stateManager, event, device);
    sceneManager.addScene({
      selector: 'my-scene',
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
