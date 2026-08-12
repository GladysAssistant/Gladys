const { expect } = require('chai');

const Calendar = require('../../../lib/calendar');

describe('calendar.findEventsInRange', () => {
  const calendar = new Calendar();
  const from = new Date('2025-03-11T00:00:00.000Z');
  const to = new Date('2025-03-11T23:59:59.999Z');
  it('should return events starting in the range, sorted by start date', async () => {
    await calendar.createEvent('test-calendar', {
      name: 'Afternoon event',
      start: new Date('2025-03-11T14:00:00.000Z'),
      end: new Date('2025-03-11T15:00:00.000Z'),
    });
    await calendar.createEvent('test-calendar', {
      name: 'Morning event',
      start: new Date('2025-03-11T08:00:00.000Z'),
      end: new Date('2025-03-11T09:00:00.000Z'),
    });
    await calendar.createEvent('test-calendar', {
      name: 'Event outside range',
      start: new Date('2025-03-12T08:00:00.000Z'),
      end: new Date('2025-03-12T09:00:00.000Z'),
    });
    const events = await calendar.findEventsInRange(['test-calendar'], from, to);
    expect(events).to.have.lengthOf(2);
    expect(events[0]).to.have.property('name', 'Morning event');
    expect(events[1]).to.have.property('name', 'Afternoon event');
    expect(events[0].calendar.creator).to.have.property('language', 'en');
  });
  it('should not return events of a calendar which is not shared', async () => {
    const privateCalendar = await calendar.create({
      name: 'Private calendar',
      description: 'A calendar which is not shared',
      user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      shared: false,
    });
    await calendar.createEvent(privateCalendar.selector, {
      name: 'Private event',
      start: new Date('2025-03-11T10:00:00.000Z'),
      end: new Date('2025-03-11T11:00:00.000Z'),
    });
    const events = await calendar.findEventsInRange([privateCalendar.selector, 'test-calendar'], from, to);
    expect(events).to.have.lengthOf(0);
  });
  it('should not return events of a calendar which is not selected', async () => {
    await calendar.createEvent('test-calendar', {
      name: 'Morning event',
      start: new Date('2025-03-11T08:00:00.000Z'),
      end: new Date('2025-03-11T09:00:00.000Z'),
    });
    const events = await calendar.findEventsInRange(['another-calendar'], from, to);
    expect(events).to.have.lengthOf(0);
  });
});
