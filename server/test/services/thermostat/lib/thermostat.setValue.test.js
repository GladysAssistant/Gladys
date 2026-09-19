const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES, THERMOSTAT_MODE } = require('../../../../utils/constants');
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
      device: {
        saveState: fake.resolves(null),
        setValue: fake.resolves(null),
        // The owner of an external setpoint feature: another integration's
        // device, which is what the core has to be handed to route the write.
        // The mode lives on that same device, and is looked up the same way.
        get: fake((query) => {
          const selector = query && query.device_feature_selectors;
          const features = [{ selector: 'netatmo-setpoint' }];
          if (selector === 'netatmo-mode') {
            return Promise.resolve([
              {
                selector: 'netatmo-device',
                service: { name: 'netatmo' },
                features: [{ selector: 'netatmo-mode', last_value: THERMOSTAT_MODE.OFF }],
              },
            ]);
          }
          return Promise.resolve([{ selector: 'netatmo-device', service: { name: 'netatmo' }, features }]);
        }),
      },
      variable: { setValue: fake.resolves(null) },
      event: { emit: fake.returns(null) },
    },
    serviceId: 'service-id',
    // The real handler always creates this map in its constructor.
    selfWrittenSetpoints: new Map(),
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

  it('should not touch the manual variables when the write is not manual', async () => {
    // The widget writes the scheduled setpoint back through this path when a
    // hold ends. Re-arming the override here would leave the database in manual
    // mode while every open widget displays the schedule.
    const handler = buildHandler();

    await handler.setValue(scheduledDevice(), deviceFeature, 19, false);

    assert.calledWith(handler.gladys.device.saveState, deviceFeature, 19);
    assert.notCalled(handler.gladys.variable.setValue);
    assert.notCalled(handler.gladys.event.emit);
  });

  it('should still regulate after a non-manual write', async () => {
    const handler = buildHandler();

    await handler.setValue(scheduledDevice(), deviceFeature, 19, false);

    assert.calledOnce(handler.triggerApplySchedules);
  });

  it('should treat an unspecified write as manual, like a scene does', async () => {
    const handler = buildHandler();

    await handler.setValue(scheduledDevice(), deviceFeature, 19);

    assert.calledWith(handler.gladys.variable.setValue, 'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE', 'true');
  });

  it('should write the runtime variables in this service scope', async () => {
    const handler = buildHandler();

    await handler.setValue({}, deviceFeature, 21.5);

    handler.gladys.variable.setValue.getCalls().forEach((call) => {
      expect(call.args[2]).to.equal('service-id');
    });
  });

  // An external thermostat drives a feature owned by another integration
  // (Netatmo, Zigbee, Matter, MQTT...). Persisting the value with saveState
  // would update every Gladys screen while the real thermostat never hears
  // about it — the setpoint would only reach it on the next regulation tick.
  describe('external thermostat', () => {
    const externalDevice = (params = []) => ({
      params: [
        { name: 'THERMOSTAT_TYPE', value: 'external' },
        { name: 'THERMOSTAT_TARGET_FEATURE', value: 'netatmo-setpoint' },
        ...params,
      ],
    });
    const externalFeature = { selector: 'netatmo-setpoint' };

    it('should write through the owning integration, not saveState', async () => {
      const handler = buildHandler();

      await handler.setValue(externalDevice(), externalFeature, 21);

      assert.calledOnce(handler.gladys.device.setValue);
      // The device handed to the core is the one owning the feature, never this
      // service's thermostat: routing is done on device.service.name, so passing
      // our own device would call this very function again, endlessly.
      const [ownerDevice, ownerFeature, written] = handler.gladys.device.setValue.firstCall.args;
      expect(ownerDevice.service.name).to.equal('netatmo');
      expect(ownerFeature.selector).to.equal('netatmo-setpoint');
      expect(written).to.equal(21);
      assert.notCalled(handler.gladys.device.saveState);
    });

    // A failed write produces no echo, so a mark left behind would make the
    // listener swallow a real change to that same value later on — and the loop
    // would then overwrite what the user set on the thermostat itself.
    it('should drop the mark when the write fails', async () => {
      const handler = buildHandler();
      handler.gladys.device.setValue = fake.rejects(new Error('integration timeout'));

      let error = null;
      try {
        await handler.setValue(externalDevice(), externalFeature, 21);
      } catch (e) {
        error = e;
      }

      expect(error).to.be.an('error');
      expect(handler.selfWrittenSetpoints.has('netatmo-setpoint')).to.equal(false);
    });

    it('should mark the value it writes, so its echo is not held', async () => {
      const handler = buildHandler();
      handler.selfWrittenSetpoints = new Map();

      await handler.setValue(externalDevice(), externalFeature, 21);

      expect(handler.selfWrittenSetpoints.get('netatmo-setpoint')).to.equal(21);
    });
    // A thermostat stopped by an `off` preset ignores a setpoint: asking for
    // 21 °C on a device whose mode is OFF changes the number on its screen and
    // nothing else. The mode has to be handed back first.
    it('should hand the mode back before writing the setpoint', async () => {
      const handler = buildHandler();

      await handler.setValue(
        externalDevice([{ name: 'THERMOSTAT_MODE_FEATURE', value: 'netatmo-mode' }]),
        externalFeature,
        21,
      );

      const [modeCall, setpointCall] = handler.gladys.device.setValue.getCalls();
      expect(modeCall.args[1].selector).to.equal('netatmo-mode');
      expect(modeCall.args[2]).to.equal(THERMOSTAT_MODE.HEATING);
      expect(setpointCall.args[1].selector).to.equal('netatmo-setpoint');
      expect(setpointCall.args[2]).to.equal(21);
    });

    it('should hand back the cooling mode on a cooling thermostat', async () => {
      const handler = buildHandler();

      await handler.setValue(
        externalDevice([
          { name: 'THERMOSTAT_MODE_FEATURE', value: 'netatmo-mode' },
          { name: 'THERMOSTAT_MODE', value: 'cooling' },
        ]),
        externalFeature,
        21,
      );

      expect(handler.gladys.device.setValue.firstCall.args[2]).to.equal(THERMOSTAT_MODE.COOLING);
    });

    // Almost no integration exposes a mode feature: those thermostats get the
    // setpoint alone, exactly as before.
    it('should write only the setpoint when no mode feature is configured', async () => {
      const handler = buildHandler();

      await handler.setValue(externalDevice(), externalFeature, 21);

      assert.calledOnce(handler.gladys.device.setValue);
      expect(handler.gladys.device.setValue.firstCall.args[1].selector).to.equal('netatmo-setpoint');
    });

    it('should still write through the integration when returning to the schedule', async () => {
      const handler = buildHandler();

      await handler.setValue(externalDevice(), externalFeature, 19, false);

      expect(handler.gladys.device.setValue.firstCall.args[0].service.name).to.equal('netatmo');
      expect(handler.gladys.device.setValue.firstCall.args[2]).to.equal(19);
      assert.notCalled(handler.gladys.device.saveState);
    });

    it('should hold the write as a manual override, like a virtual one', async () => {
      const handler = buildHandler();

      await handler.setValue(externalDevice(), externalFeature, 21);

      assert.calledWith(handler.gladys.variable.setValue, 'THERMOSTAT_NETATMO_SETPOINT_MANUAL_MODE', 'true');
    });

    // Only the configured target is written through the integration: a device
    // left with a stale param, or any other feature, stays on saveState.
    // The param names a feature that no longer exists: the integration was
    // removed, or the device renamed. Nothing must be written anywhere.
    it('should not write anything when the owning device is gone', async () => {
      const handler = buildHandler();
      handler.gladys.device.get = fake.resolves([]);

      await handler.setValue(externalDevice(), externalFeature, 21);

      assert.notCalled(handler.gladys.device.setValue);
      assert.notCalled(handler.gladys.device.saveState);
    });

    it('should persist a feature that is not the configured target', async () => {
      const handler = buildHandler();

      await handler.setValue(externalDevice(), { selector: 'some-other-feature' }, 21);

      assert.calledOnce(handler.gladys.device.saveState);
      assert.notCalled(handler.gladys.device.setValue);
    });

    it('should persist through saveState when the device is virtual', async () => {
      const handler = buildHandler();

      await handler.setValue(
        { params: [{ name: 'THERMOSTAT_TARGET_FEATURE', value: 'netatmo-setpoint' }] },
        externalFeature,
        21,
      );

      assert.calledOnce(handler.gladys.device.saveState);
      assert.notCalled(handler.gladys.device.setValue);
    });
  });
});
