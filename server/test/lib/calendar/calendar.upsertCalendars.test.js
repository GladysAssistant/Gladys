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
    await db.Calendar.update(
      { sync: false, shared: true },
      { where: { external_id: 'ext:my-int:john:primary' } },
    );
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
});
