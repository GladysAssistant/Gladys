const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { fake, assert } = require('sinon');
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const { AbortScene } = require('../../../../utils/coreErrors');

chai.use(chaiAsPromised);
const { expect } = chai;
const actionsFunc = require('../../../../lib/scene/scene.actions');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');

describe('scene.conditionWhile', () => {
  let event;
  let stateManager;
  const { executeActions } = executeActionsFactory(actionsFunc);

  beforeEach(() => {
    event = new EventEmitter();
    stateManager = new StateManager(event);
  });

  it('should not execute loop actions, condition is falsy from the start', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const message = {
      sendToUser: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, message },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.CONDITION.WHILE,
            if: [
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
            then: [
              [
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  text: 'Loop executed',
                },
              ],
            ],
          },
        ],
      ],
      scope,
    );
    assert.notCalled(message.sendToUser);
  });

  it('should execute loop actions until the condition becomes falsy', async () => {
    const deviceFeature = {
      device_id: 'device-id',
      category: 'light',
      type: 'brightness',
      last_value: 70,
    };
    stateManager.setState('deviceFeature', 'my-device-feature', deviceFeature);
    stateManager.setState('deviceById', 'device-id', { id: 'device-id' });
    // Each iteration increases the brightness by 10
    const device = {
      setValue: fake(async (d, df, value) => {
        deviceFeature.last_value = value;
      }),
    };
    await executeActions(
      { stateManager, event, device },
      [
        [
          {
            type: ACTIONS.CONDITION.WHILE,
            if: [
              {
                type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
                conditions: [
                  {
                    variable: '0.0.then.1.0.last_value',
                    operator: '<',
                    value: 100,
                  },
                ],
              },
            ],
            then: [
              [
                {
                  type: ACTIONS.DEVICE.SET_VALUE,
                  device_feature: 'my-device-feature',
                  evaluate_value: '{{0.0.then.1.0.last_value}} + 10',
                },
              ],
              [
                {
                  type: ACTIONS.DEVICE.GET_VALUE,
                  device_feature: 'my-device-feature',
                },
              ],
            ],
          },
        ],
      ],
      // the loop condition reads a variable refreshed inside the loop body,
      // so we initialize it for the first evaluation
      { '0': { '0': { then: { '1': { '0': { last_value: 70 } } } } } },
    );
    // 70 -> 80 -> 90 -> 100, then condition 100 < 100 fails
    expect(device.setValue.callCount).to.equal(3);
    expect(deviceFeature.last_value).to.equal(100);
  });

  it('should stop the loop when max_iterations is reached', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
    const message = {
      sendToUser: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, message },
      [
        [
          {
            type: ACTIONS.DEVICE.GET_VALUE,
            device_feature: 'my-device-feature',
          },
        ],
        [
          {
            type: ACTIONS.CONDITION.WHILE,
            max_iterations: 2,
            if: [
              {
                type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
                conditions: [
                  {
                    // Always true: the loop would never stop without max_iterations
                    variable: '0.0.last_value',
                    operator: '=',
                    value: 15,
                  },
                ],
              },
            ],
            then: [
              [
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  text: 'Loop executed',
                },
              ],
            ],
          },
        ],
      ],
      scope,
    );
    expect(message.sendToUser.callCount).to.equal(2);
  });

  it('should abort the scene when the loop has no conditions', async () => {
    const message = {
      sendToUser: fake.resolves(null),
    };
    const scope = {};
    const promise = executeActions(
      { stateManager, event, message },
      [
        [
          {
            type: ACTIONS.CONDITION.WHILE,
            if: [],
            then: [
              [
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  text: 'Loop executed',
                },
              ],
            ],
          },
        ],
      ],
      scope,
    );
    await chai.assert.isRejected(promise, AbortScene, 'WHILE_CONDITION_EMPTY');
    assert.notCalled(message.sendToUser);
  });

  it('should throw error, error happened in the condition', async () => {
    const message = {
      sendToUser: fake.resolves(null),
    };
    const house = {
      getBySelector: fake.rejects(new Error('HOUSE_NOT_FOUND')),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, message, house },
      [
        [
          {
            type: ACTIONS.CONDITION.WHILE,
            if: [
              {
                type: ACTIONS.ALARM.CHECK_ALARM_MODE,
                house: 'unknown-house',
              },
            ],
            then: [
              [
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  text: 'Loop executed',
                },
              ],
            ],
          },
        ],
      ],
      scope,
    );
    assert.notCalled(message.sendToUser);
  });
});
