const { expect } = require('chai');

const db = require('../../../../models');
const ThermostatHandler = require('../../../../services/thermostat/lib');
const { followsSchedule } = require('../../../../services/thermostat/lib/thermostat.scheduleDevice');

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

describe('thermostat schedule <-> device link', () => {
  let handler;
  let thermostatService;
  let thermostat;
  let schedule;
  let otherSchedule;

  beforeEach(async () => {
    handler = new ThermostatHandler({}, 'service-id');

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

  it('should reject an unknown schedule', async () => {
    await expectRejected(handler.attachScheduleToDevice('no-such-schedule', thermostat.selector), 'Schedule not found');
  });

  it('should reject an unknown device', async () => {
    await expectRejected(handler.attachScheduleToDevice(schedule.selector, 'no-such-device'), 'Device not found');
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
