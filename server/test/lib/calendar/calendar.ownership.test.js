const { assert, expect } = require('chai');

const Calendar = require('../../../lib/calendar');
const db = require('../../../models');

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
  it('should ignore the ownership columns of a user-initiated calendar update', async () => {
    // owning a calendar must not be a way to hand it — and its events — over
    // to someone else
    await calendar.update(
      'test-calendar',
      {
        name: 'New name',
        user_id: USER_B,
        selector: 'stolen-selector',
        external_id: 'stolen-external-id',
      },
      USER_A,
    );
    const row = await db.Calendar.findOne({ where: { selector: 'test-calendar' } });
    expect(row.name).to.equal('New name');
    expect(row.user_id).to.equal(USER_A);
    expect(row.selector).to.equal('test-calendar');
    expect(row.external_id).to.equal('750db5b7-233b-41d1-89eb-d3aa4e959295');
  });
  it('should still write the full row of a calendar for an internal caller (no userId)', async () => {
    // the CalDAV sync republishes whole calendars, external_id included
    await calendar.update('test-calendar', { name: 'Synced', external_id: 'new-calendar-external-id' });
    const row = await db.Calendar.findOne({ where: { selector: 'test-calendar' } });
    expect(row.name).to.equal('Synced');
    expect(row.external_id).to.equal('new-calendar-external-id');
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
  it('should ignore the ownership columns of a user-initiated event update', async () => {
    // owning an event must not be a way to push it onto someone else's agenda
    const foreignCalendar = await calendar.create({
      name: 'Calendar of another user',
      selector: 'calendar-of-another-user',
      description: 'Calendar of another user',
      user_id: USER_B,
    });
    await calendar.updateEvent(
      'test-calendar-event',
      {
        name: 'New name',
        calendar_id: foreignCalendar.id,
        external_id: 'stolen-external-id',
        selector: 'stolen-selector',
      },
      USER_A,
    );
    const row = await db.CalendarEvent.findOne({ where: { selector: 'test-calendar-event' } });
    expect(row.name).to.equal('New name');
    expect(row.calendar_id).to.equal('07ec2599-3221-4d6c-ac56-41443973201b');
    expect(row.external_id).to.equal('d5ad1bd8-96a1-44ed-b103-98515892c2d0');
  });
  it('should still write the full row for an internal caller (no userId)', async () => {
    // the CalDAV sync republishes whole events, calendar_id included
    await calendar.updateEvent('test-calendar-event', { name: 'Synced', external_id: 'new-external-id' });
    const row = await db.CalendarEvent.findOne({ where: { selector: 'test-calendar-event' } });
    expect(row.name).to.equal('Synced');
    expect(row.external_id).to.equal('new-external-id');
  });
  it('should destroy an event when the user owns the calendar', async () => {
    await calendar.destroyEvent('test-calendar-event', USER_A);
  });
  it('should refuse to destroy an event of another user', async () => {
    const promise = calendar.destroyEvent('test-calendar-event', USER_B);
    return assert.isRejected(promise, 'CalendarEvent not found');
  });
});
