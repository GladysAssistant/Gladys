const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert, match } = sinon;

const db = require('../../../../models');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  EVENTS,
  THERMOSTAT_MODE,
  THERMOSTAT_PRESET,
  WEBSOCKET_MESSAGE_TYPES,
} = require('../../../../utils/constants');
const ThermostatHandler = require('../../../../services/thermostat/lib');
const {
  followsSchedule,
  getScheduleOfDevice,
} = require('../../../../services/thermostat/lib/thermostat.scheduleDevice');

const HOUSE_SELECTOR = 'test-house';
const OTHER_HOUSE_SELECTOR = 'pepper-house';
const ROOM_ID = '2398c689-8b47-43cc-ad32-e98d9be098b5';
// Seeded, but owned by `test-service`: the device this integration must refuse.
const FOREIGN_DEVICE_SELECTOR = 'test-device';

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

const sinonMatchSelector = (selector) => match.has('selector', selector);
const configUpdated = match.has('type', WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.CONFIG_UPDATED);

describe('thermostat schedule <-> device link', () => {
  let handler;
  let thermostatService;
  let thermostat;
  let schedule;
  let otherSchedule;

  beforeEach(async () => {
    handler = new ThermostatHandler(
      {
        event: { emit: fake() },
        device: { saveState: fake.resolves(null), setParam: fake.resolves(null) },
      },
      'service-id',
    );
    handler.triggerApplySchedules = fake();

    thermostatService = await db.Service.create({
      name: 'thermostat',
      selector: 'thermostat-test-service',
      version: '1.0.0',
    });
    thermostat = await db.Device.create({
      name: 'Living room thermostat',
      selector: 'living-room-thermostat',
      external_id: 'thermostat:living-room',
      service_id: thermostatService.id,
      room_id: ROOM_ID,
    });

    schedule = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Week' });
    otherSchedule = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Weekend' });
  });

  afterEach(async () => {
    await db.ThermostatSchedule.destroy({ where: {}, truncate: true, cascade: true });
    await db.Device.destroy({ where: { id: thermostat.id } });
    await db.Service.destroy({ where: { id: thermostatService.id } });
  });

  it('should make a thermostat follow a schedule', async () => {
    await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

    const followed = await handler.getScheduleBySelector(schedule.selector);
    expect(followed.devices).to.deep.equal([
      { selector: thermostat.selector, name: thermostat.name, room: 'test-room' },
    ]);
  });

  it('should be idempotent', async () => {
    await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);
    await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

    expect(await db.ThermostatScheduleDevice.count({ where: { device_id: thermostat.id } })).to.equal(1);
  });

  it('should replace the schedule a thermostat already followed', async () => {
    await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

    await handler.attachScheduleToDevice(otherSchedule.selector, thermostat.selector);

    expect((await handler.getScheduleBySelector(schedule.selector)).devices).to.deep.equal([]);
    expect((await handler.getScheduleBySelector(otherSchedule.selector)).devices).to.have.lengthOf(1);
  });

  it('should stop a thermostat from following a schedule', async () => {
    await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

    await handler.detachScheduleFromDevice(schedule.selector, thermostat.selector);

    expect((await handler.getScheduleBySelector(schedule.selector)).devices).to.deep.equal([]);
  });

  it('should detach a thermostat moved to a room of another house', async () => {
    await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);
    const otherHouse = await db.House.findOne({ where: { selector: OTHER_HOUSE_SELECTOR } });
    const chalet = await db.Room.create({ name: 'Chalet', selector: 'chalet-room', house_id: otherHouse.id });
    await thermostat.update({ room_id: chalet.id });

    await handler.detachScheduleFromDevice(schedule.selector, thermostat.selector);

    expect(await db.ThermostatScheduleDevice.count({ where: { device_id: thermostat.id } })).to.equal(0);
    await thermostat.update({ room_id: ROOM_ID });
    await chalet.destroy();
  });

  it('should detach a thermostat left with no room', async () => {
    await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);
    await thermostat.update({ room_id: null });

    await handler.detachScheduleFromDevice(schedule.selector, thermostat.selector);

    expect(await db.ThermostatScheduleDevice.count({ where: { device_id: thermostat.id } })).to.equal(0);
  });

  it('should ignore a detach of a thermostat that was not following', async () => {
    await handler.detachScheduleFromDevice(schedule.selector, thermostat.selector);

    expect(await db.ThermostatScheduleDevice.count()).to.equal(0);
  });

  it('should drop the link when the schedule is deleted, with no detach code', async () => {
    await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

    await handler.deleteSchedule(schedule.selector);

    expect(await db.ThermostatScheduleDevice.count({ where: { device_id: thermostat.id } })).to.equal(0);
  });

  it('should drop the link when the thermostat is deleted', async () => {
    await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

    await db.Device.destroy({ where: { id: thermostat.id } });

    expect(await db.ThermostatScheduleDevice.count({ where: { device_id: thermostat.id } })).to.equal(0);
  });

  it('should say whether a thermostat follows a schedule', async () => {
    expect(await followsSchedule(thermostat.id)).to.equal(false);

    await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

    expect(await followsSchedule(thermostat.id)).to.equal(true);
  });

  it('should return the schedule a thermostat follows, with its points', async () => {
    await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);
    await handler.updateSchedule(schedule.selector, {
      transitions: [{ day_of_week: 0, time: '06:30', preset: 'comfort' }],
    });

    const followed = await getScheduleOfDevice(thermostat.id);

    // A hold ends on the next point of this schedule rather than after a fixed
    // duration, so the points come along with it.
    expect(followed.selector).to.equal(schedule.selector);
    expect(followed.transitions).to.have.lengthOf(1);
  });

  it('should return null for a thermostat that follows none', async () => {
    expect(await getScheduleOfDevice(thermostat.id)).to.equal(null);
  });

  it('should reject an unknown schedule', async () => {
    await expectRejected(handler.attachScheduleToDevice('no-such-schedule', thermostat.selector), 'Schedule not found');
  });

  it('should reject an unknown device', async () => {
    await expectRejected(handler.attachScheduleToDevice(schedule.selector, 'no-such-device'), 'Device not found');
  });

  describe('leaving a thermostat on the point its programme was on', () => {
    const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
    // A point at midnight every day is the one in force whatever the hour.
    const allDay = (preset) => EVERY_DAY.map((day) => ({ day_of_week: day, time: '00:00', preset }));

    const addFeature = (type, lastValue) =>
      db.DeviceFeature.create({
        device_id: thermostat.id,
        name: type,
        selector: `living-room-thermostat-${type}`,
        external_id: `thermostat:living-room:${type}`,
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type,
        read_only: false,
        has_feedback: false,
        keep_history: false,
        min: 0,
        max: 10,
        last_value: lastValue,
      });
    const addParam = (name, value) => db.DeviceParam.create({ device_id: thermostat.id, name, value });

    let presetFeature;
    let modeFeature;

    beforeEach(async () => {
      presetFeature = await addFeature(DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET, THERMOSTAT_PRESET.SCHEDULE);
      modeFeature = await addFeature(DEVICE_FEATURE_TYPES.THERMOSTAT.MODE, THERMOSTAT_MODE.HEATING);
    });

    afterEach(async () => {
      await db.DeviceParam.destroy({ where: { device_id: thermostat.id } });
      await db.DeviceFeature.destroy({ where: { device_id: thermostat.id } });
    });

    const resetFakes = () => {
      handler.gladys.device.saveState.resetHistory();
      handler.gladys.device.setParam.resetHistory();
      handler.gladys.event.emit.resetHistory();
      handler.triggerApplySchedules.resetHistory();
    };

    // Attached first, then put in the state under test: attaching hands the
    // thermostat to the programme, which is what a detach starts from.
    const followAndDetach = async (transitions, whileFollowing = async () => {}) => {
      const programme = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Programme', transitions });
      await handler.attachScheduleToDevice(programme.selector, thermostat.selector);
      await whileFollowing();
      resetFakes();
      await handler.detachScheduleFromDevice(programme.selector, thermostat.selector);
    };

    it('should write the preset of the point in force when it is detached', async () => {
      await followAndDetach(allDay('eco'));

      assert.calledOnceWithExactly(
        handler.gladys.device.saveState,
        sinonMatchSelector(presetFeature.selector),
        THERMOSTAT_PRESET.ECO,
      );
      assert.calledOnce(handler.triggerApplySchedules);
      // The widgets reload which schedule it follows.
      assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, configUpdated);
    });

    it("should stop it when the point in force is Off, as the programme's stop", async () => {
      await followAndDetach(allDay('off'));

      assert.calledOnceWithExactly(
        handler.gladys.device.saveState,
        sinonMatchSelector(modeFeature.selector),
        THERMOSTAT_MODE.OFF,
      );
      // Recorded, so the next programme attached starts it again.
      assert.calledWith(
        handler.gladys.device.setParam,
        sinonMatchSelector(thermostat.selector),
        'THERMOSTAT_SCHEDULE_STOP',
        'true',
      );
    });

    it('should leave a thermostat with no mode feature alone on an Off point', async () => {
      await followAndDetach(allDay('off'), () => modeFeature.destroy());

      assert.notCalled(handler.gladys.device.saveState);
      assert.notCalled(handler.triggerApplySchedules);
    });

    it('should make a hold running to the next point permanent', async () => {
      await followAndDetach(allDay('eco'), async () => {
        await addParam('THERMOSTAT_MANUAL_SETPOINT', '22.5');
        await addParam('THERMOSTAT_MANUAL_UNTIL', String(Date.now() + 3600000));
      });

      assert.calledWith(
        handler.gladys.device.setParam,
        sinonMatchSelector(thermostat.selector),
        'THERMOSTAT_MANUAL_UNTIL',
        '',
      );
      assert.notCalled(handler.gladys.device.saveState);
    });

    it('should leave a permanent hold as it is', async () => {
      await followAndDetach(allDay('eco'), () => addParam('THERMOSTAT_MANUAL_SETPOINT', '22.5'));

      assert.notCalled(handler.gladys.device.setParam);
      assert.notCalled(handler.gladys.device.saveState);
    });

    it('should leave a stopped thermostat alone', async () => {
      await followAndDetach(allDay('eco'), () => modeFeature.update({ last_value: THERMOSTAT_MODE.OFF }));

      assert.notCalled(handler.gladys.device.saveState);
    });

    it('should leave a thermostat on a preset of its own alone', async () => {
      await followAndDetach(allDay('eco'), () => presetFeature.update({ last_value: THERMOSTAT_PRESET.COMFORT }));

      assert.notCalled(handler.gladys.device.saveState);
    });

    it('should leave it alone when its schedule had no point', async () => {
      await followAndDetach([]);

      assert.notCalled(handler.gladys.device.saveState);
    });

    it('should leave the thermostats that followed a deleted schedule on its point', async () => {
      const programme = await handler.createSchedule(HOUSE_SELECTOR, {
        name: 'Programme',
        transitions: allDay('night'),
      });
      await handler.attachScheduleToDevice(programme.selector, thermostat.selector);
      resetFakes();

      await handler.deleteSchedule(programme.selector);

      assert.calledOnceWithExactly(
        handler.gladys.device.saveState,
        sinonMatchSelector(presetFeature.selector),
        THERMOSTAT_PRESET.NIGHT,
      );
      assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, configUpdated);
    });

    it('should delete the schedule even when a follower cannot be left on its point', async () => {
      const programme = await handler.createSchedule(HOUSE_SELECTOR, {
        name: 'Programme',
        transitions: allDay('night'),
      });
      await handler.attachScheduleToDevice(programme.selector, thermostat.selector);
      resetFakes();
      handler.gladys.device.saveState = fake.rejects(new Error('integration unreachable'));

      await handler.deleteSchedule(programme.selector);

      expect(await db.ThermostatSchedule.count({ where: { selector: programme.selector } })).to.equal(0);
      assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, configUpdated);
    });

    it('should stop the followers of a programme emptied on an Off point', async () => {
      const programme = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Programme', transitions: allDay('off') });
      await handler.attachScheduleToDevice(programme.selector, thermostat.selector);
      resetFakes();

      await handler.updateSchedule(programme.selector, { transitions: [] });

      assert.calledOnceWithExactly(
        handler.gladys.device.saveState,
        sinonMatchSelector(modeFeature.selector),
        THERMOSTAT_MODE.OFF,
      );
      assert.called(handler.triggerApplySchedules);
    });

    it('should stop a follower holding a setpoint over the Off point of an emptied programme', async () => {
      // It still follows that programme: made permanent like on a detach, the
      // hold was re-armed, expired, and left the heating on its setpoint for good.
      const programme = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Programme', transitions: allDay('off') });
      await handler.attachScheduleToDevice(programme.selector, thermostat.selector);
      await addParam('THERMOSTAT_MANUAL_SETPOINT', '21');
      await addParam('THERMOSTAT_MANUAL_UNTIL', String(Date.now() + 3600000));
      resetFakes();

      await handler.updateSchedule(programme.selector, { transitions: [] });

      assert.calledWith(
        handler.gladys.device.setParam,
        sinonMatchSelector(thermostat.selector),
        'THERMOSTAT_MANUAL_SETPOINT',
        '',
      );
      assert.calledOnceWithExactly(
        handler.gladys.device.saveState,
        sinonMatchSelector(modeFeature.selector),
        THERMOSTAT_MODE.OFF,
      );
    });

    it('should leave a stopped follower of a programme emptied on an Off point alone', async () => {
      const programme = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Programme', transitions: allDay('off') });
      await handler.attachScheduleToDevice(programme.selector, thermostat.selector);
      await modeFeature.update({ last_value: THERMOSTAT_MODE.OFF });
      resetFakes();

      await handler.updateSchedule(programme.selector, { transitions: [] });

      assert.notCalled(handler.gladys.device.saveState);
      assert.notCalled(handler.gladys.device.setParam);
    });

    it('should start the followers it stopped again once the programme has points again', async () => {
      const programme = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Programme', transitions: [] });
      await handler.attachScheduleToDevice(programme.selector, thermostat.selector);
      await modeFeature.update({ last_value: THERMOSTAT_MODE.OFF });
      await addParam('THERMOSTAT_SCHEDULE_STOP', 'true');
      resetFakes();

      await handler.updateSchedule(programme.selector, { transitions: allDay('eco') });

      assert.calledWith(
        handler.gladys.device.saveState,
        sinonMatchSelector(modeFeature.selector),
        THERMOSTAT_MODE.HEATING,
      );
      assert.calledWith(
        handler.gladys.device.setParam,
        sinonMatchSelector(thermostat.selector),
        'THERMOSTAT_SCHEDULE_STOP',
        '',
      );
      assert.called(handler.triggerApplySchedules);
    });

    it('should leave a follower stopped by hand stopped when the programme has points again', async () => {
      const programme = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Programme', transitions: [] });
      await handler.attachScheduleToDevice(programme.selector, thermostat.selector);
      await modeFeature.update({ last_value: THERMOSTAT_MODE.OFF });
      resetFakes();

      await handler.updateSchedule(programme.selector, { transitions: allDay('eco') });

      assert.notCalled(handler.gladys.device.saveState);
    });

    it('should save the points even when a follower cannot be stopped', async () => {
      const programme = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Programme', transitions: allDay('off') });
      await handler.attachScheduleToDevice(programme.selector, thermostat.selector);
      resetFakes();
      handler.gladys.device.saveState = fake.rejects(new Error('integration unreachable'));

      const updated = await handler.updateSchedule(programme.selector, { transitions: [] });

      expect(updated.transitions).to.deep.equal([]);
      assert.called(handler.triggerApplySchedules);
    });

    it('should leave the followers of a programme emptied on another point alone', async () => {
      // That point's temperature is already on the setpoint feature, which a
      // thermostat with no point in force keeps.
      const programme = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Programme', transitions: allDay('eco') });
      await handler.attachScheduleToDevice(programme.selector, thermostat.selector);
      resetFakes();

      await handler.updateSchedule(programme.selector, { transitions: [] });

      assert.notCalled(handler.gladys.device.saveState);
    });

    it('should tell no widget anything when a schedule nobody followed is deleted', async () => {
      const programme = await handler.createSchedule(HOUSE_SELECTOR, { name: 'Programme', transitions: allDay('eco') });

      await handler.deleteSchedule(programme.selector);

      assert.notCalled(handler.gladys.event.emit);
    });
  });

  describe('attaching hands the thermostat to the programme', () => {
    let presetFeature;
    let modeFeature;

    const addFeature = (type, lastValue) =>
      db.DeviceFeature.create({
        device_id: thermostat.id,
        name: type,
        selector: `living-room-thermostat-${type}`,
        external_id: `thermostat:living-room:${type}`,
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type,
        read_only: false,
        has_feedback: false,
        keep_history: false,
        min: 0,
        max: 10,
        last_value: lastValue,
      });

    beforeEach(async () => {
      presetFeature = await addFeature(DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET, THERMOSTAT_PRESET.NIGHT);
      modeFeature = await addFeature(DEVICE_FEATURE_TYPES.THERMOSTAT.MODE, THERMOSTAT_MODE.HEATING);
    });

    afterEach(async () => {
      await db.DeviceParam.destroy({ where: { device_id: thermostat.id } });
      await db.DeviceFeature.destroy({ where: { device_id: thermostat.id } });
    });

    const addParam = (name, value) => db.DeviceParam.create({ device_id: thermostat.id, name, value });

    it('should write `schedule` on a thermostat left on a named preset', async () => {
      // A detach or a deleted schedule leaves it there; the loop only reads a
      // programme while the feature carries `schedule`.
      await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

      assert.calledOnceWithExactly(
        handler.gladys.device.saveState,
        sinonMatchSelector(presetFeature.selector),
        THERMOSTAT_PRESET.SCHEDULE,
      );
      assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, configUpdated);
      assert.called(handler.triggerApplySchedules);
    });

    it('should write `schedule` on a thermostat that never had a preset', async () => {
      // A preset never written reads null, and `Number(null)` is `schedule`: the
      // write was skipped, and a new thermostat showed no programme at all.
      await presetFeature.update({ last_value: null });

      await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

      assert.calledOnceWithExactly(
        handler.gladys.device.saveState,
        sinonMatchSelector(presetFeature.selector),
        THERMOSTAT_PRESET.SCHEDULE,
      );
    });

    it('should not rewrite `schedule` on a thermostat already following a programme', async () => {
      await presetFeature.update({ last_value: THERMOSTAT_PRESET.SCHEDULE });

      await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

      assert.notCalled(handler.gladys.device.saveState);
      assert.called(handler.triggerApplySchedules);
    });

    it('should end a hold taken before the attach', async () => {
      // Kept, it held the thermostat off the programme for another half hour.
      await addParam('THERMOSTAT_MANUAL_SETPOINT', '22.5');

      await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

      assert.calledWith(
        handler.gladys.device.setParam,
        sinonMatchSelector(thermostat.selector),
        'THERMOSTAT_MANUAL_SETPOINT',
        '',
      );
    });

    it('should change nothing on a thermostat that already follows that schedule', async () => {
      await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);
      handler.gladys.device.saveState.resetHistory();
      handler.gladys.event.emit.resetHistory();
      handler.triggerApplySchedules.resetHistory();
      // A preset picked since, which a second attach must not take back.
      await presetFeature.update({ last_value: THERMOSTAT_PRESET.COMFORT });

      await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

      assert.notCalled(handler.gladys.device.saveState);
      assert.notCalled(handler.gladys.event.emit);
      assert.notCalled(handler.triggerApplySchedules);
    });

    it('should leave a stop made by hand as it is', async () => {
      await modeFeature.update({ last_value: THERMOSTAT_MODE.OFF });

      await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

      // The preset is handed over, the mode is not: a stop outranks any programme.
      assert.neverCalledWith(handler.gladys.device.saveState, sinonMatchSelector(modeFeature.selector), match.any);
    });

    it('should start again a thermostat its previous programme stopped', async () => {
      // Deleted or detached on an Off point, then attached to a new programme:
      // the new programme's next point must apply, not a stop nobody chose.
      await modeFeature.update({ last_value: THERMOSTAT_MODE.OFF });
      await addParam('THERMOSTAT_SCHEDULE_STOP', 'true');

      await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

      assert.calledWith(
        handler.gladys.device.saveState,
        sinonMatchSelector(modeFeature.selector),
        THERMOSTAT_MODE.HEATING,
      );
      assert.calledWith(
        handler.gladys.device.setParam,
        sinonMatchSelector(thermostat.selector),
        'THERMOSTAT_SCHEDULE_STOP',
        '',
      );
    });

    it('should start a cooling thermostat its previous programme stopped in cooling', async () => {
      await modeFeature.update({ last_value: THERMOSTAT_MODE.OFF });
      await addParam('THERMOSTAT_SCHEDULE_STOP', 'true');
      await addParam('THERMOSTAT_MODE', 'cooling');

      await handler.attachScheduleToDevice(schedule.selector, thermostat.selector);

      assert.calledWith(
        handler.gladys.device.saveState,
        sinonMatchSelector(modeFeature.selector),
        THERMOSTAT_MODE.COOLING,
      );
    });
  });

  it('should reject a device that is not a thermostat', async () => {
    await expectRejected(
      handler.attachScheduleToDevice(schedule.selector, FOREIGN_DEVICE_SELECTOR),
      'Device is not a thermostat',
    );
  });

  it('should reject a thermostat that is not in the house of the schedule', async () => {
    const elsewhere = await handler.createSchedule(OTHER_HOUSE_SELECTOR, { name: 'Other house' });

    await expectRejected(
      handler.attachScheduleToDevice(elsewhere.selector, thermostat.selector),
      'is not in the house of schedule',
    );
  });

  it('should reject a thermostat that has no room, and therefore no house', async () => {
    const roomless = await db.Device.create({
      name: 'Roomless thermostat',
      selector: 'roomless-thermostat',
      external_id: 'thermostat:roomless',
      service_id: thermostatService.id,
    });

    await expectRejected(
      handler.attachScheduleToDevice(schedule.selector, roomless.selector),
      'is not in the house of schedule',
    );

    await db.Device.destroy({ where: { id: roomless.id } });
  });
});
