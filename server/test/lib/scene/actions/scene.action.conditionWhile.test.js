const { fake, assert } = require('sinon');
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
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

  it('should not execute do block when condition is false', async () => {
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
            while: [
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
            do: [
              [
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  text: 'Do executed',
                },
              ],
            ],
            max_iterations: 5,
            iteration_delay_ms: 0,
          },
        ],
      ],
      scope,
    );
    assert.notCalled(message.sendToUser);
  });

  it('should execute do block repeatedly while condition is true', async () => {
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
            while: [
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
            do: [
              [
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  text: 'Do executed',
                },
              ],
            ],
            max_iterations: 3,
            iteration_delay_ms: 0,
          },
        ],
      ],
      scope,
    );
    assert.callCount(message.sendToUser, 3);
  });

  it('should execute get-value in do branch with correct path', async () => {
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
            while: [
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
            do: [
              [
                {
                  type: ACTIONS.DEVICE.GET_VALUE,
                  device_feature: 'my-device-feature',
                },
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  text: 'Do executed, last value = {{1.0.do.0.0.last_value}}',
                },
              ],
            ],
            max_iterations: 1,
            iteration_delay_ms: 0,
          },
        ],
      ],
      scope,
    );
    assert.calledWith(message.sendToUser, 'pepper', 'Do executed, last value = 15');
  });

  it('should throw error when a real error happens in while condition', async () => {
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
            while: [
              {
                type: ACTIONS.ALARM.CHECK_ALARM_MODE,
                house: 'unknown-house',
              },
            ],
            do: [
              [
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  text: 'Do executed',
                },
              ],
            ],
            max_iterations: 5,
            iteration_delay_ms: 0,
          },
        ],
      ],
      scope,
    );
    assert.notCalled(message.sendToUser);
  });
});
