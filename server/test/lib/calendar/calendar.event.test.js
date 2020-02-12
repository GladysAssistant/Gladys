const { expect, assert } = require('chai');

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
        selector: 'test-calendar-event',
        external_id: null,
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
        selector: 'test-calendar-event',
        external_id: null,
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
        selector: 'test-calendar-event-2',
        external_id: null,
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
        selector: 'test-calendar-event',
        external_id: null,
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
        selector: 'test-calendar-event-2',
        external_id: null,
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
