const { expect } = require('chai');

const Calendar = require('../../../lib/calendar');

const USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

describe('calendar.getEvents (events overlapping the range)', () => {
  const calendar = new Calendar();
  // a day range, as the calendar day view requests it
  const from = '2025-11-03T00:00:00.000Z';
  const to = '2025-11-04T00:00:00.000Z';

  const getEventNames = async (options) => {
    const events = await calendar.getEvents(USER_ID, options);
    return events.map((event) => event.name).sort();
  };

  it('should return a multi-day event that started before the range and ends after it', async () => {
    await calendar.createEvent('test-calendar', {
      name: 'School holidays',
      start: new Date('2025-10-18T00:00:00.000Z'),
      end: new Date('2025-11-03T12:00:00.000Z'),
      full_day: true,
    });
    await calendar.createEvent('test-calendar', {
      name: 'Two-week trip',
      start: new Date('2025-10-25T00:00:00.000Z'),
      end: new Date('2025-11-08T00:00:00.000Z'),
      full_day: true,
    });
    expect(await getEventNames({ from, to })).to.deep.equal(['School holidays', 'Two-week trip']);
  });

  it('should return an event crossing midnight on the day it ends', async () => {
    await calendar.createEvent('test-calendar', {
      name: 'Late party',
      start: new Date('2025-11-02T23:00:00.000Z'),
      end: new Date('2025-11-03T01:00:00.000Z'),
    });
    expect(await getEventNames({ from, to })).to.deep.equal(['Late party']);
  });

  it('should still return an event starting inside the range', async () => {
    await calendar.createEvent('test-calendar', {
      name: 'Meeting',
      start: new Date('2025-11-03T09:00:00.000Z'),
      end: new Date('2025-11-03T10:00:00.000Z'),
    });
    expect(await getEventNames({ from, to })).to.deep.equal(['Meeting']);
  });

  it('should not return an event without end that started before the range', async () => {
    await calendar.createEvent('test-calendar', {
      name: 'Past point-in-time event',
      start: new Date('2025-11-02T09:00:00.000Z'),
    });
    expect(await getEventNames({ from, to })).to.deep.equal([]);
  });

  it('should return an event without end that starts inside the range', async () => {
    await calendar.createEvent('test-calendar', {
      name: 'Point-in-time event',
      start: new Date('2025-11-03T09:00:00.000Z'),
    });
    expect(await getEventNames({ from, to })).to.deep.equal(['Point-in-time event']);
  });

  it('should not return an event ending exactly at the beginning of the range (exclusive end)', async () => {
    await calendar.createEvent('test-calendar', {
      name: 'Full-day event of the previous day',
      start: new Date('2025-11-02T00:00:00.000Z'),
      end: new Date('2025-11-03T00:00:00.000Z'),
      full_day: true,
    });
    expect(await getEventNames({ from, to })).to.deep.equal([]);
  });

  it('should return a zero-duration event starting exactly at the beginning of the range', async () => {
    await calendar.createEvent('test-calendar', {
      name: 'Zero-duration event',
      start: new Date('2025-11-03T00:00:00.000Z'),
      end: new Date('2025-11-03T00:00:00.000Z'),
    });
    expect(await getEventNames({ from, to })).to.deep.equal(['Zero-duration event']);
  });

  it('should not return an event starting exactly at the end of the range', async () => {
    await calendar.createEvent('test-calendar', {
      name: 'Full-day event of the next day',
      start: new Date('2025-11-04T00:00:00.000Z'),
      end: new Date('2025-11-05T00:00:00.000Z'),
      full_day: true,
    });
    await calendar.createEvent('test-calendar', {
      name: 'Point-in-time event of the next day',
      start: new Date('2025-11-04T00:00:00.000Z'),
    });
    expect(await getEventNames({ from, to })).to.deep.equal([]);
  });

  it('should not return events entirely before or after the range', async () => {
    await calendar.createEvent('test-calendar', {
      name: 'Event before',
      start: new Date('2025-11-01T09:00:00.000Z'),
      end: new Date('2025-11-01T10:00:00.000Z'),
    });
    await calendar.createEvent('test-calendar', {
      name: 'Event after',
      start: new Date('2025-11-05T09:00:00.000Z'),
      end: new Date('2025-11-05T10:00:00.000Z'),
    });
    expect(await getEventNames({ from, to })).to.deep.equal([]);
  });

  it('should keep the other filters on top of the range', async () => {
    const otherCalendar = await calendar.create({
      name: 'Other calendar',
      description: 'Other calendar',
      user_id: USER_ID,
    });
    await calendar.createEvent('test-calendar', {
      name: 'Holidays in the test calendar',
      start: new Date('2025-10-18T00:00:00.000Z'),
      end: new Date('2025-11-08T00:00:00.000Z'),
      full_day: true,
    });
    await calendar.createEvent(otherCalendar.selector, {
      name: 'Holidays in the other calendar',
      start: new Date('2025-10-18T00:00:00.000Z'),
      end: new Date('2025-11-08T00:00:00.000Z'),
      full_day: true,
    });
    expect(await getEventNames({ from, to, calendarId: otherCalendar.id })).to.deep.equal([
      'Holidays in the other calendar',
    ]);
  });
});
