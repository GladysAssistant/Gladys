const { fake } = require('sinon');
const EventEmitter = require('events');
const chaiAssert = require('chai').assert;

const { ACTIONS } = require('../../../../utils/constants');
const { AbortScene } = require('../../../../utils/coreErrors');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');

describe('scene.continue-only-if', () => {
  let event;
  let stateManager;

  beforeEach(() => {
    event = new EventEmitter();
    stateManager = new StateManager(event);
  });

  it('should abort scene, condition is not verified', async () => {
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
    return chaiAssert.isRejected(promise, AbortScene, 'CONDITION_NOT_VERIFIED');
  });
  it('should abort scene, condition value is not a number', async () => {
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
                value: 'wrong_string',
              },
            ],
          },
        ],
      ],
      scope,
    );
    return chaiAssert.isRejected(promise, AbortScene, 'CONDITION_VALUE_NOT_A_NUMBER');
  });
  it('should finish scene, condition is verified', async () => {
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
  it('should finish scene, condition is verified (value=0)', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 0,
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
                value: 0,
              },
            ],
          },
        ],
      ],
      scope,
    );
  });
  it('should finish scene, condition is verified with evaluable value', async () => {
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
                evaluate_value: '5 * 3',
              },
            ],
          },
        ],
      ],
      scope,
    );
  });
  it('should finish scene, condition is verified', async () => {
    const http = {
      request: fake.resolves({ result: [18], error: null }),
    };
    const device = {
      setValue: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, device, http },
      [
        [
          {
            type: ACTIONS.HTTP.REQUEST,
            method: 'post',
            url: 'http://test.test',
            body: '{"toto":"toto"}',
            headers: [],
          },
        ],
        [
          {
            type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
            conditions: [
              {
                variable: '0.0.result.[0]',
                operator: '=',
                value: 18,
              },
            ],
          },
        ],
      ],
      scope,
    );
  });
});
