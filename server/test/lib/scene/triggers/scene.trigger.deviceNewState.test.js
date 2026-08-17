const sinon = require('sinon').createSandbox();
const { expect } = require('chai');
const EventEmitter = require('events');
const Promise = require('bluebird');

const { assert, fake } = sinon;

const { EVENTS, ACTIONS } = require('../../../../utils/constants');
const SceneManager = require('../../../../lib/scene');
const StateManager = require('../../../../lib/state');
const { waitUntil } = require('../../../helpers/waitUntil');

const event = new EventEmitter();

describe('scene.triggers.deviceNewState', () => {
  let sceneManager;
  let device;

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

    device = {
      setValue: fake.resolves(null),
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
    stateManager.setState('deviceFeature', 'light-1', {
      last_value: 14,
    });
    sceneManager = new SceneManager(stateManager, event, device, {}, {}, house, {}, {}, {}, scheduler, brain, service);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should execute scene', async () => {
    await sceneManager.addScene({
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
  it('should execute scene when the event feature is one of the trigger device_features', async () => {
    await sceneManager.addScene({
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
          device_features: ['motion-sensor-1', 'motion-sensor-2'],
          value: 1,
          operator: '=',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'motion-sensor-2',
      last_value: 1,
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
  it('should not execute scene when the event feature is not in the trigger device_features', async () => {
    await sceneManager.addScene({
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
          device_features: ['motion-sensor-1', 'motion-sensor-2'],
          value: 1,
          operator: '=',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'motion-sensor-3',
      last_value: 1,
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
  it('should start one independent timer per feature of a multi-features trigger', async () => {
    await sceneManager.addScene({
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
          device_features: ['motion-sensor-1', 'motion-sensor-2'],
          value: 1,
          operator: '=',
          for_duration: 10 * 60 * 1000,
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'motion-sensor-1',
      previous_value: 0,
      last_value: 1,
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'motion-sensor-2',
      previous_value: 0,
      last_value: 1,
    });
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.notCalled(device.setValue);
          expect(sceneManager.checkTriggersDurationTimer.size).to.equal(2);
          const timerKeys = [];
          sceneManager.checkTriggersDurationTimer.forEach((value, timeoutKey) => {
            timerKeys.push(timeoutKey);
            clearTimeout(value);
          });
          expect(timerKeys).to.have.members([
            'device.new-state.my-scene.motion-sensor-1:=:1',
            'device.new-state.my-scene.motion-sensor-2:=:1',
          ]);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
  it('should run each duration timer of a multi-features trigger independently', async () => {
    sceneManager.stateManager.setState('deviceFeature', 'motion-sensor-1', {
      last_value: 1,
    });
    sceneManager.stateManager.setState('deviceFeature', 'motion-sensor-2', {
      last_value: 1,
    });
    await sceneManager.addScene({
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
          device_features: ['motion-sensor-1', 'motion-sensor-2'],
          value: 1,
          operator: '=',
          for_duration: 0, // now
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'motion-sensor-1',
      previous_value: 0,
      last_value: 1,
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'motion-sensor-2',
      previous_value: 0,
      last_value: 1,
    });
    // Each feature schedules its own timer: when both fire, each callback re-checks the
    // state of its own feature and the scene runs once per feature.
    await waitUntil(() => device.setValue.calledTwice, { message: 'the scene to be executed twice' });
    await waitUntil(() => sceneManager.queue.length === 0, { message: 'the scene queue to be empty' });
    assert.calledTwice(device.setValue);
    expect(sceneManager.checkTriggersDurationTimer.size).to.equal(0);
  });
  it('should not execute scene, scene not active', async () => {
    await sceneManager.addScene({
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
  it('should not execute scene, condition not verified', async () => {
    await sceneManager.addScene({
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
  it('should not execute scene, device feature is not the same', async () => {
    await sceneManager.addScene({
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
      device_feature: 'light-2',
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
    await sceneManager.addScene({
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
    await sceneManager.addScene({
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
  it('should start timer to check later for state and not follow current scene', async () => {
    await sceneManager.addScene({
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
          for_duration: 10 * 60 * 1000,
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
          assert.notCalled(device.setValue);
          expect(sceneManager.checkTriggersDurationTimer.size).to.equal(1);
          sceneManager.checkTriggersDurationTimer.forEach((value, timeoutKey) => {
            expect(timeoutKey).to.equal('device.new-state.my-scene.light-1:>:12');
            clearTimeout(value);
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
  it('should start timer to check now and condition should still be valid on second call', async () => {
    await sceneManager.addScene({
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
          for_duration: 0, // now
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'light-1',
      previous_value: 11,
      last_value: 14,
    });
    // The scene is not executed synchronously: the trigger first schedules a timer,
    // and the scene is only queued when this timer fires. So we wait for the scene
    // to be executed, then for the queue to be empty, instead of waiting a fixed delay.
    await waitUntil(() => device.setValue.called, { message: 'the scene to be executed' });
    await waitUntil(() => sceneManager.queue.length === 0, { message: 'the scene queue to be empty' });
    assert.calledOnce(device.setValue);
    expect(sceneManager.checkTriggersDurationTimer.size).to.equal(0);
  });
  it('should start timer to check now and re-send new value still validating the condition', async () => {
    await sceneManager.addScene({
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
          threshold_only: false,
          for_duration: 5,
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'light-1',
      previous_value: 11,
      last_value: 14,
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'light-1',
      previous_value: 14,
      last_value: 14,
    });
    // Same as above: the scene is only queued when the trigger timer fires.
    await waitUntil(() => device.setValue.called, { message: 'the scene to be executed' });
    await waitUntil(() => sceneManager.queue.length === 0, { message: 'the scene queue to be empty' });
    assert.calledOnce(device.setValue);
    expect(sceneManager.checkTriggersDurationTimer.size).to.equal(0);
  });
  it('should start timer to check now and condition should not be valid on second call', async () => {
    await sceneManager.addScene({
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
          for_duration: 10, // In 10ms
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'light-1',
      previous_value: 11,
      last_value: 14,
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'light-1',
      previous_value: 14,
      last_value: 5,
    });
    // The timer is cancelled synchronously by the second event, we wait longer than
    // the trigger duration (10ms) to be sure it doesn't fire anyway.
    await Promise.delay(100);
    assert.notCalled(device.setValue);
    expect(sceneManager.checkTriggersDurationTimer.size).to.equal(0);
  });
  it('should execute scene with string value equality (text device feature like Shelly Button)', async () => {
    await sceneManager.addScene({
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
          device_feature: 'shelly-button-1',
          value: 'SS', // Double press event
          operator: '=',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'shelly-button-1',
      previous_value: 'S',
      last_value: 'SS',
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
  it('should not execute scene with string value equality when value does not match', async () => {
    await sceneManager.addScene({
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
          device_feature: 'shelly-button-1',
          value: 'SS', // Double press event
          operator: '=',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'shelly-button-1',
      previous_value: null,
      last_value: 'S', // Single press, not double
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
  it('should execute scene with string value inequality', async () => {
    await sceneManager.addScene({
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
          device_feature: 'shelly-button-1',
          value: 'S', // Not single press
          operator: '!=',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'shelly-button-1',
      previous_value: 'S',
      last_value: 'SS', // Double press, different from 'S'
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
  it('should not execute scene with string value inequality when value matches', async () => {
    await sceneManager.addScene({
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
          device_feature: 'shelly-button-1',
          value: 'S',
          operator: '!=',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'shelly-button-1',
      previous_value: 'SS',
      last_value: 'S', // Same as trigger value, should not execute
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
  it('should execute scene on any state change with the "changed" operator', async () => {
    await sceneManager.addScene({
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
          device_feature: 'thermostat-1',
          operator: 'changed',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'thermostat-1',
      previous_value: 18,
      last_value: 21,
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
  it('should execute scene with the "changed" operator when the feature had no previous value', async () => {
    await sceneManager.addScene({
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
          device_feature: 'thermostat-1',
          operator: 'changed',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'thermostat-1',
      previous_value: null,
      last_value: 21,
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
  it('should not execute scene with the "changed" operator when the device sends the same value', async () => {
    await sceneManager.addScene({
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
          device_feature: 'thermostat-1',
          operator: 'changed',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'thermostat-1',
      previous_value: 21,
      last_value: 21,
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
  it('should not execute scene with the "changed" operator when the event is on another feature', async () => {
    await sceneManager.addScene({
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
          device_features: ['thermostat-1', 'thermostat-2'],
          operator: 'changed',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'thermostat-3',
      previous_value: 18,
      last_value: 21,
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
  it('should execute scene on any state change of one of the device_features', async () => {
    await sceneManager.addScene({
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
          device_features: ['thermostat-1', 'thermostat-2'],
          operator: 'changed',
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'thermostat-2',
      previous_value: 'heating',
      last_value: 'idle',
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
  it('should ignore threshold_only and for_duration with the "changed" operator', async () => {
    await sceneManager.addScene({
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
          device_feature: 'thermostat-1',
          operator: 'changed',
          // Both options are hidden by the UI in "any change" mode, but a trigger saved
          // before, or written by hand, must not schedule a timer or swallow the change
          threshold_only: true,
          for_duration: 10 * 60 * 1000,
        },
      ],
    });
    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'thermostat-1',
      previous_value: 18,
      last_value: 21,
    });
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledOnce(device.setValue);
          expect(sceneManager.checkTriggersDurationTimer.size).to.equal(0);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
