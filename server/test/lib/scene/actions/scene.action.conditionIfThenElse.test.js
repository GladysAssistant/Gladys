const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
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
  it('should expose a variable declared by a condition at the path used by the scene editor', async () => {
    const message = {
      sendToUser: fake.resolves(null),
    };
    const calendar = {
      findCurrentlyRunningEvent: fake.resolves([
        {
          name: 'Dentist',
          location: 'Paris',
          description: '',
          start: new Date('2022-01-01T10:00:00Z'),
          end: new Date('2022-01-01T11:00:00Z'),
          calendar: { creator: { language: 'en' } },
        },
      ]),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, message, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CONDITION.IF_THEN_ELSE,
            if: [
              {
                type: ACTIONS.CALENDAR.IS_EVENT_RUNNING,
                calendars: ['my-calendar'],
                calendar_event_name_comparator: 'has-any-name',
                stop_scene_if_event_not_found: true,
              },
            ],
            then: [
              [
                {
                  type: ACTIONS.MESSAGE.SEND,
                  user: 'pepper',
                  // The editor offers this path for a variable declared by a condition
                  text: 'Event = {{0.0.if.0.calendarEvent.name}}',
                },
              ],
            ],
            else: [],
          },
        ],
      ],
      scope,
    );
    assert.calledWith(message.sendToUser, 'pepper', 'Event = Dentist');
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
