const { expect } = require('chai');

const db = require('../../models');

const HOUSE_ID = 'a741dfa6-24de-4b46-afc7-370772f068d5';
const OTHER_HOUSE_ID = '6295ad8b-b655-4422-9e6d-b4612da5d55f';
const DEVICE_ID = '7f85c2f8-86cc-4600-84db-6c074dadb4e8';

const expectRejected = async (promise) => {
  let error = null;
  try {
    await promise;
  } catch (e) {
    error = e;
  }
  expect(error, 'expected the write to be rejected').to.not.equal(null);
  return error;
};

// build(...).validate() runs the model validators and the beforeValidate hook
// that derives the selector, without touching the database.
describe('models/thermostat_schedule', () => {
  it('should derive a selector from the name on a new record', async () => {
    const schedule = db.ThermostatSchedule.build({ house_id: HOUSE_ID, name: 'Semaine de travail' });

    await schedule.validate();

    expect(schedule.selector).to.match(/^semaine-de-travail-\d+/);
  });

  it('should keep a selector that was provided', async () => {
    const schedule = db.ThermostatSchedule.build({ house_id: HOUSE_ID, name: 'Semaine', selector: 'my-own-selector' });

    await schedule.validate();

    expect(schedule.selector).to.equal('my-own-selector');
  });

  it('should require a name', async () => {
    await expectRejected(db.ThermostatSchedule.build({ house_id: HOUSE_ID, selector: 'no-name' }).validate());
  });

  it('should reject an empty name', async () => {
    await expectRejected(db.ThermostatSchedule.build({ house_id: HOUSE_ID, name: '' }).validate());
  });

  it('should require a house', async () => {
    await expectRejected(db.ThermostatSchedule.create({ name: 'Sans maison' }));
  });
});

describe('models/thermostat_schedule (database constraints)', () => {
  afterEach(async () => {
    await db.ThermostatSchedule.destroy({ where: {}, truncate: true, cascade: true });
  });

  it('should refuse two schedules with the same name in one house', async () => {
    await db.ThermostatSchedule.create({ house_id: HOUSE_ID, name: 'Semaine' });

    const error = await expectRejected(db.ThermostatSchedule.create({ house_id: HOUSE_ID, name: 'Semaine' }));

    expect(error.name).to.equal('SequelizeUniqueConstraintError');
  });

  it('should allow the same name in two different houses', async () => {
    await db.ThermostatSchedule.create({ house_id: HOUSE_ID, name: 'Semaine' });
    const other = await db.ThermostatSchedule.create({ house_id: OTHER_HOUSE_ID, name: 'Semaine' });

    expect(other.id).to.be.a('string');
  });

  it('should delete the transitions of a deleted schedule', async () => {
    const schedule = await db.ThermostatSchedule.create({ house_id: HOUSE_ID, name: 'Semaine' });
    await db.ThermostatScheduleTransition.create({
      schedule_id: schedule.id,
      day_of_week: 0,
      time: '06:30',
      preset: 'comfort',
    });

    await schedule.destroy();

    expect(await db.ThermostatScheduleTransition.count({ where: { schedule_id: schedule.id } })).to.equal(0);
  });
});

describe('models/thermostat_schedule_transition', () => {
  const buildTransition = (overrides = {}) =>
    db.ThermostatScheduleTransition.build({
      schedule_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      day_of_week: 0,
      time: '07:00',
      preset: 'comfort',
      ...overrides,
    });

  it('should accept a valid transition', async () => {
    await buildTransition().validate();
  });

  it('should accept off, which stops the heating on that point', async () => {
    await buildTransition({ preset: 'off' }).validate();
  });

  it('should reject a day outside 0-6', async () => {
    await expectRejected(buildTransition({ day_of_week: 7 }).validate());
    await expectRejected(buildTransition({ day_of_week: -1 }).validate());
  });

  it('should reject a malformed time', async () => {
    await expectRejected(buildTransition({ time: '7:00' }).validate());
    await expectRejected(buildTransition({ time: '24:00' }).validate());
    await expectRejected(buildTransition({ time: '07:60' }).validate());
  });

  it('should reject an unknown preset', async () => {
    await expectRejected(buildTransition({ preset: 'party' }).validate());
  });

  it('should reject schedule as a preset, the programme referring to itself', async () => {
    await expectRejected(buildTransition({ preset: 'schedule' }).validate());
  });

  it('should refuse two points on the same day at the same time', async () => {
    const schedule = await db.ThermostatSchedule.create({ house_id: HOUSE_ID, name: 'Doublon' });
    await db.ThermostatScheduleTransition.create({
      schedule_id: schedule.id,
      day_of_week: 0,
      time: '06:30',
      preset: 'comfort',
    });

    const error = await expectRejected(
      db.ThermostatScheduleTransition.create({
        schedule_id: schedule.id,
        day_of_week: 0,
        time: '06:30',
        preset: 'eco',
      }),
    );

    expect(error.name).to.equal('SequelizeUniqueConstraintError');
    await schedule.destroy();
  });
});

describe('models/thermostat_schedule_device', () => {
  let schedule;
  let otherSchedule;

  beforeEach(async () => {
    schedule = await db.ThermostatSchedule.create({ house_id: HOUSE_ID, name: 'Plan A' });
    otherSchedule = await db.ThermostatSchedule.create({ house_id: HOUSE_ID, name: 'Plan B' });
  });

  afterEach(async () => {
    await db.ThermostatSchedule.destroy({ where: {}, truncate: true, cascade: true });
  });

  it('should link a thermostat to a schedule', async () => {
    const link = await db.ThermostatScheduleDevice.create({ device_id: DEVICE_ID, schedule_id: schedule.id });

    expect(link.device_id).to.equal(DEVICE_ID);
  });

  it('should refuse a second schedule for the same thermostat', async () => {
    await db.ThermostatScheduleDevice.create({ device_id: DEVICE_ID, schedule_id: schedule.id });

    const error = await expectRejected(
      db.ThermostatScheduleDevice.create({ device_id: DEVICE_ID, schedule_id: otherSchedule.id }),
    );

    expect(error.name).to.equal('SequelizeUniqueConstraintError');
  });

  it('should move a thermostat to another schedule through an upsert', async () => {
    await db.ThermostatScheduleDevice.create({ device_id: DEVICE_ID, schedule_id: schedule.id });

    await db.ThermostatScheduleDevice.upsert({ device_id: DEVICE_ID, schedule_id: otherSchedule.id });

    const link = await db.ThermostatScheduleDevice.findOne({ where: { device_id: DEVICE_ID } });
    expect(link.schedule_id).to.equal(otherSchedule.id);
  });

  it('should answer which thermostats follow a schedule', async () => {
    await db.ThermostatScheduleDevice.create({ device_id: DEVICE_ID, schedule_id: schedule.id });

    expect(await db.ThermostatScheduleDevice.count({ where: { schedule_id: schedule.id } })).to.equal(1);
    expect(await db.ThermostatScheduleDevice.count({ where: { schedule_id: otherSchedule.id } })).to.equal(0);
  });

  it('should drop the link when the schedule is deleted, with no detach code', async () => {
    await db.ThermostatScheduleDevice.create({ device_id: DEVICE_ID, schedule_id: schedule.id });

    await schedule.destroy();

    expect(await db.ThermostatScheduleDevice.count({ where: { device_id: DEVICE_ID } })).to.equal(0);
  });
});
