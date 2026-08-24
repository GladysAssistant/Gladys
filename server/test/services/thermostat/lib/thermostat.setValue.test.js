const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { MANUAL_DURATION_MS } = require('../../../../utils/thermostatConstants');

const load = () =>
  proxyquire('../../../../services/thermostat/lib/thermostat.setValue', {
    '../../../utils/logger': {
      debug: fake.returns(null),
      info: fake.returns(null),
      warn: fake.returns(null),
    },
  });

const buildHandler = () => {
  const { setValue } = load();
  return {
    gladys: {
      device: { saveState: fake.resolves(null) },
      variable: { setValue: fake.resolves(null) },
      event: { emit: fake.returns(null) },
    },
    serviceId: 'service-id',
    triggerApplySchedules: fake.returns(null),
    setValue,
  };
};

const deviceFeature = { selector: 'thermostat-living-room' };

// The expiry is only armed on a thermostat that follows a schedule: without one
// the manual hold is permanent, so most of these assertions need a device that
// carries an active schedule.
const scheduledDevice = (params = []) => ({
  params: [{ name: 'THERMOSTAT_ACTIVE_SCHEDULE', value: 'week' }, ...params],
});

describe('thermostat.setValue', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should persist the value through saveState', async () => {
    const handler = buildHandler();

    await handler.setValue({}, deviceFeature, 21.5);

    assert.calledWith(handler.gladys.device.saveState, deviceFeature, 21.5);
  });

  it('should hold the value as a manual override so the schedule does not overwrite it', async () => {
    const clock = sinon.useFakeTimers(1_700_000_000_000);
    const handler = buildHandler();

    await handler.setValue(scheduledDevice(), deviceFeature, 21.5);

    assert.calledWith(
      handler.gladys.variable.setValue,
      'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_SETPOINT',
      JSON.stringify({ setpoint: 21.5 }),
    );
    assert.calledWith(
      handler.gladys.variable.setValue,
      'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_UNTIL',
      String(clock.now + MANUAL_DURATION_MS),
    );
    assert.calledWith(handler.gladys.variable.setValue, 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE', 'true');
  });

  it('should broadcast the manual mode change to open dashboards', async () => {
    const handler = buildHandler();

    await handler.setValue({}, deviceFeature, 19);

    assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED,
      payload: { key: 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE', value: 'true' },
    });
  });

  it('should trigger a regulation pass', async () => {
    const handler = buildHandler();

    await handler.setValue({}, deviceFeature, 19);

    assert.calledOnce(handler.triggerApplySchedules);
  });

  it('should build the variable keys from the feature selector', async () => {
    const handler = buildHandler();

    await handler.setValue({}, { selector: 'my-second-thermostat' }, 20);

    const keys = handler.gladys.variable.setValue.getCalls().map((call) => call.args[0]);
    expect(keys).to.deep.equal([
      'THERMOSTAT_MY_SECOND_THERMOSTAT_MANUAL_SETPOINT',
      'THERMOSTAT_MY_SECOND_THERMOSTAT_MANUAL_UNTIL',
      'THERMOSTAT_MY_SECOND_THERMOSTAT_MANUAL_MODE',
    ]);
  });

  it('should hold the setpoint for the duration configured on the device', async () => {
    const clock = sinon.useFakeTimers(1_700_000_000_000);
    const handler = buildHandler();
    const device = scheduledDevice([{ name: 'THERMOSTAT_MANUAL_DURATION', value: '45' }]);

    await handler.setValue(device, deviceFeature, 21.5);

    assert.calledWith(
      handler.gladys.variable.setValue,
      'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_UNTIL',
      String(clock.now + 45 * 60 * 1000),
    );
  });

  it('should fall back to the shared default when the device configures no duration', async () => {
    const clock = sinon.useFakeTimers(1_700_000_000_000);
    const handler = buildHandler();

    await handler.setValue(scheduledDevice(), deviceFeature, 21.5);

    assert.calledWith(
      handler.gladys.variable.setValue,
      'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_UNTIL',
      String(clock.now + MANUAL_DURATION_MS),
    );
  });

  it('should not arm an expiry on a thermostat without a schedule', async () => {
    sinon.useFakeTimers(1_700_000_000_000);
    const handler = buildHandler();

    // Nothing would take the setpoint over, so the hold is permanent — the
    // regulation loop only expires the override when MANUAL_UNTIL is set.
    await handler.setValue({ params: [] }, deviceFeature, 21.5);

    assert.calledWith(handler.gladys.variable.setValue, 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_UNTIL', '');
    assert.calledWith(handler.gladys.variable.setValue, 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE', 'true');
  });

  it('should clear an expiry left by a previous schedule-backed hold', async () => {
    sinon.useFakeTimers(1_700_000_000_000);
    const handler = buildHandler();

    // The schedule was removed from the device since the last manual hold: an
    // untouched MANUAL_UNTIL would still expire the new, permanent override.
    await handler.setValue({ params: [{ name: 'THERMOSTAT_MANUAL_DURATION', value: '45' }] }, deviceFeature, 20);

    assert.calledWith(handler.gladys.variable.setValue, 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_UNTIL', '');
  });

  it('should write the runtime variables in this service scope', async () => {
    const handler = buildHandler();

    await handler.setValue({}, deviceFeature, 21.5);

    handler.gladys.variable.setValue.getCalls().forEach((call) => {
      expect(call.args[2]).to.equal('service-id');
    });
  });
});
