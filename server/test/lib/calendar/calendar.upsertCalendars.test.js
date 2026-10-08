const { expect, assert } = require('chai');

const Calendar = require('../../../lib/calendar');
const db = require('../../../models');

const USER_A = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
const USER_B = '7a137a56-069e-4996-8816-36558174b727';
const SERVICE_ID = 'a810b8db-6d04-4697-bed3-c4b72c996279';

describe('calendar.upsertCalendars', () => {
  const calendar = new Calendar();

  it('should create a calendar with defaults and update it idempotently', async () => {
    const first = await calendar.upsertCalendars(USER_A, SERVICE_ID, [
      { external_id: 'ext:my-int:john:primary', name: 'Primary' },
    ]);
    expect(first.created).to.equal(1);
    expect(first.updated).to.equal(0);
    const [createdCalendar] = first.calendars;
    expect(createdCalendar).to.have.property('name', 'Primary');
    expect(createdCalendar).to.have.property('selector', 'primary');
    expect(createdCalendar).to.have.property('description', '');
    expect(createdCalendar).to.have.property('color', '#3174ad');
    expect(createdCalendar).to.have.property('type', 'EXTERNAL');
    expect(createdCalendar).to.have.property('sync', true);
    expect(createdCalendar).to.have.property('shared', false);

    // The user takes ownership of sync/shared, then the integration republishes
    await db.Calendar.update({ sync: false, shared: true }, { where: { external_id: 'ext:my-int:john:primary' } });
    const second = await calendar.upsertCalendars(USER_A, SERVICE_ID, [
      { external_id: 'ext:my-int:john:primary', name: 'Primary renamed', description: 'Desc', color: '#123456' },
    ]);
    expect(second.created).to.equal(0);
    expect(second.updated).to.equal(1);
    const row = await db.Calendar.findOne({ where: { external_id: 'ext:my-int:john:primary' } });
    // integration-owned fields overwritten
    expect(row.name).to.equal('Primary renamed');
    expect(row.description).to.equal('Desc');
    expect(row.color).to.equal('#123456');
    // user-owned fields untouched
    expect(row.sync).to.equal(false);
    expect(row.shared).to.equal(true);
    expect(row.selector).to.equal('primary');
  });

  it('should resolve selector collisions between two users pushing the same name', async () => {
    await calendar.upsertCalendars(USER_A, SERVICE_ID, [{ external_id: 'ext:my-int:john:perso', name: 'Personal' }]);
    const second = await calendar.upsertCalendars(USER_B, SERVICE_ID, [
      { external_id: 'ext:my-int:pepper:perso', name: 'Personal' },
    ]);
    expect(second.created).to.equal(1);
    expect(second.calendars[0].selector).to.equal('personal-2');
  });

  it('should refuse to steal a calendar of another owner', async () => {
    await calendar.upsertCalendars(USER_A, SERVICE_ID, [{ external_id: 'ext:my-int:shared-id', name: 'Mine' }]);
    const promise = calendar.upsertCalendars(USER_B, SERVICE_ID, [
      { external_id: 'ext:my-int:shared-id', name: 'Stolen' },
    ]);
    await assert.isRejected(promise, 'already belongs to another owner');
    // and nothing was partially applied
    const row = await db.Calendar.findOne({ where: { external_id: 'ext:my-int:shared-id' } });
    expect(row.name).to.equal('Mine');
  });

  it('should refuse to steal a calendar of another service', async () => {
    const otherService = await db.Service.create({
      name: 'other-service',
      selector: 'other-service',
      version: '0.1.0',
    });
    await calendar.upsertCalendars(USER_A, SERVICE_ID, [{ external_id: 'ext:my-int:svc-id', name: 'Mine' }]);
    const promise = calendar.upsertCalendars(USER_A, otherService.id, [
      { external_id: 'ext:my-int:svc-id', name: 'Stolen' },
    ]);
    await assert.isRejected(promise, 'already belongs to another owner');
  });

  it('should give a readable fallback selector to a name that slugifies to nothing', async () => {
    // non-Latin scripts and emoji slugify to "": two such calendars must not
    // collide on an empty selector, even across users
    const { calendars: calendarsA } = await calendar.upsertCalendars(USER_A, SERVICE_ID, [
      { external_id: 'ext:my-int:john:cn', name: '日历' },
    ]);
    const { calendars: calendarsB } = await calendar.upsertCalendars(USER_B, SERVICE_ID, [
      { external_id: 'ext:my-int:pepper:ru', name: 'Календарь' },
    ]);
    expect(calendarsA[0].selector).to.equal('calendar');
    expect(calendarsB[0].selector).to.equal('calendar-2');
  });

  it('should cap the calendars of an owner, counting the existing ones outside the batch', async () => {
    // USER_B owns no seeded calendar; USER_A's (the seeded one included)
    // never count against USER_B's cap
    await calendar.upsertCalendars(USER_A, SERVICE_ID, [{ external_id: 'ext:my-int:john:one', name: 'One' }]);
    await calendar.upsertCalendars(USER_B, SERVICE_ID, [
      { external_id: 'ext:my-int:pepper:one', name: 'One' },
      { external_id: 'ext:my-int:pepper:two', name: 'Two' },
    ]);
    // republishing the existing calendars stays within the cap
    const republished = await calendar.upsertCalendars(
      USER_B,
      SERVICE_ID,
      [
        { external_id: 'ext:my-int:pepper:one', name: 'One' },
        { external_id: 'ext:my-int:pepper:two', name: 'Two' },
      ],
      { maxCalendars: 2 },
    );
    expect(republished.updated).to.equal(2);
    // one existing calendar outside the batch + a batch of two: three > 2
    const promise = calendar.upsertCalendars(
      USER_B,
      SERVICE_ID,
      [
        { external_id: 'ext:my-int:pepper:two', name: 'Two' },
        { external_id: 'ext:my-int:pepper:three', name: 'Three' },
      ],
      { maxCalendars: 2 },
    );
    await assert.isRejected(promise, 'calendars: a user cannot hold more than 2 calendars');
    const count = await db.Calendar.count({ where: { user_id: USER_B, service_id: SERVICE_ID } });
    expect(count).to.equal(2);
  });
});
