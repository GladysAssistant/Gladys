const { expect } = require('chai');

const db = require('../../../../models');
const ThermostatHandler = require('../../../../services/thermostat/lib');

const HOUSE_SELECTOR = 'test-house';
const OTHER_HOUSE_SELECTOR = 'pepper-house';

const expectRejected = async (promise, fragment) => {
  let error = null;
  try {
    await promise;
  } catch (e) {
    error = e;
  }
  expect(error, 'expected the call to be rejected').to.not.equal(null);
  if (fragment) {
    expect(error.message).to.contain(fragment);
  }
  return error;
};

describe('thermostat schedules CRUD', () => {
  let handler;

  beforeEach(() => {
    handler = new ThermostatHandler({}, 'service-id');
  });

  afterEach(async () => {
    await db.ThermostatSchedule.destroy({ where: {}, truncate: true, cascade: true });
  });

  describe('createSchedule', () => {
    it('should create a schedule in a house, with its transitions', async () => {
      const schedule = await handler.createSchedule(HOUSE_SELECTOR, {
        name: 'Work week',
        transitions: [
          { day_of_week: 0, time: '22:30', preset: 'night' },
          { day_of_week: 0, time: '06:30', preset: 'comfort' },
        ],
      });

      expect(schedule.name).to.equal('Work week');
      expect(schedule.house).to.equal(HOUSE_SELECTOR);
      expect(schedule.selector).to.match(/^work-week-\d+/);
      expect(schedule.devices).to.deep.equal([]);
      // Sorted by day then time, whatever order they were sent in.
      expect(schedule.transitions).to.deep.equal([
        { day_of_week: 0, time: '06:30', preset: 'comfort' },
        { day_of_week: 0, time: '22:30', preset: 'night' },
      ]);
    });

    it('should default to a schedule with no transition', async () => {
      const schedule = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Empty' });

      expect(schedule.transitions).to.deep.equal([]);
    });

    it('should persist the day coerced by Joi rather than the string it was sent', async () => {
      const schedule = await handler.createSchedule(HOUSE_SELECTOR, {
        name: 'Coerced',
        transitions: [{ day_of_week: '3', time: '06:30', preset: 'eco' }],
      });

      expect(schedule.transitions[0].day_of_week).to.equal(3);
    });

    it('should reject an unknown house', async () => {
      await expectRejected(handler.createSchedule('no-such-house', { name: 'Orphan' }), 'House not found');
    });

    it('should reject an invalid schedule before it reaches the database', async () => {
      await expectRejected(
        handler.createSchedule(HOUSE_SELECTOR, {
          name: 'Bad',
          transitions: [{ day_of_week: 9, time: '06:30', preset: 'eco' }],
        }),
        'Invalid thermostat schedule',
      );
      expect(await db.ThermostatSchedule.count()).to.equal(0);
    });

    it('should reject a duplicate name in the same house', async () => {
      await handler.createSchedule(HOUSE_SELECTOR, { name: 'Week' });

      await expectRejected(handler.createSchedule(HOUSE_SELECTOR, { name: 'Week' }), 'already exists');
    });

    it('should accept the same name in another house', async () => {
      await handler.createSchedule(HOUSE_SELECTOR, { name: 'Week' });

      const other = await handler.createSchedule(OTHER_HOUSE_SELECTOR, { name: 'Week' });

      expect(other.house).to.equal(OTHER_HOUSE_SELECTOR);
    });

    it('should report a name taken between the precheck and the insert', async () => {
      const house = await db.House.findOne({ where: { selector: HOUSE_SELECTOR } });
      // Simulate the race: the row appears after createSchedule's duplicate
      // check has passed, so only the database constraint catches it.
      const original = db.ThermostatSchedule.findOne.bind(db.ThermostatSchedule);
      db.ThermostatSchedule.findOne = async (...args) => {
        db.ThermostatSchedule.findOne = original;
        await db.ThermostatSchedule.create({ house_id: house.id, name: 'Racy' });
        return null;
      };

      try {
        await expectRejected(handler.createSchedule(HOUSE_SELECTOR, { name: 'Racy' }), 'already exists');
      } finally {
        db.ThermostatSchedule.findOne = original;
      }
    });

    it('should let an error that is not a name clash through untouched', async () => {
      const original = db.ThermostatSchedule.create.bind(db.ThermostatSchedule);
      db.ThermostatSchedule.create = async () => {
        throw new Error('database is on fire');
      };

      try {
        await expectRejected(handler.createSchedule(HOUSE_SELECTOR, { name: 'Boom' }), 'database is on fire');
      } finally {
        db.ThermostatSchedule.create = original;
      }
    });
  });

  describe('getSchedules', () => {
    beforeEach(async () => {
      await handler.createSchedule(HOUSE_SELECTOR, {
        name: 'Week',
        transitions: [{ day_of_week: 1, time: '08:00', preset: 'eco' }],
      });
      await handler.createSchedule(OTHER_HOUSE_SELECTOR, { name: 'Other house week' });
    });

    it('should return every schedule when no house is given', async () => {
      const schedules = await handler.getSchedules();

      expect(schedules).to.have.lengthOf(2);
    });

    it('should filter on the house', async () => {
      const schedules = await handler.getSchedules(HOUSE_SELECTOR);

      expect(schedules).to.have.lengthOf(1);
      expect(schedules[0].name).to.equal('Week');
    });

    it('should return nothing for an unknown house, rather than every schedule', async () => {
      expect(await handler.getSchedules('no-such-house')).to.deep.equal([]);
    });

    it('should return one schedule by selector', async () => {
      const [{ selector }] = await handler.getSchedules(HOUSE_SELECTOR);

      const schedule = await handler.getScheduleBySelector(selector);

      expect(schedule.name).to.equal('Week');
      expect(schedule.transitions).to.have.lengthOf(1);
    });

    it('should reject an unknown selector', async () => {
      await expectRejected(handler.getScheduleBySelector('no-such-schedule'), 'Schedule not found');
    });

    it('should compute the current and next points server-side', async () => {
      // The widget renders "Eco until 08:30" straight from `next`, so it never
      // reads the timezone: these are wall-clock times in the house, and a phone
      // abroad would otherwise show a point other than the one heating it.
      const { selector } = await handler.createSchedule(HOUSE_SELECTOR, {
        name: 'Full week',
        transitions: [
          { day_of_week: 0, time: '00:00', preset: 'comfort' },
          { day_of_week: 6, time: '23:59', preset: 'night' },
        ],
      });

      const schedule = await handler.getScheduleBySelector(selector);

      expect(schedule.current).to.not.equal(null);
      expect(schedule.next).to.not.equal(null);
      // Whatever the moment, the two are points of this schedule.
      expect(['comfort', 'night']).to.include(schedule.current.preset);
      expect(['comfort', 'night']).to.include(schedule.next.preset);
    });

    it('should resolve the points in the Gladys timezone', async () => {
      // Wall-clock times in the house: the process runs in UTC in the official
      // image, so reading the system timezone would fire a 07:00 point at 08:00.
      await db.Variable.create({ name: 'TIMEZONE', value: 'Europe/Paris' });
      const { selector } = await handler.createSchedule(HOUSE_SELECTOR, {
        name: 'Timezoned',
        transitions: [{ day_of_week: 0, time: '06:30', preset: 'comfort' }],
      });

      const schedule = await handler.getScheduleBySelector(selector);

      expect(schedule.current.preset).to.equal('comfort');
      await db.Variable.destroy({ where: { name: 'TIMEZONE' } });
    });

    it('should report no current point on a schedule with none', async () => {
      const { selector } = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Bare' });

      const schedule = await handler.getScheduleBySelector(selector);

      expect(schedule.current).to.equal(null);
      expect(schedule.next).to.equal(null);
    });

    it('should report a thermostat with no room as having none', async () => {
      const service = await db.Service.create({
        name: 'thermostat',
        selector: 'thermostat-roomless-service',
        version: '1.0.0',
      });
      const roomless = await db.Device.create({
        name: 'Roomless',
        selector: 'roomless-thermostat-read',
        external_id: 'thermostat:roomless-read',
        service_id: service.id,
      });
      const [{ selector, id }] = await handler.getSchedules(HOUSE_SELECTOR);
      // Written straight to the link table: attaching it through the handler is
      // refused precisely because it has no house.
      await db.ThermostatScheduleDevice.create({ device_id: roomless.id, schedule_id: id });

      const schedule = await handler.getScheduleBySelector(selector);

      expect(schedule.devices).to.deep.equal([{ selector: 'roomless-thermostat-read', name: 'Roomless', room: null }]);

      await db.Device.destroy({ where: { id: roomless.id } });
      await db.Service.destroy({ where: { id: service.id } });
    });
  });

  describe('updateSchedule', () => {
    let selector;

    beforeEach(async () => {
      const schedule = await handler.createSchedule(HOUSE_SELECTOR, {
        name: 'Week',
        transitions: [{ day_of_week: 0, time: '06:30', preset: 'comfort' }],
      });
      selector = schedule.selector;
    });

    it('should replace the transitions wholesale', async () => {
      const updated = await handler.updateSchedule(selector, {
        transitions: [{ day_of_week: 2, time: '19:00', preset: 'night' }],
      });

      expect(updated.transitions).to.deep.equal([{ day_of_week: 2, time: '19:00', preset: 'night' }]);
    });

    it('should rename without touching the transitions', async () => {
      const updated = await handler.updateSchedule(selector, { name: 'Renamed' });

      expect(updated.name).to.equal('Renamed');
      expect(updated.transitions).to.have.lengthOf(1);
    });

    it('should replace the transitions without touching the name', async () => {
      const updated = await handler.updateSchedule(selector, { transitions: [] });

      expect(updated.name).to.equal('Week');
      expect(updated.transitions).to.deep.equal([]);
    });

    it('should reject an unknown selector', async () => {
      await expectRejected(handler.updateSchedule('no-such-schedule', { name: 'X' }), 'Schedule not found');
    });

    it('should reject renaming onto another schedule of the same house', async () => {
      await handler.createSchedule(HOUSE_SELECTOR, { name: 'Weekend' });

      await expectRejected(handler.updateSchedule(selector, { name: 'Weekend' }), 'already exists');
    });

    it('should allow renaming onto a name used in another house', async () => {
      await handler.createSchedule(OTHER_HOUSE_SELECTOR, { name: 'Elsewhere' });

      const updated = await handler.updateSchedule(selector, { name: 'Elsewhere' });

      expect(updated.name).to.equal('Elsewhere');
    });

    it('should keep the existing transitions when the new ones are rejected', async () => {
      await expectRejected(
        handler.updateSchedule(selector, { transitions: [{ day_of_week: 9, time: '06:30', preset: 'eco' }] }),
        'Invalid thermostat schedule',
      );

      const schedule = await handler.getScheduleBySelector(selector);
      expect(schedule.transitions).to.have.lengthOf(1);
    });

    it('should move a schedule to another house while nothing follows it', async () => {
      const updated = await handler.updateSchedule(selector, { house: OTHER_HOUSE_SELECTOR });

      expect(updated.house).to.equal(OTHER_HOUSE_SELECTOR);
    });

    it('should refuse to move a schedule a thermostat follows', async () => {
      // Its thermostats live in the house it would leave: they would end up
      // following a programme from somewhere else.
      const service = await db.Service.create({
        name: 'thermostat',
        selector: 'thermostat-move-service',
        version: '1.0.0',
      });
      const thermostat = await db.Device.create({
        name: 'Living room',
        selector: 'living-room-move',
        external_id: 'thermostat:living-room-move',
        service_id: service.id,
        room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
      });
      await handler.attachScheduleToDevice(selector, thermostat.selector);

      await expectRejected(
        handler.updateSchedule(selector, { house: OTHER_HOUSE_SELECTOR }),
        'Schedule is followed by a thermostat',
      );

      await db.Device.destroy({ where: { id: thermostat.id } });
      await db.Service.destroy({ where: { id: service.id } });
    });

    it('should reject a move onto an unknown house', async () => {
      await expectRejected(handler.updateSchedule(selector, { house: 'no-such-house' }), 'House not found');
    });

    it('should check the name against the house it moves to', async () => {
      await handler.createSchedule(OTHER_HOUSE_SELECTOR, { name: 'Week' });

      // 'Week' is free in this house, taken in the other one.
      await expectRejected(handler.updateSchedule(selector, { house: OTHER_HOUSE_SELECTOR }), 'already exists');
    });

    it('should persist the day coerced by Joi on update too', async () => {
      const updated = await handler.updateSchedule(selector, {
        transitions: [{ day_of_week: '5', time: '10:00', preset: 'away' }],
      });

      expect(updated.transitions[0].day_of_week).to.equal(5);
    });

    it('should report a name taken between the duplicate check and the update', async () => {
      const house = await db.House.findOne({ where: { selector: HOUSE_SELECTOR } });
      // Simulate the race: the name is taken after updateSchedule's duplicate
      // check has passed, so only the database constraint catches it.
      const original = db.ThermostatSchedule.findOne.bind(db.ThermostatSchedule);
      let calls = 0;
      db.ThermostatSchedule.findOne = async (...args) => {
        calls += 1;
        // First call resolves the schedule itself, second is the duplicate check.
        if (calls === 2) {
          await db.ThermostatSchedule.create({ house_id: house.id, name: 'Taken' });
          return null;
        }
        return original(...args);
      };

      try {
        await expectRejected(handler.updateSchedule(selector, { name: 'Taken' }), 'already exists');
      } finally {
        db.ThermostatSchedule.findOne = original;
      }
    });

    it('should let an error that is not a name clash through untouched', async () => {
      const original = db.sequelize.transaction.bind(db.sequelize);
      db.sequelize.transaction = async () => {
        throw new Error('database is on fire');
      };

      try {
        await expectRejected(handler.updateSchedule(selector, { name: 'Boom' }), 'database is on fire');
      } finally {
        db.sequelize.transaction = original;
      }
    });
  });

  describe('deleteSchedule', () => {
    it('should delete a schedule and its transitions', async () => {
      const { selector } = await handler.createSchedule(HOUSE_SELECTOR, {
        name: 'Week',
        transitions: [{ day_of_week: 0, time: '06:30', preset: 'comfort' }],
      });

      await handler.deleteSchedule(selector);

      expect(await db.ThermostatSchedule.count()).to.equal(0);
      expect(await db.ThermostatScheduleTransition.count()).to.equal(0);
    });

    it('should reject an unknown selector', async () => {
      await expectRejected(handler.deleteSchedule('no-such-schedule'), 'Schedule not found');
    });
  });
});
