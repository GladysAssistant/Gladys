const { expect, assert } = require('chai');

const Calendar = require('../../../lib/calendar');
const db = require('../../../models');

const USER_A = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
const USER_B = '7a137a56-069e-4996-8816-36558174b727';
const SERVICE_ID = 'a810b8db-6d04-4697-bed3-c4b72c996279';
const PREFIX = 'ext:my-int:john:';

describe('calendar.upsertEvents', () => {
  const calendar = new Calendar();
  let calendarA;

  beforeEach(async () => {
    const { calendars } = await calendar.upsertCalendars(USER_A, SERVICE_ID, [
      { external_id: `${PREFIX}primary`, name: 'Primary' },
    ]);
    [calendarA] = calendars;
  });

  it('should reject an unknown calendar', async () => {
    const promise = calendar.upsertEvents('9934a836-946e-4c1b-9be1-b26bc4b0f4f2', []);
    await assert.isRejected(promise, 'Calendar not found');
  });

  it('should reject an event without external_id', async () => {
    // the upsert is keyed by external_id: a missing one would match the
    // manually created events (external_id NULL)
    const promise = calendar.upsertEvents(calendarA.id, [{ name: 'No key', start: '2026-08-14T09:00:00.000Z' }]);
    await assert.isRejected(promise, 'external_id: must be a non-empty string');
    const empty = calendar.upsertEvents(calendarA.id, [
      { external_id: '', name: 'No key', start: '2026-08-14T09:00:00.000Z' },
    ]);
    await assert.isRejected(empty, 'external_id: must be a non-empty string');
  });

  it('should reject a window without prunePrefix', async () => {
    const promise = calendar.upsertEvents(calendarA.id, [], {
      window: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
    });
    await assert.isRejected(promise, 'prunePrefix: is required when a window is provided');
  });

  it('should create, then update an event idempotently', async () => {
    const first = await calendar.upsertEvents(calendarA.id, [
      {
        external_id: `${PREFIX}uid-1`,
        name: 'Dentist',
        start: '2026-08-14T09:00:00.000Z',
        end: '2026-08-14T09:30:00.000Z',
        location: 'Paris',
        description: 'Yearly check',
        url: 'https://example.com/event',
      },
    ]);
    expect(first).to.deep.include({ created: 1, updated: 0, deleted: 0 });
    const second = await calendar.upsertEvents(calendarA.id, [
      { external_id: `${PREFIX}uid-1`, name: 'Dentist (moved)', start: '2026-08-14T10:00:00.000Z' },
    ]);
    expect(second).to.deep.include({ created: 0, updated: 1, deleted: 0 });
    const row = await db.CalendarEvent.findOne({ where: { external_id: `${PREFIX}uid-1` } });
    expect(row.name).to.equal('Dentist (moved)');
    expect(row.end).to.equal(null);
    expect(row.location).to.equal(null);
    expect(row.full_day).to.equal(false);
  });

  it('should move an event republished under another calendar of the same user', async () => {
    const { calendars } = await calendar.upsertCalendars(USER_A, SERVICE_ID, [
      { external_id: `${PREFIX}work`, name: 'Work' },
    ]);
    const [calendarWork] = calendars;
    await calendar.upsertEvents(calendarA.id, [
      { external_id: `${PREFIX}uid-move`, name: 'Meeting', start: '2026-08-14T09:00:00.000Z' },
    ]);
    const result = await calendar.upsertEvents(calendarWork.id, [
      { external_id: `${PREFIX}uid-move`, name: 'Meeting', start: '2026-08-14T09:00:00.000Z' },
    ]);
    expect(result).to.deep.include({ created: 0, updated: 1, deleted: 0 });
    const row = await db.CalendarEvent.findOne({ where: { external_id: `${PREFIX}uid-move` } });
    expect(row.calendar_id).to.equal(calendarWork.id);
    const countInA = await db.CalendarEvent.count({ where: { calendar_id: calendarA.id } });
    expect(countInA).to.equal(0);
  });

  it('should refuse to steal an event of another user', async () => {
    const { calendars } = await calendar.upsertCalendars(USER_B, SERVICE_ID, [
      { external_id: 'ext:my-int:pepper:primary', name: 'Pepper primary' },
    ]);
    const [calendarB] = calendars;
    await calendar.upsertEvents(calendarA.id, [
      { external_id: `${PREFIX}uid-stolen`, name: 'Mine', start: '2026-08-14T09:00:00.000Z' },
    ]);
    const promise = calendar.upsertEvents(calendarB.id, [
      { external_id: `${PREFIX}uid-stolen`, name: 'Stolen', start: '2026-08-14T09:00:00.000Z' },
    ]);
    await assert.isRejected(promise, 'already belongs to another owner');
  });

  it('should prune by overlap: absent prefixed events go, manual and out-of-window ones stay', async () => {
    await calendar.upsertEvents(calendarA.id, [
      // multi-day event straddling the window start: overlaps, will be absent → pruned
      {
        external_id: `${PREFIX}straddling`,
        name: 'Holiday',
        start: '2026-07-28T00:00:00.000Z',
        end: '2026-08-04T00:00:00.000Z',
      },
      // event inside the window, still published → kept
      { external_id: `${PREFIX}kept`, name: 'Kept', start: '2026-08-10T09:00:00.000Z' },
      // event before the window without end: does not overlap → not pruned
      { external_id: `${PREFIX}before`, name: 'Before', start: '2026-07-15T09:00:00.000Z' },
    ]);
    // a manually created event (unprefixed external_id) in the window
    await calendar.createEvent(calendarA.selector, {
      name: 'Manual event',
      start: '2026-08-12T09:00:00.000Z',
    });
    // full-day event ending exactly at the window start: exclusive end, does
    // not overlap, must not be pruned
    await calendar.upsertEvents(calendarA.id, [
      {
        external_id: `${PREFIX}boundary`,
        name: 'Boundary',
        start: '2026-07-31T00:00:00.000Z',
        end: '2026-08-01T00:00:00.000Z',
        full_day: true,
      },
    ]);
    const result = await calendar.upsertEvents(
      calendarA.id,
      [{ external_id: `${PREFIX}kept`, name: 'Kept', start: '2026-08-10T09:00:00.000Z' }],
      { window: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' }, prunePrefix: PREFIX },
    );
    expect(result).to.deep.include({ created: 0, updated: 1, deleted: 1 });
    const remaining = await db.CalendarEvent.findAll({ where: { calendar_id: calendarA.id } });
    const names = remaining.map((event) => event.name).sort();
    expect(names).to.eql(['Before', 'Boundary', 'Kept', 'Manual event']);
  });

  it('should reject an upsert exceeding the per-calendar events cap', async function test() {
    // seeding 9999 rows can exceed the default 2s timeout under parallel load
    this.timeout(20000);
    const rows = [];
    for (let i = 0; i < 9999; i += 1) {
      rows.push({
        id: `00000000-0000-4000-8000-${`${i}`.padStart(12, '0')}`,
        calendar_id: calendarA.id,
        external_id: `${PREFIX}bulk-${i}`,
        selector: `bulk-event-${i}`,
        name: `Bulk ${i}`,
        start: '2026-08-14T09:00:00.000Z',
        full_day: false,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
    await db.CalendarEvent.bulkCreate(rows);
    const promise = calendar.upsertEvents(calendarA.id, [
      { external_id: `${PREFIX}cap-1`, name: 'Last one', start: '2026-08-14T09:00:00.000Z' },
      { external_id: `${PREFIX}cap-2`, name: 'Too many', start: '2026-08-14T09:00:00.000Z' },
    ]);
    await assert.isRejected(promise, 'cannot hold more than 10000 events');
    // fill the last slot, then verify the cap also holds on the move path
    await calendar.upsertEvents(calendarA.id, [
      { external_id: `${PREFIX}cap-1`, name: 'Last one', start: '2026-08-14T09:00:00.000Z' },
    ]);
    const { calendars } = await calendar.upsertCalendars(USER_A, SERVICE_ID, [
      { external_id: `${PREFIX}other`, name: 'Other' },
    ]);
    const [calendarOther] = calendars;
    await calendar.upsertEvents(calendarOther.id, [
      { external_id: `${PREFIX}mover`, name: 'Mover', start: '2026-08-14T09:00:00.000Z' },
    ]);
    const movePromise = calendar.upsertEvents(calendarA.id, [
      { external_id: `${PREFIX}mover`, name: 'Mover', start: '2026-08-14T09:00:00.000Z' },
    ]);
    await assert.isRejected(movePromise, 'cannot hold more than 10000 events');
  });
});
