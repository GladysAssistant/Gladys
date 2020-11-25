const { assert, fake } = require('sinon');
const chaiAssert = require('chai').assert;
const { expect } = require('chai');
const EventEmitter = require('events');
const { ACTIONS } = require('../../../utils/constants');
const { AbortScene } = require('../../../utils/coreErrors');
const { executeActions } = require('../../../lib/scene/scene.executeActions');

const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('scene.executeActions', () => {
  it('should execute light turn on', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
      ],
      {},
    );
    assert.calledOnce(device.setValue);
  });
  it('should execute switch turn on', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.SWITCH.TURN_ON,
            devices: ['switch-1'],
          },
        ],
      ],
      {},
    );
    assert.calledOnce(device.setValue);
  });
  it('should execute wait 5 ms', async () => {
    await executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'milliseconds',
            value: 5,
          },
        ],
      ],
      {},
    );
    await executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'seconds',
            value: 5 / 1000,
          },
        ],
      ],
      {},
    );
    await executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'minutes',
            value: 5 / 1000 / 60,
          },
        ],
      ],
      {},
    );
    await executeActions(
      { event },
      [
        [
          {
            type: ACTIONS.TIME.DELAY,
            unit: 'hours',
            value: 5 / 1000 / 60 / 60,
          },
        ],
      ],
      {},
    );
  });
  it('should execute sequential actions', async () => {
    const device = {
      setValue: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
            devices: ['light-1'],
          },
        ],
        [
          {
            type: ACTIONS.SWITCH.TURN_ON,
            devices: ['switch-1'],
          },
        ],
        [
          {
            type: ACTIONS.SWITCH.TURN_OFF,
            devices: ['switch-1'],
          },
        ],
      ],
      {},
    );
    assert.callCount(device.setValue, 4);
  });
  it('should throw error, action type does not exist', async () => {
    const light = {
      turnOn: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'light-1', light);
    const promise = executeActions(
      { stateManager, event },
      [
        [
          {
            type: 'THISDOESNOTEXIST',
            device: 'light-1',
          },
        ],
      ],
      {},
    );
    return chaiAssert.isRejected(promise, 'Action type "THISDOESNOTEXIST" does not exist.');
  });
  it('should execute action device.setValue', async () => {
    const example = {
      stop: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('service', 'example', example);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      device_id: 'device-id',
    });
    stateManager.setState('deviceById', 'device-id', {
      id: 'device-id',
      features: [],
    });
    const device = {
      setValue: fake.resolves(null),
    };
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device_feature: 'my-device-feature',
            value: 11,
          },
        ],
      ],
      {},
    );
    assert.calledWith(
      device.setValue,
      {
        id: 'device-id',
        features: [],
      },
      { device_id: 'device-id' },
      11,
    );
  });
  it('should execute action device.setValue', async () => {
    const example = {
      stop: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    stateManager.setState('service', 'example', example);
    stateManager.setState('device', 'my-device', {
      id: 'device-id',
      features: [
        {
          category: 'light',
          type: 'binary',
        },
      ],
    });
    const device = {
      setValue: fake.resolves(null),
    };
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device: 'my-device',
            feature_category: 'light',
            feature_type: 'binary',
            value: 1,
          },
        ],
      ],
      {},
    );
    assert.calledWith(
      device.setValue,
      {
        id: 'device-id',
        features: [
          {
            category: 'light',
            type: 'binary',
          },
        ],
      },
      {
        category: 'light',
        type: 'binary',
      },
      1,
    );
  });
  it('should execute action device.getValue', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
      ],
      scope,
    );
    expect(scope).to.deep.equal({ '0.0.last_value': 15 });
  });
  it('should abort scene, condition is not verified', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    const scope = {};
    const promise = executeActions(
      { stateManager, event, device },
      [
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
      scope,
    );
    return chaiAssert.isRejected(promise, AbortScene);
  });
  it('should finish scene, condition is verified', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const device = {
      setValue: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, device },
      [
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
                value: 15,
              },
            ],
          },
        ],
      ],
      scope,
    );
  });
});
