const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const noopLogger = {
  debug: fake.returns(null),
  info: fake.returns(null),
  warn: fake.returns(null),
};

// Minimal Sequelize stand-in: only the calls these modules actually make.
const buildDb = ({ schedule = null, duplicate = null, created = null } = {}) => {
  const scheduleInstance = schedule && {
    id: schedule.id || 'schedule-id',
    ...schedule,
    update: fake.resolves(null),
    destroy: fake.resolves(null),
    get: () => ({ ...schedule }),
  };

  return {
    ThermostatSchedule: {
      findOne: fake(async ({ where }) => {
        if (where.selector) {
          return scheduleInstance;
        }
        return duplicate;
      }),
      findAll: fake.resolves([{ get: () => ({ name: 'Work week', slots: [] }) }]),
      findByPk: fake.resolves({ get: () => created || { name: 'Work week', slots: [] } }),
      create: fake.resolves({ id: 'created-id' }),
    },
    ThermostatScheduleSlot: {
      destroy: fake.resolves(null),
      bulkCreate: fake.resolves(null),
    },
    sequelize: {
      transaction: async (cb) => cb('tx'),
    },
    scheduleInstance,
  };
};

const load = (name, db) =>
  proxyquire(`../../../../services/thermostat/lib/thermostat.${name}`, {
    '../../../models': db,
    '../../../utils/logger': noopLogger,
    '../../../utils/slugify': { slugify: (v) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
  });

describe('thermostat.createSchedule', () => {
  it('should create a schedule with its slots', async () => {
    const db = buildDb();
    const { createSchedule } = load('createSchedule', db);

    await createSchedule({
      name: 'Work week',
      slots: [{ day_of_week: 0, start_time: '08:00', end_time: '18:00', preset: 'comfort' }],
    });

    assert.calledOnce(db.ThermostatSchedule.create);
    const [payload] = db.ThermostatSchedule.create.firstCall.args;
    expect(payload.name).to.equal('Work week');
    expect(payload.slots).to.have.lengthOf(1);
    expect(payload.slots[0]).to.deep.equal({
      day_of_week: 0,
      start_time: '08:00',
      end_time: '18:00',
      preset: 'comfort',
    });
  });

  it('should accept a schedule without any slot', async () => {
    const db = buildDb();
    const { createSchedule } = load('createSchedule', db);

    await createSchedule({ name: 'Empty' });

    const [payload] = db.ThermostatSchedule.create.firstCall.args;
    expect(payload.slots).to.deep.equal([]);
  });

  it('should reject a duplicate name', async () => {
    const db = buildDb({ duplicate: { id: 'other-id', name: 'Work week' } });
    const { createSchedule } = load('createSchedule', db);

    let error = null;
    try {
      await createSchedule({ name: 'Work week', slots: [] });
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.contain('already exists');
    assert.notCalled(db.ThermostatSchedule.create);
  });

  it('should report a name taken between the precheck and the insert', async () => {
    // The precheck is not atomic: a concurrent create can take the name in
    // between, and the database unique constraint is what catches it.
    const db = buildDb();
    const uniqueError = new Error('Validation error');
    uniqueError.name = 'SequelizeUniqueConstraintError';
    db.ThermostatSchedule.create = fake.rejects(uniqueError);
    const { createSchedule } = load('createSchedule', db);

    let error = null;
    try {
      await createSchedule({ name: 'Work week', slots: [] });
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.contain('already exists');
  });

  it('should let an unrelated create failure bubble up unchanged', async () => {
    const db = buildDb();
    db.ThermostatSchedule.create = fake.rejects(new Error('database is locked'));
    const { createSchedule } = load('createSchedule', db);

    let error = null;
    try {
      await createSchedule({ name: 'Work week', slots: [] });
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.equal('database is locked');
  });

  it('should persist the day coerced by Joi, not the raw string', async () => {
    const db = buildDb();
    const { createSchedule } = load('createSchedule', db);

    // A day arriving as a string would otherwise be stored as such and then
    // match no regulation tick, since the loop compares against a number.
    await createSchedule({
      name: 'Coerced',
      slots: [{ day_of_week: '3', start_time: '08:00', end_time: '18:00', preset: 'comfort' }],
    });

    const [payload] = db.ThermostatSchedule.create.firstCall.args;
    expect(payload.slots[0].day_of_week).to.equal(3);
  });
});

describe('thermostat.updateSchedule', () => {
  it('should replace name and slots in a single transaction', async () => {
    const db = buildDb({ schedule: { id: 'schedule-id', selector: 'my-schedule' } });
    const { updateSchedule } = load('updateSchedule', db);

    await updateSchedule('my-schedule', {
      name: 'Renamed',
      slots: [{ day_of_week: 2, start_time: '06:00', end_time: '09:00', preset: 'eco' }],
    });

    assert.calledOnce(db.scheduleInstance.update);
    assert.calledOnce(db.ThermostatScheduleSlot.destroy);
    assert.calledOnce(db.ThermostatScheduleSlot.bulkCreate);

    const [rows] = db.ThermostatScheduleSlot.bulkCreate.firstCall.args;
    expect(rows[0]).to.deep.equal({
      schedule_id: 'schedule-id',
      day_of_week: 2,
      start_time: '06:00',
      end_time: '09:00',
      preset: 'eco',
    });
  });

  it('should not re-create slots when the new schedule is empty', async () => {
    const db = buildDb({ schedule: { id: 'schedule-id', selector: 'my-schedule' } });
    const { updateSchedule } = load('updateSchedule', db);

    await updateSchedule('my-schedule', { name: 'Renamed', slots: [] });

    assert.calledOnce(db.ThermostatScheduleSlot.destroy);
    assert.notCalled(db.ThermostatScheduleSlot.bulkCreate);
  });

  it('should throw when the schedule does not exist', async () => {
    const db = buildDb();
    const { updateSchedule } = load('updateSchedule', db);

    let error = null;
    try {
      await updateSchedule('unknown', { name: 'x', slots: [] });
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.contain('Schedule not found');
  });

  it('should reject renaming onto another existing schedule', async () => {
    const db = buildDb({
      schedule: { id: 'schedule-id', selector: 'my-schedule' },
      duplicate: { id: 'another-id', name: 'Taken' },
    });
    const { updateSchedule } = load('updateSchedule', db);

    let error = null;
    try {
      await updateSchedule('my-schedule', { name: 'Taken', slots: [] });
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.contain('already exists');
    assert.notCalled(db.ThermostatScheduleSlot.destroy);
  });

  it('should report a name taken between the duplicate check and the update', async () => {
    const db = buildDb({ schedule: { id: 'schedule-id', name: 'Work week' } });
    const uniqueError = new Error('Validation error');
    uniqueError.name = 'SequelizeUniqueConstraintError';
    db.sequelize.transaction = async () => {
      throw uniqueError;
    };
    const { updateSchedule } = load('updateSchedule', db);

    let error = null;
    try {
      await updateSchedule('my-schedule', { name: 'Taken', slots: [] });
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.contain('already exists');
  });

  it('should let an unrelated update failure bubble up unchanged', async () => {
    const db = buildDb({ schedule: { id: 'schedule-id', name: 'Work week' } });
    db.sequelize.transaction = async () => {
      throw new Error('database is locked');
    };
    const { updateSchedule } = load('updateSchedule', db);

    let error = null;
    try {
      await updateSchedule('my-schedule', { name: 'Taken', slots: [] });
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.equal('database is locked');
  });

  it('should persist the day coerced by Joi on update too', async () => {
    const db = buildDb({ schedule: { id: 'schedule-id', name: 'Work week', update: fake.resolves(null) } });
    const { updateSchedule } = load('updateSchedule', db);

    await updateSchedule('my-schedule', {
      name: 'Work week',
      slots: [{ day_of_week: '5', start_time: '08:00', end_time: '18:00', preset: 'eco' }],
    });

    const [rows] = db.ThermostatScheduleSlot.bulkCreate.firstCall.args;
    expect(rows[0].day_of_week).to.equal(5);
  });

  it('should allow keeping its own name', async () => {
    const db = buildDb({
      schedule: { id: 'schedule-id', selector: 'my-schedule' },
      duplicate: { id: 'schedule-id', name: 'Same name' },
    });
    const { updateSchedule } = load('updateSchedule', db);

    await updateSchedule('my-schedule', { name: 'Same name', slots: [] });

    assert.calledOnce(db.scheduleInstance.update);
  });
});

describe('thermostat.deleteSchedule', () => {
  it('should delete the schedule and its slots', async () => {
    const db = buildDb({ schedule: { id: 'schedule-id', selector: 'my-schedule' } });
    const { deleteSchedule } = load('deleteSchedule', db);

    await deleteSchedule('my-schedule');

    assert.calledOnce(db.ThermostatScheduleSlot.destroy);
    expect(db.ThermostatScheduleSlot.destroy.firstCall.args[0]).to.deep.equal({
      where: { schedule_id: 'schedule-id' },
    });
    assert.calledOnce(db.scheduleInstance.destroy);
  });

  it('should throw when the schedule does not exist', async () => {
    const db = buildDb();
    const { deleteSchedule } = load('deleteSchedule', db);

    let error = null;
    try {
      await deleteSchedule('unknown');
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.contain('Schedule not found');
    assert.notCalled(db.ThermostatScheduleSlot.destroy);
  });
});

describe('thermostat.getSchedules', () => {
  it('should return plain schedules', async () => {
    const db = buildDb();
    const { getSchedules } = load('getSchedules', db);

    const schedules = await getSchedules();

    expect(schedules).to.deep.equal([{ name: 'Work week', slots: [] }]);
  });
});
