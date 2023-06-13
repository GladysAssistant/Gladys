const { assert, fake } = require('sinon');
const chaiAssert = require('chai').assert;
const EventEmitter = require('events');
const cloneDeep = require('lodash.clonedeep');
const { ACTIONS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { AbortScene } = require('../../../utils/coreErrors');
const { executeActions } = require('../../../lib/scene/scene.executeActions');

const StateManager = require('../../../lib/state');

// WE ARE SLOWLY MOVING ALL TESTS FROM THIS BIG FILE
// TO A SMALLER SET OF FILE IN THE "ACTIONS" FOLDER.

describe('scene.executeActions', () => {
  let event;
  let stateManager;

  beforeEach(() => {
    event = new EventEmitter();
    stateManager = new StateManager(event);
  });

  it('should execute light turn on', async () => {
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    };
    const device = {
      setValue: fake.resolves(null),
      features: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        find: fake.returns(deviceFeature),
      },
    };

    stateManager.setState('device', 'light-1', device);
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
    assert.calledOnceWithExactly(device.setValue, device, deviceFeature, 1);
  });
  it('should execute light turn off', async () => {
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    };
    const device = {
      setValue: fake.resolves(null),
      features: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        find: fake.returns(deviceFeature),
      },
    };

    stateManager.setState('device', 'light-1', device);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.TURN_OFF,
            devices: ['light-1'],
          },
        ],
      ],
      {},
    );
    assert.calledOnceWithExactly(device.setValue, device, deviceFeature, 0);
  });
  it('should execute light toggle on', async () => {
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      last_value: 0,
    };
    const device = {
      setValue: fake.resolves(null),
      features: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        find: fake.returns(deviceFeature),
      },
    };

    stateManager.setState('device', 'light-1', device);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.TOGGLE,
            devices: ['light-1'],
          },
        ],
      ],
      {},
    );
    assert.calledOnceWithExactly(device.setValue, device, deviceFeature, 1);
  });
  it('should execute light toggle off', async () => {
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      last_value: 1,
    };
    const device = {
      setValue: fake.resolves(null),
      features: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        find: fake.returns(deviceFeature),
      },
    };

    stateManager.setState('device', 'light-1', device);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.TOGGLE,
            devices: ['light-1'],
          },
        ],
      ],
      {},
    );
    assert.calledOnceWithExactly(device.setValue, device, deviceFeature, 0);
  });
  it('should execute light toggle error', async () => {
    const device = {
      setValue: fake.resolves(null),
      features: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        find: fake.throws('An error occured'),
      },
    };

    stateManager.setState('device', 'light-1', device);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.TOGGLE,
            devices: ['light-1'],
          },
        ],
      ],
      {},
    );
    assert.notCalled(device.setValue);
  });
  it('should execute switch turn on', async () => {
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };
    const device = {
      setValue: fake.resolves(null),
      features: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        find: fake.returns(deviceFeature),
      },
    };

    stateManager.setState('device', 'switch-1', device);
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
    assert.calledOnceWithExactly(device.setValue, device, deviceFeature, 1);
  });
  it('should execute switch turn off', async () => {
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };
    const device = {
      setValue: fake.resolves(null),
      features: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        find: fake.returns(deviceFeature),
      },
    };

    stateManager.setState('device', 'switch-1', device);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.SWITCH.TURN_OFF,
            devices: ['switch-1'],
          },
        ],
      ],
      {},
    );
    assert.calledOnceWithExactly(device.setValue, device, deviceFeature, 0);
  });
  it('should execute switch toggle on', async () => {
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      last_value: 0,
    };
    const device = {
      setValue: fake.resolves(null),
      features: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        find: fake.returns(deviceFeature),
      },
    };

    stateManager.setState('device', 'switch-1', device);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.SWITCH.TOGGLE,
            devices: ['switch-1'],
          },
        ],
      ],
      {},
    );
    assert.calledOnceWithExactly(device.setValue, device, deviceFeature, 1);
  });
  it('should execute switch toggle off', async () => {
    const deviceFeature = {
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      last_value: 1,
    };
    const device = {
      setValue: fake.resolves(null),
      features: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        find: fake.returns(deviceFeature),
      },
    };

    stateManager.setState('device', 'switch-1', device);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.SWITCH.TURN_OFF,
            devices: ['switch-1'],
          },
        ],
      ],
      {},
    );
    assert.calledOnceWithExactly(device.setValue, device, deviceFeature, 0);
  });
  it('should execute switch toggle error', async () => {
    const device = {
      setValue: fake.resolves(null),
      features: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
        find: fake.throws('An error occured'),
      },
    };

    stateManager.setState('device', 'switch-1', device);
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.SWITCH.TOGGLE,
            devices: ['switch-1'],
          },
        ],
      ],
      {},
    );
    assert.notCalled(device.setValue);
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
  it('should execute action device.setValue (with value=0)', async () => {
    const example = {
      stop: fake.resolves(null),
    };

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
            value: 0,
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
      0,
    );
  });
  it('should execute action device.setValue with evaluable value', async () => {
    const example = {
      stop: fake.resolves(null),
    };

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
            evaluate_value: '0 + 1',
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
  it('should abort scene value is not valid number in device.setValue', async () => {
    const example = {
      stop: fake.resolves(null),
    };

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
    const promise = executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device: 'my-device',
            feature_category: 'light',
            feature_type: 'binary',
            value: 'wrong_string',
          },
        ],
      ],
      {},
    );
    return chaiAssert.isRejected(promise, AbortScene, 'ACTION_VALUE_NOT_A_NUMBER');
  });

  it('should execute action user.setSeenAtHome', async () => {
    const house = {
      userSeen: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.USER.SET_SEEN_AT_HOME,
            user: 'john',
            house: 'my-house',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(house.userSeen, 'my-house', 'john');
  });
  it('should execute action user.setLeftHome', async () => {
    const house = {
      userLeft: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.USER.SET_OUT_OF_HOME,
            user: 'john',
            house: 'my-house',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(house.userLeft, 'my-house', 'john');
  });
  it('should execute action user.checkPresence and not call userLeft because user was seen', async () => {
    stateManager.setState('deviceFeature', 'my-device', {
      last_value_changed: Date.now(),
    });
    const house = {
      userSeen: fake.resolves(null),
      userLeft: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.USER.CHECK_PRESENCE,
            user: 'john',
            house: 'my-house',
            minutes: 10,
            device_features: ['my-device'],
          },
        ],
      ],
      scope,
    );
    assert.notCalled(house.userLeft);
  });
  it('should execute action user.checkPresence and call userLeft because user was not seen', async () => {
    stateManager.setState('deviceFeature', 'my-device', {
      last_value_changed: Date.now() - 15 * 60 * 1000,
    });
    const house = {
      userSeen: fake.resolves(null),
      userLeft: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.USER.CHECK_PRESENCE,
            user: 'john',
            house: 'my-house',
            minutes: 10,
            device_features: ['my-device'],
          },
        ],
      ],
      scope,
    );
    assert.calledWith(house.userLeft, 'my-house', 'john');
  });

  it('should abort scene, house empty is not verified', async () => {
    const house = {
      isEmpty: fake.resolves(false),
    };
    const scope = {};
    const promise = executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.HOUSE.IS_EMPTY,
            house: 'my-house',
          },
        ],
      ],
      scope,
    );
    return chaiAssert.isRejected(promise, AbortScene);
  });
  it('should finish, house empty is verified', async () => {
    const house = {
      isEmpty: fake.resolves(true),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.HOUSE.IS_EMPTY,
            house: 'my-house',
          },
        ],
      ],
      scope,
    );
  });
  it('should abort scene, house not empty is not verified', async () => {
    const house = {
      isEmpty: fake.resolves(true),
    };
    const scope = {};
    const promise = executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.HOUSE.IS_NOT_EMPTY,
            house: 'my-house',
          },
        ],
      ],
      scope,
    );
    return chaiAssert.isRejected(promise, AbortScene);
  });
  it('should finish scene, house not empty is verified', async () => {
    const house = {
      isEmpty: fake.resolves(false),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, house },
      [
        [
          {
            type: ACTIONS.HOUSE.IS_NOT_EMPTY,
            house: 'my-house',
          },
        ],
      ],
      scope,
    );
  });

  it('should execute action scene.start', async () => {
    const execute = fake.resolves(undefined);

    const scope = {
      alreadyExecutedScenes: new Set(),
    };

    await executeActions(
      { stateManager, event, execute },
      [
        [
          {
            type: ACTIONS.SCENE.START,
            scene: 'other_scene_selector',
          },
        ],
      ],
      scope,
    );
    const clonedScope = cloneDeep(scope);
    // we try to pollute the scope, and see if the called scene was affected by this pollution
    // it should not affect a running scene
    scope.test = 1;
    assert.calledWith(execute, 'other_scene_selector', clonedScope);
  });

  it('should not execute action scene.start when the scene has already been called as part of this chain', async () => {
    const execute = fake.resolves(undefined);

    const scope = {
      alreadyExecutedScenes: new Set(['other_scene_selector']),
    };

    await executeActions(
      { stateManager, event, execute },
      [
        [
          {
            type: ACTIONS.SCENE.START,
            scene: 'other_scene_selector',
          },
        ],
      ],
      scope,
    );
    assert.notCalled(execute);
  });
});
