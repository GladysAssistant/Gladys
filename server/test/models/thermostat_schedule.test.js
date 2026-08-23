const { expect } = require('chai');

const db = require('../../models');

// build(...).validate() runs the model validators and the beforeValidate hook
// that derives the selector, without touching the database.
describe('models/thermostat_schedule', () => {
  it('should derive a selector from the name on a new record', async () => {
    const schedule = db.ThermostatSchedule.build({ name: 'Semaine de travail' });

    await schedule.validate();

    expect(schedule.selector).to.match(/^semaine-de-travail-\d+/);
  });

  it('should keep a selector that was provided', async () => {
    const schedule = db.ThermostatSchedule.build({ name: 'Semaine', selector: 'my-own-selector' });

    await schedule.validate();

    expect(schedule.selector).to.equal('my-own-selector');
  });

  it('should require a name', async () => {
    let error = null;
    try {
      await db.ThermostatSchedule.build({ selector: 'no-name' }).validate();
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
  });
});

describe('models/thermostat_schedule_slot', () => {
  const buildSlot = (overrides = {}) =>
    db.ThermostatScheduleSlot.build({
      schedule_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      day_of_week: 0,
      start_time: '07:00',
      end_time: '09:00',
      preset: 'comfort',
      ...overrides,
    });

  const expectInvalid = async (overrides) => {
    let error = null;
    try {
      await buildSlot(overrides).validate();
    } catch (e) {
      error = e;
    }
    expect(error, `expected ${JSON.stringify(overrides)} to be rejected`).to.not.equal(null);
  };

  it('should accept a valid slot', async () => {
    await buildSlot().validate();
  });

  it('should accept every day of the week', async () => {
    await Promise.all([0, 1, 2, 3, 4, 5, 6].map((day) => buildSlot({ day_of_week: day }).validate()));
  });

  it('should reject a day outside the week', async () => {
    await expectInvalid({ day_of_week: 7 });
    await expectInvalid({ day_of_week: -1 });
  });

  it('should accept every known preset', async () => {
    await Promise.all(
      ['off', 'frost', 'away', 'eco', 'night', 'comfort'].map((preset) => buildSlot({ preset }).validate()),
    );
  });

  it('should reject an unknown preset', async () => {
    await expectInvalid({ preset: 'party' });
  });
});
