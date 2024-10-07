const { expect, assert } = require('chai');
const { useFakeTimers } = require('sinon');
const dayjs = require('dayjs');

const Calendar = require('../../../lib/calendar');

describe('calendar.createEvent', () => {
  const calendar = new Calendar();
  it('should create a calendarEvent', async () => {
    const newCalendarEvent = await calendar.createEvent('test-calendar', {
      name: 'My test event',
      start: '2019-02-12 07:49:07.556',
    });
    expect(newCalendarEvent).to.have.property('name', 'My test event');
    expect(newCalendarEvent).to.have.property('selector', 'my-test-event');
  });
  it('should return calendar not found', async () => {
    const promise = calendar.createEvent('calendar-not-found', {
      name: 'My test event',
      start: '2019-02-12 07:49:07.556',
    });
    return assert.isRejected(promise, 'Calendar not found');
  });
});

describe('calendar.update', () => {
  const calendar = new Calendar();
  it('should update a calendar event', async () => {
    const newCalendarEvent = await calendar.updateEvent('test-calendar-event', {
      name: 'New name',
    });
    expect(newCalendarEvent).to.have.property('name', 'New name');
    expect(newCalendarEvent).to.have.property('selector', 'test-calendar-event');
  });
  it('should return calendar event not found', async () => {
    const promise = calendar.updateEvent('not-found-calendar-event', {
      name: 'New name',
    });
    return assert.isRejected(promise, 'CalendarEvent not found');
  });
});

describe('calendar.destroy', () => {
  const calendar = new Calendar();
  it('should destroy a calendar event', async () => {
    await calendar.destroyEvent('test-calendar-event');
  });
  it('should return calendar event not found', async () => {
    const promise = calendar.destroyEvent('not-found-calendar-event');
    return assert.isRejected(promise, 'CalendarEvent not found');
  });
});

describe('calendar.destroyEvents', () => {
  it("should destroy all calendar's event", async () => {
    const calendar = new Calendar();
    await calendar.destroyEvents('07ec2599-3221-4d6c-ac56-41443973201b');
    const allCalendarEvents = await calendar.getEvents(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      '07ec2599-3221-4d6c-ac56-41443973201b',
    );
    assert.deepEqual(allCalendarEvents, []);
  });

  it("should destroy calendar's events by url", async () => {
    const calendar = new Calendar();
    await calendar.destroyEvents('07ec2599-3221-4d6c-ac56-41443973201b', {
      url: '/remote.php/dav/calendars/tony/personal/eee42d70-24f2-4c18-949d-822f3f72594c.ics',
    });
    const allCalendarEvents = await calendar.getEvents(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      '07ec2599-3221-4d6c-ac56-41443973201b',
    );
    expect(allCalendarEvents.length).eq(1);
  });

  it("should destroy calendar's events starting after date", async () => {
    const calendar = new Calendar();
    await calendar.destroyEvents('07ec2599-3221-4d6c-ac56-41443973201b', { from: '2019-03-10 07:49:07.556 +00:00' });
    const allCalendarEvents = await calendar.getEvents(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      '07ec2599-3221-4d6c-ac56-41443973201b',
    );
    expect(allCalendarEvents.length).eq(1);
  });
});

describe('calendar.getEvents', () => {
  const calendar = new Calendar();
  it('should get events of a user', async () => {
    const events = await calendar.getEvents('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      from: '2019-01-12 07:49:07.556',
      to: '2019-03-01 07:49:07.556',
    });
    expect(events).to.deep.equal([
      {
        id: '2ae9c476-3230-4f82-8f93-5ebfac15e736',
        calendar_id: '07ec2599-3221-4d6c-ac56-41443973201b',
        name: 'Test Calendar Event',
        description: 'Description test Calendar Event',
        selector: 'test-calendar-event',
        external_id: 'd5ad1bd8-96a1-44ed-b103-98515892c2d0',
        location: null,
        start: new Date('2019-02-12T07:49:07.556Z'),
        end: new Date('2019-02-12T08:49:07.556Z'),
        url: '/remote.php/dav/calendars/tony/personal/eee42d70-24f2-4c18-949d-822f3f72594c.ics',
        full_day: false,
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
        calendar: {
          name: 'Test Calendar',
          selector: 'test-calendar',
        },
      },
    ]);
  });
  it('should get events of a user by selector', async () => {
    const events = await calendar.getEvents('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      selector: 'test-calendar-event',
    });
    expect(events).to.deep.equal([
      {
        id: '2ae9c476-3230-4f82-8f93-5ebfac15e736',
        calendar_id: '07ec2599-3221-4d6c-ac56-41443973201b',
        name: 'Test Calendar Event',
        description: 'Description test Calendar Event',
        selector: 'test-calendar-event',
        external_id: 'd5ad1bd8-96a1-44ed-b103-98515892c2d0',
        location: null,
        start: new Date('2019-02-12T07:49:07.556Z'),
        end: new Date('2019-02-12T08:49:07.556Z'),
        url: '/remote.php/dav/calendars/tony/personal/eee42d70-24f2-4c18-949d-822f3f72594c.ics',
        full_day: false,
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
        calendar: {
          name: 'Test Calendar',
          selector: 'test-calendar',
        },
      },
    ]);
  });
  it('should get events of a user by url', async () => {
    const events = await calendar.getEvents('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      url: '/remote.php/dav/calendars/tony/personal/47e754ac-bcef-4b53-ba5b-29dfb588e196.ics',
    });
    expect(events).to.deep.equal([
      {
        id: 'f2d58e17-bea5-4922-b15b-afbd4ad923dc',
        calendar_id: '07ec2599-3221-4d6c-ac56-41443973201b',
        name: 'Test Calendar Event 2',
        description: 'Description test Calendar Event 2',
        selector: 'test-calendar-event-2',
        external_id: 'b22891f7-692e-496f-a180-ed085bd99042',
        location: null,
        start: new Date('2019-03-12T07:49:07.556Z'),
        end: new Date('2019-03-12T08:49:07.556Z'),
        url: '/remote.php/dav/calendars/tony/personal/47e754ac-bcef-4b53-ba5b-29dfb588e196.ics',
        full_day: false,
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
        calendar: {
          name: 'Test Calendar',
          selector: 'test-calendar',
        },
      },
    ]);
  });
  it('should get events of a user by external_id', async () => {
    const events = await calendar.getEvents('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      externalId: 'b22891f7-692e-496f-a180-ed085bd99042',
    });
    expect(events).to.deep.equal([
      {
        id: 'f2d58e17-bea5-4922-b15b-afbd4ad923dc',
        calendar_id: '07ec2599-3221-4d6c-ac56-41443973201b',
        name: 'Test Calendar Event 2',
        description: 'Description test Calendar Event 2',
        selector: 'test-calendar-event-2',
        external_id: 'b22891f7-692e-496f-a180-ed085bd99042',
        location: null,
        start: new Date('2019-03-12T07:49:07.556Z'),
        end: new Date('2019-03-12T08:49:07.556Z'),
        url: '/remote.php/dav/calendars/tony/personal/47e754ac-bcef-4b53-ba5b-29dfb588e196.ics',
        full_day: false,
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
        calendar: {
          name: 'Test Calendar',
          selector: 'test-calendar',
        },
      },
    ]);
  });
  it('should get events of a user by calendar_id', async () => {
    const events = await calendar.getEvents('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      calendarId: '07ec2599-3221-4d6c-ac56-41443973201b',
    });
    expect(events).to.deep.equal([
      {
        id: '2ae9c476-3230-4f82-8f93-5ebfac15e736',
        calendar_id: '07ec2599-3221-4d6c-ac56-41443973201b',
        name: 'Test Calendar Event',
        description: 'Description test Calendar Event',
        selector: 'test-calendar-event',
        external_id: 'd5ad1bd8-96a1-44ed-b103-98515892c2d0',
        location: null,
        start: new Date('2019-02-12T07:49:07.556Z'),
        end: new Date('2019-02-12T08:49:07.556Z'),
        url: '/remote.php/dav/calendars/tony/personal/eee42d70-24f2-4c18-949d-822f3f72594c.ics',
        full_day: false,
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
        calendar: {
          name: 'Test Calendar',
          selector: 'test-calendar',
        },
      },
      {
        id: 'f2d58e17-bea5-4922-b15b-afbd4ad923dc',
        calendar_id: '07ec2599-3221-4d6c-ac56-41443973201b',
        name: 'Test Calendar Event 2',
        description: 'Description test Calendar Event 2',
        selector: 'test-calendar-event-2',
        external_id: 'b22891f7-692e-496f-a180-ed085bd99042',
        location: null,
        start: new Date('2019-03-12T07:49:07.556Z'),
        end: new Date('2019-03-12T08:49:07.556Z'),
        url: '/remote.php/dav/calendars/tony/personal/47e754ac-bcef-4b53-ba5b-29dfb588e196.ics',
        full_day: false,
        created_at: new Date('2019-02-12T07:49:07.556Z'),
        updated_at: new Date('2019-02-12T07:49:07.556Z'),
        calendar: {
          name: 'Test Calendar',
          selector: 'test-calendar',
        },
      },
    ]);
  });
  it('should return 0 events', async () => {
    const events = await calendar.getEvents('0cd30aef-9c4e-4a23-88e3-3547971296e5', {
      from: '2018-01-12 07:49:07.556',
      to: '2018-03-12 07:49:07.556',
    });
    expect(events).to.deep.equal([]);
  });
  it('should return 0 events (user has no events)', async () => {
    const events = await calendar.getEvents('7a137a56-069e-4996-8816-36558174b727', {
      from: '2018-01-12 07:49:07.556',
      to: '2020-03-12 07:49:07.556',
    });
    expect(events).to.deep.equal([]);
  });
});

describe('calendar.findCurrentlyRunningEvent', () => {
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
  it('should find event in calendar - has any name', async () => {
    await calendar.createEvent('test-calendar', {
      id: 'a2b57b0a-7148-4961-8540-e493104bfd7c',
      name: 'my test event',
      start: startDate,
      end: endDate,
    });
    const events = await calendar.findCurrentlyRunningEvent(['test-calendar'], 'has-any-name', '');
    const eventsId = events.map((e) => e.id);
    expect(eventsId).deep.equal(['a2b57b0a-7148-4961-8540-e493104bfd7c']);
  });
  it('should find event in calendar - is-exactly', async () => {
    await calendar.createEvent('test-calendar', {
      id: 'a2b57b0a-7148-4961-8540-e493104bfd7c',
      name: 'my test event',
      start: startDate,
      end: endDate,
    });
    const events = await calendar.findCurrentlyRunningEvent(['test-calendar'], 'is-exactly', 'my test event');
    const eventsId = events.map((e) => e.id);
    expect(eventsId).deep.equal(['a2b57b0a-7148-4961-8540-e493104bfd7c']);
  });
  it('should find event in calendar - contains', async () => {
    await calendar.createEvent('test-calendar', {
      id: 'a2b57b0a-7148-4961-8540-e493104bfd7c',
      name: 'my test event',
      start: startDate,
      end: endDate,
    });
    const events = await calendar.findCurrentlyRunningEvent(['test-calendar'], 'contains', 'test');
    const eventsId = events.map((e) => e.id);
    expect(eventsId).deep.equal(['a2b57b0a-7148-4961-8540-e493104bfd7c']);
  });
  it('should find event in calendar - starts-with', async () => {
    await calendar.createEvent('test-calendar', {
      id: 'a2b57b0a-7148-4961-8540-e493104bfd7c',
      name: 'my test event',
      start: startDate,
      end: endDate,
    });
    const events = await calendar.findCurrentlyRunningEvent(['test-calendar'], 'starts-with', 'my test');
    const eventsId = events.map((e) => e.id);
    expect(eventsId).deep.equal(['a2b57b0a-7148-4961-8540-e493104bfd7c']);
  });
  it('should find event in calendar - ends-with', async () => {
    await calendar.createEvent('test-calendar', {
      id: 'a2b57b0a-7148-4961-8540-e493104bfd7c',
      name: 'my test event',
      start: startDate,
      end: endDate,
    });
    const events = await calendar.findCurrentlyRunningEvent(['test-calendar'], 'ends-with', 'test event');
    const eventsId = events.map((e) => e.id);
    expect(eventsId).deep.equal(['a2b57b0a-7148-4961-8540-e493104bfd7c']);
  });
  it('should not find event in calendar - contains', async () => {
    await calendar.createEvent('test-calendar', {
      id: 'a2b57b0a-7148-4961-8540-e493104bfd7c',
      name: 'my test event',
      start: startDate,
      end: endDate,
    });
    const events = await calendar.findCurrentlyRunningEvent(['test-calendar'], 'contains', 'nonnonon');
    const eventsId = events.map((e) => e.id);
    expect(eventsId).deep.equal([]);
  });
  it('should not find event in calendar - event in the past', async () => {
    await calendar.createEvent('test-calendar', {
      id: 'a2b57b0a-7148-4961-8540-e493104bfd7c',
      name: 'my test event',
      start: startDate,
      end: dayjs(now)
        .subtract(10, 'minute')
        .toDate(),
    });
    const events = await calendar.findCurrentlyRunningEvent(['test-calendar'], 'contains', 'test');
    const eventsId = events.map((e) => e.id);
    expect(eventsId).deep.equal([]);
  });
});
