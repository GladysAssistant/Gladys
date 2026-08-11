const { assert } = require('chai');

const Calendar = require('../../../lib/calendar');

const USER_A = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
const USER_B = '7a137a56-069e-4996-8816-36558174b727';

// The seeded 'test-calendar' (and its events) belongs to USER_A: with another
// userId every write must answer exactly like an unknown selector.
describe('calendar ownership checks', () => {
  const calendar = new Calendar();

  it('should update a calendar when the user owns it', async () => {
    await calendar.update('test-calendar', { name: 'New name' }, USER_A);
  });
  it('should refuse to update a calendar of another user', async () => {
    const promise = calendar.update('test-calendar', { name: 'New name' }, USER_B);
    return assert.isRejected(promise, 'Calendar not found');
  });
  it('should refuse to destroy a calendar of another user', async () => {
    const promise = calendar.destroy('test-calendar', USER_B);
    return assert.isRejected(promise, 'Calendar not found');
  });
  it('should refuse to create an event in a calendar of another user', async () => {
    const promise = calendar.createEvent('test-calendar', { name: 'Event', start: '2026-08-14T09:00:00.000Z' }, USER_B);
    return assert.isRejected(promise, 'Calendar not found');
  });
  it('should update an event when the user owns the calendar', async () => {
    await calendar.updateEvent('test-calendar-event', { name: 'New name' }, USER_A);
  });
  it('should refuse to update an event of another user', async () => {
    const promise = calendar.updateEvent('test-calendar-event', { name: 'New name' }, USER_B);
    return assert.isRejected(promise, 'CalendarEvent not found');
  });
  it('should destroy an event when the user owns the calendar', async () => {
    await calendar.destroyEvent('test-calendar-event', USER_A);
  });
  it('should refuse to destroy an event of another user', async () => {
    const promise = calendar.destroyEvent('test-calendar-event', USER_B);
    return assert.isRejected(promise, 'CalendarEvent not found');
  });
});
