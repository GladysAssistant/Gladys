const { fake, assert } = require('sinon');
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const actionsFunc = require('../../../../lib/scene/scene.actions');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');

describe('scene.conditionIfThenElse', () => {
  let event;
  let stateManager;
  const { executeActions } = executeActionsFactory(actionsFunc);

  beforeEach(() => {
    event = new EventEmitter();
    stateManager = new StateManager(event);
  });

  it('should execute else, condition is not verified', async () => {
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
            type: ACTIONS.CONDITION.IF_THEN_ELSE,
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
                  text: 'Then executed, last value = {{0.0.last_value}}',
                },
              ],
            ],
            else: [
              [
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  text: 'Else executed, last value = {{0.0.last_value}}',
                },
              ],
            ],
          },
        ],
      ],
      scope,
    );
    assert.calledWith(message.sendToUser, 'pepper', 'Else executed, last value = 15');
  });
  it('should execute then, condition is verified', async () => {
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
            type: ACTIONS.CONDITION.IF_THEN_ELSE,
            if: [
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
            then: [
              [
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  text: 'Then executed, last value = {{0.0.last_value}}',
                },
              ],
            ],
            else: [
              [
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  text: 'Else executed, last value = {{0.0.last_value}}',
                },
              ],
            ],
          },
        ],
      ],
      scope,
    );
    assert.calledWith(message.sendToUser, 'pepper', 'Then executed, last value = 15');
  });
  it('should execute then, and try get-value in branch', async () => {
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
            type: ACTIONS.CONDITION.IF_THEN_ELSE,
            if: [
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
            then: [
              [
                {
                  type: ACTIONS.DEVICE.GET_VALUE,
                  device_feature: 'my-device-feature',
                },
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  text: 'Then executed, last value = {{1.0.then.0.0.last_value}}',
                },
              ],
            ],
            else: [],
          },
        ],
      ],
      scope,
    );
    assert.calledWith(message.sendToUser, 'pepper', 'Then executed, last value = 15');
  });
  it('should throw error, error happened in the scene', async () => {
    stateManager.setState('deviceFeature', 'my-device-feature', {
      category: 'light',
      type: 'binary',
      last_value: 15,
    });
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
            type: ACTIONS.CONDITION.IF_THEN_ELSE,
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
                  text: 'Then executed.',
                },
              ],
            ],
            else: [],
          },
        ],
      ],
      scope,
    );
    assert.notCalled(message.sendToUser);
  });
});
