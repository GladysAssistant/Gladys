const sinon = require('sinon').createSandbox();

const { assert, fake, useFakeTimers } = sinon;
const chaiAssert = require('chai').assert;
const { expect } = require('chai');
const dayjs = require('dayjs');
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const { AbortScene } = require('../../../../utils/coreErrors');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const StateManager = require('../../../../lib/state');
const Calendar = require('../../../../lib/calendar');

const event = new EventEmitter();

describe('scene.action.getCalendarEvents', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);
  const calendar = new Calendar();
  let clock;
  // Fixed date so tests are deterministic: 2025-03-10 13:00 in Paris
  const now = new Date('2025-03-10T12:00:00.000Z');
  const formatTime = (date) =>
    dayjs(date)
      .tz('Europe/Paris')
      .locale('en')
      .format('LT');
  const formatDate = (date) =>
    dayjs(date)
      .tz('Europe/Paris')
      .locale('en')
      .format('LLL');
  beforeEach(async () => {
    clock = useFakeTimers(now);
  });
  afterEach(() => {
    clock.restore();
  });
  it('should get tomorrow events sorted by start date, and set variables in scope', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const dentistStart = new Date('2025-03-11T08:00:00.000Z');
    const dentistEnd = new Date('2025-03-11T09:00:00.000Z');
    const meetingStart = new Date('2025-03-11T14:00:00.000Z');
    const meetingEnd = new Date('2025-03-11T15:00:00.000Z');
    await calendar.createEvent('test-calendar', {
      name: 'Meeting',
      location: 'office',
      description: 'weekly meeting',
      start: meetingStart,
      end: meetingEnd,
    });
    await calendar.createEvent('test-calendar', {
      name: 'Dentist',
      location: 'dental office',
      description: 'yearly check',
      start: dentistStart,
      end: dentistEnd,
    });
    await calendar.createEvent('test-calendar', {
      name: 'Today event',
      start: new Date('2025-03-10T15:00:00.000Z'),
      end: new Date('2025-03-10T16:00:00.000Z'),
    });
    await executeActions(
      { stateManager, event, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'tomorrow',
          },
        ],
      ],
      scope,
    );
    expect(scope).to.deep.equal({
      '0': [
        {
          calendarEvents: {
            text: `Dentist at ${formatTime(dentistStart)}, Meeting at ${formatTime(meetingStart)}`,
            textDetailed:
              `- Dentist at ${formatTime(dentistStart)} (dental office)\n` +
              `- Meeting at ${formatTime(meetingStart)} (office)`,
            count: 2,
            events: [
              {
                name: 'Dentist',
                location: 'dental office',
                description: 'yearly check',
                start: formatDate(dentistStart),
                end: formatDate(dentistEnd),
                summary: `Dentist at ${formatTime(dentistStart)}`,
              },
              {
                name: 'Meeting',
                location: 'office',
                description: 'weekly meeting',
                start: formatDate(meetingStart),
                end: formatDate(meetingEnd),
                summary: `Meeting at ${formatTime(meetingStart)}`,
              },
            ],
          },
        },
      ],
    });
  });
  it('should get today events, and announce full-day events without a time', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const partyStart = new Date('2025-03-10T15:00:00.000Z');
    const partyEnd = new Date('2025-03-10T18:00:00.000Z');
    await calendar.createEvent('test-calendar', {
      name: 'Party',
      start: partyStart,
      end: partyEnd,
    });
    await calendar.createEvent('test-calendar', {
      name: 'Spring holidays',
      start: new Date('2025-03-10T00:00:00.000Z'),
      end: new Date('2025-03-11T00:00:00.000Z'),
      full_day: true,
    });
    await executeActions(
      { stateManager, event, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'today',
          },
        ],
      ],
      scope,
    );
    const { calendarEvents } = scope['0'][0];
    expect(calendarEvents.count).to.equal(2);
    expect(calendarEvents.text).to.equal(`Spring holidays, Party at ${formatTime(partyStart)}`);
    // Events without a location are listed without the location part
    expect(calendarEvents.textDetailed).to.equal(`- Spring holidays\n- Party at ${formatTime(partyStart)}`);
    expect(calendarEvents.events[0]).to.have.property('summary', 'Spring holidays');
  });
  it('should get the full-day events of the day in a timezone west of UTC', async () => {
    // Full-day events are stored at midnight UTC. In New York, the local day starts at
    // 04:00 UTC, so matching them on the local bounds of the range would miss the full-day
    // event of the day and return the one of the next day instead.
    const stateManager = new StateManager(event);
    const scope = {};
    await calendar.createEvent('test-calendar', {
      name: 'Birthday',
      start: new Date('2025-03-10T00:00:00.000Z'),
      end: new Date('2025-03-11T00:00:00.000Z'),
      full_day: true,
    });
    await calendar.createEvent('test-calendar', {
      name: 'Holidays tomorrow',
      start: new Date('2025-03-11T00:00:00.000Z'),
      end: new Date('2025-03-12T00:00:00.000Z'),
      full_day: true,
    });
    await executeActions(
      { stateManager, event, calendar, timezone: 'America/New_York' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'today',
          },
        ],
      ],
      scope,
    );
    const { calendarEvents } = scope['0'][0];
    expect(calendarEvents.count).to.equal(1);
    expect(calendarEvents.text).to.equal('Birthday');
  });
  it('should only get events in the next x hours', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const coffeeStart = new Date('2025-03-10T14:00:00.000Z');
    await calendar.createEvent('test-calendar', {
      name: 'Coffee break',
      start: coffeeStart,
      end: new Date('2025-03-10T14:30:00.000Z'),
    });
    await calendar.createEvent('test-calendar', {
      name: 'Diner',
      start: new Date('2025-03-10T17:00:00.000Z'),
      end: new Date('2025-03-10T18:00:00.000Z'),
    });
    await executeActions(
      { stateManager, event, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'next-x-hours',
            duration: 3,
          },
        ],
      ],
      scope,
    );
    const { calendarEvents } = scope['0'][0];
    expect(calendarEvents.count).to.equal(1);
    expect(calendarEvents.text).to.equal(`Coffee break at ${formatTime(coffeeStart)}`);
  });
  it('should announce events on another day with the full date, and handle events without end date', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const flightStart = new Date('2025-03-11T08:00:00.000Z');
    await calendar.createEvent('test-calendar', {
      name: 'Flight',
      start: flightStart,
    });
    await executeActions(
      { stateManager, event, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'next-x-hours',
            duration: 24,
          },
        ],
      ],
      scope,
    );
    const { calendarEvents } = scope['0'][0];
    expect(calendarEvents.count).to.equal(1);
    expect(calendarEvents.text).to.equal(`Flight at ${formatDate(flightStart)}`);
    expect(calendarEvents.events[0]).to.have.property('end', null);
  });
  it('should set empty variables when no event is found and the scene continues', async () => {
    const stateManager = new StateManager(event);
    const message = {
      sendToUser: fake.resolves(null),
    };
    const scope = {};
    await executeActions(
      { stateManager, event, message, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'tomorrow',
            stop_scene_if_no_events: false,
          },
        ],
        [
          {
            type: ACTIONS.MESSAGE.SEND,
            user: 'pepper',
            text: 'hello',
          },
        ],
      ],
      scope,
    );
    assert.calledWith(message.sendToUser, 'pepper', 'hello');
    expect(scope).to.deep.equal({
      '0': [
        {
          calendarEvents: {
            text: '',
            textDetailed: '',
            count: 0,
            events: [],
          },
        },
      ],
    });
  });
  it('should stop the scene when no event is found and stop_scene_if_no_events is true', async () => {
    const stateManager = new StateManager(event);
    const message = {
      sendToUser: fake.resolves(null),
    };
    const scope = {};
    const promise = executeActions(
      { stateManager, event, message, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'tomorrow',
            stop_scene_if_no_events: true,
          },
        ],
        [
          {
            type: ACTIONS.MESSAGE.SEND,
            user: 'pepper',
            text: 'hello',
          },
        ],
      ],
      scope,
    );
    await chaiAssert.isRejected(promise, AbortScene);
    assert.notCalled(message.sendToUser);
  });
  it('should stop the scene when the time range is invalid', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const promise = executeActions(
      { stateManager, event, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'invalid-range',
          },
        ],
      ],
      scope,
    );
    await chaiAssert.isRejected(promise, AbortScene);
  });
  it('should stop the scene when the duration of the next x hours range is missing', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const promise = executeActions(
      { stateManager, event, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'next-x-hours',
            duration: null,
          },
        ],
      ],
      scope,
    );
    await chaiAssert.isRejected(promise, AbortScene);
  });
  it('should stop the scene when the duration of the next x hours range is not a positive integer', async () => {
    const stateManager = new StateManager(event);
    const scope = {};
    const promise = executeActions(
      { stateManager, event, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'next-x-hours',
            duration: 0,
          },
        ],
      ],
      scope,
    );
    await chaiAssert.isRejected(promise, AbortScene);
  });
});
