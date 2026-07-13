const { useFakeTimers } = require('sinon');
const { expect } = require('chai');
const dayjs = require('dayjs');
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const StateManager = require('../../../../lib/state');
const Calendar = require('../../../../lib/calendar');

const event = new EventEmitter();

describe('scene.action.getRunningEvent', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);
  const calendar = new Calendar();
  let clock;
  const now = new Date();
  const startDate = dayjs(now)
    .subtract(45, 'minute')
    .toDate();
  const endDate = dayjs(now)
    .add(45, 'minute')
    .toDate();

  beforeEach(async () => {
    clock = useFakeTimers(now);
  });
  afterEach(() => {
    clock.restore();
  });

  it('should retrieve running event and store it in scope', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    await calendar.createEvent('test-calendar', {
      id: 'b3c68c1b-8259-5a72-9651-f604215cce8d',
      name: 'my get event test',
      description: 'event description',
      location: 'home',
      start: startDate,
      end: endDate,
    });
    await executeActions(
      { stateManager, event, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_RUNNING_EVENT,
            calendars: ['test-calendar'],
            calendar_event_name_comparator: 'contains',
            calendar_event_name: 'get event',
          },
        ],
      ],
      scope,
    );
    expect(scope).to.deep.equal({
      '0': [
        {
          calendarEvent: {
            name: 'my get event test',
            description: 'event description',
            location: 'home',
            start: dayjs(startDate)
              .tz('Europe/Paris')
              .locale('en')
              .format('LLL'),
            end: dayjs(endDate)
              .tz('Europe/Paris')
              .locale('en')
              .format('LLL'),
          },
        },
      ],
    });
  });

  it('should not throw and leave scope empty when no event is found', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    await executeActions(
      { stateManager, event, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_RUNNING_EVENT,
            calendars: ['test-calendar'],
            calendar_event_name_comparator: 'is-exactly',
            calendar_event_name: 'non-existent-event',
          },
        ],
      ],
      scope,
    );
    expect(scope).to.deep.equal({});
  });

  it('should retrieve event with has-any-name comparator', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    await calendar.createEvent('test-calendar', {
      id: 'c4d79d2c-9360-6b83-a762-g715326ddf9e',
      name: 'any name event',
      description: '',
      location: '',
      start: startDate,
      end: endDate,
    });
    await executeActions(
      { stateManager, event, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_RUNNING_EVENT,
            calendars: ['test-calendar'],
            calendar_event_name_comparator: 'has-any-name',
          },
        ],
      ],
      scope,
    );
    expect(scope['0'][0]).to.have.property('calendarEvent');
    expect(scope['0'][0].calendarEvent).to.have.property('name');
  });
});
