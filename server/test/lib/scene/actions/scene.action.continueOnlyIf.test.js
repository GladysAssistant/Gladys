const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;
const EventEmitter = require('events');
const chaiAssert = require('chai').assert;

const { ACTIONS } = require('../../../../utils/constants');
const { AbortScene } = require('../../../../utils/coreErrors');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');
const actionsFunc = require('../../../../lib/scene/scene.actions');

describe('scene.continue-only-if', () => {
  let event;
  let stateManager;
  const { executeActions } = executeActionsFactory(actionsFunc);

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
  it('should abort scene, condition value is not a number for numeric operator', async () => {
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
                operator: '>',
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
  it('should abort scene and not run following actions, condition formula cannot be evaluated', async () => {
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
                // "unknownFunction" is not part of the restricted formula engine namespace,
                // so evaluating this condition throws. It is deliberately a name mathjs will
                // never define, so extending the namespace cannot make this formula valid.
                evaluate_value: 'unknownFunction(400)',
              },
            ],
          },
        ],
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device_feature: 'my-device-feature',
            value: 99,
          },
        ],
      ],
      scope,
    );
    await chaiAssert.isRejected(promise, AbortScene, 'CONDITION_VALUE_NOT_A_NUMBER');
    // The guard must fail closed: the action after it must not have been executed.
    assert.notCalled(device.setValue);
  });
  it('should abort scene when the condition formula returns a non-finite number', async () => {
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
                operator: '<',
                // exp() overflows to Infinity without throwing: comparing against it would
                // silently always be true instead of surfacing the broken formula.
                evaluate_value: 'exp(1000)',
              },
            ],
          },
        ],
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device_feature: 'my-device-feature',
            value: 99,
          },
        ],
      ],
      scope,
    );
    await chaiAssert.isRejected(promise, AbortScene, 'CONDITION_VALUE_NOT_A_NUMBER');
    // The guard must fail closed: the action after it must not have been executed.
    assert.notCalled(device.setValue);
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
  it('should finish scene, string condition is verified with = operator', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'text',
      type: 'text',
      last_value_string: 'SS',
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
                variable: '0.0.last_value_string',
                operator: '=',
                value: 'SS',
              },
            ],
          },
        ],
      ],
      scope,
    );
  });
  it('should abort scene, string condition is not verified with = operator', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'text',
      type: 'text',
      last_value_string: 'S',
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
                variable: '0.0.last_value_string',
                operator: '=',
                value: 'SS',
              },
            ],
          },
        ],
      ],
      scope,
    );
    return chaiAssert.isRejected(promise, AbortScene, 'CONDITION_NOT_VERIFIED');
  });
  it('should finish scene, string condition is verified with != operator', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'text',
      type: 'text',
      last_value_string: 'SS',
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
                variable: '0.0.last_value_string',
                operator: '!=',
                value: 'S',
              },
            ],
          },
        ],
      ],
      scope,
    );
  });
  it('should abort scene, string condition is not verified with != operator', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'text',
      type: 'text',
      last_value_string: 'SS',
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
                variable: '0.0.last_value_string',
                operator: '!=',
                value: 'SS',
              },
            ],
          },
        ],
      ],
      scope,
    );
    return chaiAssert.isRejected(promise, AbortScene, 'CONDITION_NOT_VERIFIED');
  });
  describe('condition on the current state of a device feature', () => {
    const runCondition = (condition, scope = {}) =>
      executeActions(
        { stateManager, event },
        [[{ type: ACTIONS.CONDITION.ONLY_CONTINUE_IF, conditions: [condition] }]],
        scope,
      );

    it('should finish scene, the state of the feature verifies the condition', async () => {
      stateManager.setState('deviceFeature', 'my-device-feature', {
        category: 'temperature-sensor',
        type: 'decimal',
        last_value: 15,
      });
      const scope = {};
      await runCondition({ device_feature: 'my-device-feature', operator: '=', value: 15 }, scope);
      // nothing is written in the scope: the state is read, not exposed as a variable
      chaiAssert.deepEqual(scope, {});
    });
    it('should abort scene, the state of the feature does not verify the condition', async () => {
      stateManager.setState('deviceFeature', 'my-device-feature', {
        category: 'temperature-sensor',
        type: 'decimal',
        last_value: 15,
      });
      const promise = runCondition({ device_feature: 'my-device-feature', operator: '>', value: 20 });
      return chaiAssert.isRejected(promise, AbortScene, 'CONDITION_NOT_VERIFIED');
    });
    it('should read the state of the feature when the condition runs, not when the scene starts', async () => {
      stateManager.setState('deviceFeature', 'my-device-feature', {
        category: 'switch',
        type: 'binary',
        last_value: 0,
      });
      // the feature changes while the scene is already running
      const promise = executeActions(
        { stateManager, event },
        [
          [{ type: ACTIONS.TIME.DELAY, unit: 'milliseconds', value: 5 }],
          [
            {
              type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
              conditions: [{ device_feature: 'my-device-feature', operator: '=', value: 1 }],
            },
          ],
        ],
        {},
      );
      stateManager.setState('deviceFeature', 'my-device-feature', {
        category: 'switch',
        type: 'binary',
        last_value: 1,
      });
      await promise;
    });
    it('should compare the value of the feature with a computed value', async () => {
      stateManager.setState('deviceFeature', 'my-device-feature', {
        category: 'temperature-sensor',
        type: 'decimal',
        last_value: 22,
      });
      stateManager.setState('deviceFeature', 'my-setpoint', {
        category: 'thermostat',
        type: 'target-temperature',
        last_value: 19,
      });
      await executeActions(
        { stateManager, event },
        [
          [{ type: ACTIONS.DEVICE.GET_VALUE, device_feature: 'my-setpoint' }],
          [
            {
              type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
              conditions: [
                { device_feature: 'my-device-feature', operator: '>', evaluate_value: '{{0.0.last_value}} + 2' },
              ],
            },
          ],
        ],
        {},
      );
    });
    it('should compare the string state of a text feature', async () => {
      stateManager.setState('deviceFeature', 'my-device-feature', {
        category: 'text',
        type: 'text',
        last_value: null,
        last_value_string: 'hello',
      });
      await runCondition({ device_feature: 'my-device-feature', operator: '=', value: 'hello' });
      const promise = runCondition({ device_feature: 'my-device-feature', operator: '!=', value: 'hello' });
      return chaiAssert.isRejected(promise, AbortScene, 'CONDITION_NOT_VERIFIED');
    });
    it('should compare the string state of a select feature', async () => {
      stateManager.setState('deviceFeature', 'my-device-feature', {
        category: 'text',
        type: 'select',
        last_value: null,
        last_value_string: 'netflix',
      });
      await runCondition({ device_feature: 'my-device-feature', operator: '=', value: 'netflix' });
      const promise = runCondition({ device_feature: 'my-device-feature', operator: '=', value: 'youtube' });
      return chaiAssert.isRejected(promise, AbortScene, 'CONDITION_NOT_VERIFIED');
    });
    it('should compare the string state of a music title feature', async () => {
      stateManager.setState('deviceFeature', 'my-device-feature', {
        category: 'music',
        type: 'title',
        last_value: null,
        last_value_string: 'Clair de lune',
      });
      await runCondition({ device_feature: 'my-device-feature', operator: '=', value: 'Clair de lune' });
    });
    it('should verify one condition on a feature or one condition on a variable', async () => {
      stateManager.setState('deviceFeature', 'my-device-feature', {
        category: 'temperature-sensor',
        type: 'decimal',
        last_value: 15,
      });
      await executeActions(
        { stateManager, event },
        [
          [
            {
              type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
              conditions: [
                { variable: 'triggerEvent.last_value', operator: '=', value: 1 },
                { device_feature: 'my-device-feature', operator: '<', value: 20 },
              ],
            },
          ],
        ],
        { triggerEvent: { last_value: 0 } },
      );
    });
    it('should abort scene, the feature of the condition does not exist anymore', async () => {
      const promise = runCondition({ device_feature: 'deleted-device-feature', operator: '=', value: 15 });
      return chaiAssert.isRejected(promise, AbortScene, 'DEVICE_FEATURE_NOT_FOUND');
    });
    it('should abort scene, the feature of the condition is an empty selector', async () => {
      const promise = runCondition({ device_feature: '', operator: '=', value: 15 });
      return chaiAssert.isRejected(promise, AbortScene, 'DEVICE_FEATURE_NOT_FOUND');
    });
    it('should run the "then" branch of a block when the state of the feature verifies its condition', async () => {
      stateManager.setState('deviceFeature', 'my-device-feature', {
        category: 'opening-sensor',
        type: 'binary',
        last_value: 0,
      });
      const device = { setValue: fake.resolves(null) };
      const ifThenElse = (value) => [
        [
          {
            type: ACTIONS.CONDITION.IF_THEN_ELSE,
            if: [
              {
                type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
                conditions: [{ device_feature: 'my-device-feature', operator: '=', value }],
              },
            ],
            then: [[{ type: ACTIONS.DEVICE.SET_VALUE, device_feature: 'my-device-feature', value: 1 }]],
            else: [[{ type: ACTIONS.DEVICE.SET_VALUE, device_feature: 'my-device-feature', value: 2 }]],
          },
        ],
      ];
      await executeActions({ stateManager, event, device }, ifThenElse(0), {});
      assert.calledOnce(device.setValue);
      chaiAssert.equal(device.setValue.firstCall.args[2], 1);
      await executeActions({ stateManager, event, device }, ifThenElse(5), {});
      assert.calledTwice(device.setValue);
      chaiAssert.equal(device.setValue.secondCall.args[2], 2);
    });
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
