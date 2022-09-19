const { assert, fake, useFakeTimers } = require('sinon');
const chaiAssert = require('chai').assert;
const { expect } = require('chai');
const dayjs = require('dayjs');
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const { AbortScene } = require('../../../../utils/coreErrors');
const { executeActions } = require('../../../../lib/scene/scene.executeActions');

const StateManager = require('../../../../lib/state');
const Calendar = require('../../../../lib/calendar');

const event = new EventEmitter();

describe('scene.action.isEventRunning', () => {
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
  it('should execute condition is-event-running, and send message because condition is true', async () => {
    const stateManager = new StateManager(event);
    const message = {
      sendToUser: fake.resolves(null),
    };
    const scope = {};
    await calendar.createEvent('test-calendar', {
      id: 'a2b57b0a-7148-4961-8540-e493104bfd7c',
      name: 'my test event',
      description: 'my event description',
      location: 'school',
      start: startDate,
      end: endDate,
    });
    await executeActions(
      { stateManager, event, message, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.IS_EVENT_RUNNING,
            calendars: ['test-calendar'],
            calendar_event_name_comparator: 'contains',
            calendar_event_name: 'test',
            stop_scene_if_event_found: false,
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
      '0': {
        '0': {
          calendarEvent: {
            name: 'my test event',
            description: 'my event description',
            location: 'school',
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
      },
    });
  });
  it('should execute condition is-event-running 3 times, and verify scope', async () => {
    const stateManager = new StateManager(event);
    const message = {
      sendToUser: fake.resolves(null),
    };
    const scope = {};
    await calendar.createEvent('test-calendar', {
      id: 'a2b57b0a-7148-4961-8540-e493104bfd7c',
      name: 'my test event',
      description: 'my event description',
      location: 'school',
      start: startDate,
      end: endDate,
    });
    await executeActions(
      { stateManager, event, message, calendar, timezone: 'Europe/Paris' },
      [
        [
          {
            type: ACTIONS.CALENDAR.IS_EVENT_RUNNING,
            calendars: ['test-calendar'],
            calendar_event_name_comparator: 'contains',
            calendar_event_name: 'test',
            stop_scene_if_event_found: false,
          },
          {
            type: ACTIONS.CALENDAR.IS_EVENT_RUNNING,
            calendars: ['test-calendar'],
            calendar_event_name_comparator: 'contains',
            calendar_event_name: 'test',
            stop_scene_if_event_found: false,
          },
        ],
        [
          {
            type: ACTIONS.CALENDAR.IS_EVENT_RUNNING,
            calendars: ['test-calendar'],
            calendar_event_name_comparator: 'contains',
            calendar_event_name: 'test',
            stop_scene_if_event_found: false,
          },
        ],
      ],
      scope,
    );
    const calendarEvent = {
      name: 'my test event',
      location: 'school',
      description: 'my event description',
      start: dayjs(startDate)
        .tz('Europe/Paris')
        .locale('en')
        .format('LLL'),
      end: dayjs(endDate)
        .tz('Europe/Paris')
        .locale('en')
        .format('LLL'),
    };
    expect(scope).to.deep.equal({
      '0': {
        '0': {
          calendarEvent,
        },
        '1': {
          calendarEvent,
        },
      },
      '1': {
        '0': {
          calendarEvent,
        },
      },
    });
  });
  it('should execute condition is-event-running, and not send message because scene should stop', async () => {
    const stateManager = new StateManager(event);
    const message = {
      sendToUser: fake.resolves(null),
    };
    const scope = {};
    await calendar.createEvent('test-calendar', {
      id: 'a2b57b0a-7148-4961-8540-e493104bfd7c',
      name: 'my test event',
      description: 'my event description',
      start: startDate,
      end: endDate,
    });
    const promise = executeActions(
      { stateManager, event, message, calendar },
      [
        [
          {
            type: ACTIONS.CALENDAR.IS_EVENT_RUNNING,
            calendars: ['test-calendar'],
            calendar_event_name_comparator: 'contains',
            calendar_event_name: 'test',
            stop_scene_if_event_found: true,
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
  it('should execute condition is-event-running, and send message because condition is true', async () => {
    const stateManager = new StateManager(event);
    const message = {
      sendToUser: fake.resolves(null),
    };
    const scope = {};
    await calendar.createEvent('test-calendar', {
      id: 'a2b57b0a-7148-4961-8540-e493104bfd7c',
      name: 'my test event',
      description: 'my event description',
      start: startDate,
      end: endDate,
    });
    const promise = executeActions(
      { stateManager, event, message, calendar },
      [
        [
          {
            type: ACTIONS.CALENDAR.IS_EVENT_RUNNING,
            calendars: ['test-calendar'],
            calendar_event_name_comparator: 'contains',
            calendar_event_name: 'text-not-found',
            stop_scene_if_event_not_found: true,
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
});
