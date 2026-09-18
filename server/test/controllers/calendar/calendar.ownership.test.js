const { authenticatedRequest } = require('../request.test');
const db = require('../../../models');

const USER_B = '7a137a56-069e-4996-8816-36558174b727';

// authenticatedRequest carries USER_A's session: another user's calendar must
// answer 404 on every write, indistinguishable from an unknown selector.
describe('calendar routes ownership', () => {
  let otherCalendar;
  let otherEvent;

  beforeEach(async () => {
    otherCalendar = await db.Calendar.create({
      name: 'Other user calendar',
      description: 'Belongs to USER_B',
      selector: 'other-user-calendar',
      user_id: USER_B,
    });
    otherEvent = await db.CalendarEvent.create({
      name: 'Other user event',
      selector: 'other-user-event',
      calendar_id: otherCalendar.id,
      start: '2026-08-14T09:00:00.000Z',
    });
  });

  it('should return 404 when patching a calendar of another user', async () => {
    await authenticatedRequest
      .patch(`/api/v1/calendar/${otherCalendar.selector}`)
      .send({ name: 'hacked' })
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('should return 404 when deleting a calendar of another user', async () => {
    await authenticatedRequest
      .delete(`/api/v1/calendar/${otherCalendar.selector}`)
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('should return 404 when creating an event in a calendar of another user', async () => {
    await authenticatedRequest
      .post(`/api/v1/calendar/${otherCalendar.selector}/event`)
      .send({ name: 'hacked', start: '2026-08-14T09:00:00.000Z' })
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('should return 404 when patching an event of another user', async () => {
    await authenticatedRequest
      .patch(`/api/v1/calendar/event/${otherEvent.selector}`)
      .send({ name: 'hacked' })
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('should return 404 when deleting an event of another user', async () => {
    await authenticatedRequest
      .delete(`/api/v1/calendar/event/${otherEvent.selector}`)
      .expect('Content-Type', /json/)
      .expect(404);
  });
});
