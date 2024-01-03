const { assert, fake, useFakeTimers } = require('sinon');
const { expect } = require('chai');
const dayjs = require('dayjs');

require('dayjs/locale/en');
require('dayjs/locale/fr');
require('dayjs/locale/de');

const LocalizedFormat = require('dayjs/plugin/localizedFormat');

const EventEmitter = require('events');

const { EVENTS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const StateManager = require('../../../lib/state');
const Calendar = require('../../../lib/calendar');

dayjs.extend(LocalizedFormat);

const event = new EventEmitter();
const house = {
  get: fake.resolves([]),
};

describe('scene.checkCalendarTriggers', () => {
  const stateManager = new StateManager();
  const calendar = new Calendar();
  let sceneManager;
  let clock;
  const brain = {};
  const now = new Date();
  const startDate = dayjs(now)
    .add(10, 'minute')
    .toDate();
  const endDate = dayjs(now)
    .add(50, 'minute')
    .toDate();
  beforeEach(async () => {
    clock = useFakeTimers(now);
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    sceneManager = new SceneManager(stateManager, event, {}, {}, {}, house, {}, {}, {}, {}, brain);
    await calendar.createEvent('test-calendar', {
      id: 'a2b57b0a-7148-4961-8540-e493104bfd7c',
      name: 'my test event',
      start: startDate,
      end: endDate,
    });
  });
  afterEach(() => {
    clock.restore();
  });
  it('should check if calendar events are matching the trigger - contains true', async () => {
    sceneManager.execute = fake.returns(null);
    await sceneManager.create({
      name: 'check-events',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.CALENDAR.EVENT_IS_COMING,
          calendar_event_attribute: 'start',
          calendars: ['test-calendar'],
          calendar_event_name_comparator: 'contains',
          calendar_event_name: 'test',
          duration: 10,
          unit: 'minute',
        },
      ],
      actions: [[]],
      tags: [],
    });
    const idsOfEventsMatching = await sceneManager.checkCalendarTriggers();
    expect(idsOfEventsMatching).to.deep.equal(['a2b57b0a-7148-4961-8540-e493104bfd7c']);
    assert.calledWith(sceneManager.execute, 'check-events', {
      triggerEvent: {
        type: EVENTS.CALENDAR.EVENT_IS_COMING,
        calendarEvent: {
          name: 'my test event',
          location: null,
          description: null,
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
    });
  });
  it('should check if calendar events are matching the trigger - contains false', async () => {
    await sceneManager.create({
      name: 'check-events',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.CALENDAR.EVENT_IS_COMING,
          calendar_event_attribute: 'start',
          calendars: ['test-calendar'],
          calendar_event_name_comparator: 'contains',
          calendar_event_name: 'thisisnotinthetitle',
          duration: 10,
          unit: 'minute',
        },
      ],
      actions: [[]],
      tags: [],
    });
    const idsOfEventsMatching = await sceneManager.checkCalendarTriggers();
    expect(idsOfEventsMatching).to.deep.equal([]);
  });
  it('should check if calendar events are matching the trigger - is-exactly true', async () => {
    await sceneManager.create({
      name: 'check-events',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.CALENDAR.EVENT_IS_COMING,
          calendar_event_attribute: 'start',
          calendars: ['test-calendar'],
          calendar_event_name_comparator: 'is-exactly',
          calendar_event_name: 'my test event',
          duration: 10,
          unit: 'minute',
        },
      ],
      actions: [[]],
      tags: [],
    });
    const idsOfEventsMatching = await sceneManager.checkCalendarTriggers();
    expect(idsOfEventsMatching).to.deep.equal(['a2b57b0a-7148-4961-8540-e493104bfd7c']);
  });
  it('should check if calendar events are matching the trigger - is-exactly false', async () => {
    await sceneManager.create({
      name: 'check-events',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.CALENDAR.EVENT_IS_COMING,
          calendar_event_attribute: 'start',
          calendars: ['test-calendar'],
          calendar_event_name_comparator: 'is-exactly',
          calendar_event_name: 'thisisnotinthetitle',
          duration: 10,
          unit: 'minute',
        },
      ],
      actions: [[]],
      tags: [],
    });
    const idsOfEventsMatching = await sceneManager.checkCalendarTriggers();
    expect(idsOfEventsMatching).to.deep.equal([]);
  });
  it('should check if calendar events are matching the trigger - starts-with true', async () => {
    await sceneManager.create({
      name: 'check-events',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.CALENDAR.EVENT_IS_COMING,
          calendar_event_attribute: 'start',
          calendars: ['test-calendar'],
          calendar_event_name_comparator: 'starts-with',
          calendar_event_name: 'my test',
          duration: 10,
          unit: 'minute',
        },
      ],
      actions: [[]],
      tags: [],
    });
    const idsOfEventsMatching = await sceneManager.checkCalendarTriggers();
    expect(idsOfEventsMatching).to.deep.equal(['a2b57b0a-7148-4961-8540-e493104bfd7c']);
  });
  it('should check if calendar events are matching the trigger - starts-with false', async () => {
    await sceneManager.create({
      name: 'check-events',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.CALENDAR.EVENT_IS_COMING,
          calendar_event_attribute: 'start',
          calendars: ['test-calendar'],
          calendar_event_name_comparator: 'starts-with',
          calendar_event_name: 'thisisnotinthetitle',
          duration: 10,
          unit: 'minute',
        },
      ],
      actions: [[]],
      tags: [],
    });
    const idsOfEventsMatching = await sceneManager.checkCalendarTriggers();
    expect(idsOfEventsMatching).to.deep.equal([]);
  });
  it('should check if calendar events are matching the trigger - ends-with true', async () => {
    await sceneManager.create({
      name: 'check-events',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.CALENDAR.EVENT_IS_COMING,
          calendar_event_attribute: 'start',
          calendars: ['test-calendar'],
          calendar_event_name_comparator: 'ends-with',
          calendar_event_name: 'event',
          duration: 10,
          unit: 'minute',
        },
      ],
      actions: [[]],
      tags: [],
    });
    const idsOfEventsMatching = await sceneManager.checkCalendarTriggers();
    expect(idsOfEventsMatching).to.deep.equal(['a2b57b0a-7148-4961-8540-e493104bfd7c']);
  });
  it('should check if calendar events are matching the trigger - ends-with false', async () => {
    await sceneManager.create({
      name: 'check-events',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.CALENDAR.EVENT_IS_COMING,
          calendar_event_attribute: 'start',
          calendars: ['test-calendar'],
          calendar_event_name_comparator: 'ends-with',
          calendar_event_name: 'thisisnotinthetitle',
          duration: 10,
          unit: 'minute',
        },
      ],
      actions: [[]],
      tags: [],
    });
    const idsOfEventsMatching = await sceneManager.checkCalendarTriggers();
    expect(idsOfEventsMatching).to.deep.equal([]);
  });
  it('should check if calendar events are matching the trigger - has-any-name true', async () => {
    await sceneManager.create({
      name: 'check-events',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.CALENDAR.EVENT_IS_COMING,
          calendar_event_attribute: 'start',
          calendars: ['test-calendar'],
          calendar_event_name_comparator: 'has-any-name',
          calendar_event_name: 'thisisnotinthetitle',
          duration: 10,
          unit: 'minute',
        },
      ],
      actions: [[]],
      tags: [],
    });
    const idsOfEventsMatching = await sceneManager.checkCalendarTriggers();
    expect(idsOfEventsMatching).to.deep.equal(['a2b57b0a-7148-4961-8540-e493104bfd7c']);
  });
  it('should check that private calendars are not matched', async () => {
    // calendar is now private
    await calendar.update('test-calendar', {
      shared: false,
    });
    await sceneManager.create({
      name: 'check-events',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.CALENDAR.EVENT_IS_COMING,
          calendar_event_attribute: 'start',
          calendars: ['test-calendar'],
          calendar_event_name_comparator: 'has-any-name',
          calendar_event_name: 'thisisnotinthetitle',
          duration: 10,
          unit: 'minute',
        },
      ],
      actions: [[]],
      tags: [],
    });
    const idsOfEventsMatching = await sceneManager.checkCalendarTriggers();
    expect(idsOfEventsMatching).to.deep.equal([]);
  });
});
