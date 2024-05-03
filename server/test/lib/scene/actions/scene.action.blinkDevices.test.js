const { fake, assert, useFakeTimers } = require('sinon');
const EventEmitter = require('events');

const { ACTIONS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('scene.blink-lights', () => {
  let clock;

  beforeEach(() => {
    clock = useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('should blink light in slow mode', async () => {
    const stateManager = new StateManager(event);
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

    const scope = {};
    executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.BLINK,
            devices: ['light-1'],
            blinking_speed: 'slow',
            blinking_time: 2,
          },
        ],
      ],
      scope,
    );
    await clock.tickAsync(3000);
    assert.calledWithExactly(device.setValue, device, deviceFeature, 0);
    assert.calledWithExactly(device.setValue, device, deviceFeature, 1);
    assert.callCount(device.setValue, 4);
  });

  it('should blink light in medium mode', async () => {
    const stateManager = new StateManager(event);
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

    const scope = {};
    executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.BLINK,
            devices: ['light-1'],
            blinking_speed: 'medium',
            blinking_time: 2,
          },
        ],
      ],
      scope,
    );
    await clock.tickAsync(3000);
    assert.calledWithExactly(device.setValue, device, deviceFeature, 0);
    assert.calledWithExactly(device.setValue, device, deviceFeature, 1);
    assert.callCount(device.setValue, 6);
  });

  it('should blink light in fast mode', async () => {
    const stateManager = new StateManager(event);
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

    const scope = {};
    executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.BLINK,
            devices: ['light-1'],
            blinking_speed: 'fast',
            blinking_time: 2,
          },
        ],
      ],
      scope,
    );
    await clock.tickAsync(3000);
    assert.calledWithExactly(device.setValue, device, deviceFeature, 0);
    assert.calledWithExactly(device.setValue, device, deviceFeature, 1);
    assert.callCount(device.setValue, 12);
  });

  it('should blink switch in fast mode', async () => {
    const stateManager = new StateManager(event);
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

    const scope = {};
    executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.BLINK,
            devices: ['switch-1'],
            blinking_speed: 'fast',
            blinking_time: 2,
          },
        ],
      ],
      scope,
    );
    await clock.tickAsync(3000);
    assert.calledWithExactly(device.setValue, device, deviceFeature, 0);
    assert.calledWithExactly(device.setValue, device, deviceFeature, 1);
    assert.callCount(device.setValue, 12);
  });

  it('should blink light in unknown mode', async () => {
    const stateManager = new StateManager(event);
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

    const scope = {};
    executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.LIGHT.BLINK,
            devices: ['light-1'],
            blinking_speed: 'unknown',
            blinking_time: 2,
          },
        ],
      ],
      scope,
    );
    await clock.tickAsync(3000);
    assert.calledWithExactly(device.setValue, device, deviceFeature, 0);
    assert.calledWithExactly(device.setValue, device, deviceFeature, 1);
    assert.callCount(device.setValue, 12);
  });

  it('should throw error when blinking light', async () => {
    const stateManager = new StateManager(event);
    const device = {
      setValue: fake.throws('An error occured'),
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
            type: ACTIONS.LIGHT.BLINK,
            devices: ['my-device'],
            blinking_speed: 'slow',
            blinking_time: 1,
          },
        ],
      ],
      {},
    );
    assert.notCalled(device.setValue);
  });
});
