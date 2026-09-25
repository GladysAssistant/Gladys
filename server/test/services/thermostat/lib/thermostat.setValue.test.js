const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
  THERMOSTAT_MODE,
  THERMOSTAT_PRESET,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
const { MANUAL_DURATION_MS } = require('../../../../utils/thermostatConstants');

// Which schedule a thermostat follows is a relation, so it is read from the
// database rather than from the device's params: the tests that describe a
// scheduled thermostat say so here.
// A hold ends on the next transition point by default, so the schedule the
// thermostat follows is what decides the expiry. `follows: false` describes a
// thermostat that follows none, whose hold is permanent.
const load = (follows = true) =>
  proxyquire('../../../../services/thermostat/lib/thermostat.setValue', {
    './thermostat.scheduleDevice': {
      followsSchedule: fake.resolves(follows),
      getScheduleOfDevice: fake.resolves(
        follows ? { transitions: [{ day_of_week: 0, time: '06:30', preset: 'comfort' }] } : null,
      ),
    },
    '../../../utils/logger': {
      debug: fake.returns(null),
      info: fake.returns(null),
      warn: fake.returns(null),
    },
  });

const setpointFeature = {
  selector: 'thermostat-living-room',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
};
const presetFeature = {
  selector: 'thermostat-living-room:preset',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
  last_value: THERMOSTAT_PRESET.SCHEDULE,
};
const modeFeature = {
  selector: 'thermostat-living-room:mode',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
  last_value: THERMOSTAT_MODE.HEATING,
};

const buildHandler = (follows = true, deviceMode = THERMOSTAT_MODE.OFF, targetUnit = undefined) => {
  const { setValue } = load(follows);
  return {
    gladys: {
      device: {
        saveState: fake.resolves(null),
        setParam: fake.resolves(null),
        setValue: fake.resolves(null),
        // The owner of an external setpoint feature: another integration's
        // device, which is what the core has to be handed to route the write.
        // The mode lives on that same device, and is looked up the same way.
        get: fake((query) => {
          const selector = query && query.device_feature_selectors;
          if (selector === 'netatmo-mode') {
            return Promise.resolve([
              {
                selector: 'netatmo-device',
                service: { name: 'netatmo' },
                features: [{ selector: 'netatmo-mode', last_value: deviceMode }],
              },
            ]);
          }
          return Promise.resolve([
            {
              selector: 'netatmo-device',
              service: { name: 'netatmo' },
              features: [{ selector: 'netatmo-setpoint', unit: targetUnit }],
            },
          ]);
        }),
      },
      event: { emit: fake.returns(null) },
    },
    serviceId: 'service-id',
    // The real handler always creates this map in its constructor.
    selfWrittenSetpoints: new Map(),
    triggerApplySchedules: fake.returns(null),
    setValue,
  };
};

// A thermostat as the loop sees it: an id the hold is stored against, and the
// state features it carries.
const device = (params = [], features = [setpointFeature, presetFeature, modeFeature]) => ({
  id: 'device-id',
  selector: 'living-room',
  params,
  features,
});

// An external thermostat: the setpoint it drives is a feature of the real
// device, named by THERMOSTAT_TARGET_FEATURE.
const externalDevice = (params = [{ name: 'THERMOSTAT_TARGET_FEATURE', value: 'netatmo-setpoint' }]) =>
  device([{ name: 'THERMOSTAT_TYPE', value: 'external' }, ...params], [presetFeature, modeFeature]);

const paramCall = (handler, name) => handler.gladys.device.setParam.getCalls().find((call) => call.args[1] === name);

describe('thermostat.setValue', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('on the setpoint feature', () => {
    it('should persist the value through saveState', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), setpointFeature, 21.5);

      assert.calledWith(handler.gladys.device.saveState, setpointFeature, 21.5);
    });

    it('should hold the value so the schedule does not overwrite it', async () => {
      sinon.useFakeTimers(1_700_000_000_000);
      const handler = buildHandler();

      await handler.setValue(device(), setpointFeature, 21.5);

      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT').args[2]).to.equal('21.5');
      // Until the next transition point, the Tado and Netatmo default: a
      // temperature set in the afternoon holds until the evening point rather
      // than lapsing after an arbitrary half hour.
      expect(Number(paramCall(handler, 'THERMOSTAT_MANUAL_UNTIL').args[2])).to.be.above(1_700_000_000_000);
    });

    it('should broadcast the hold to open dashboards', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), setpointFeature, 21.5);

      assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED,
        payload: { device: 'living-room', setpoint: 21.5, until: sinon.match.number },
      });
    });

    it('should trigger a regulation pass', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), setpointFeature, 21.5);

      assert.calledOnce(handler.triggerApplySchedules);
    });

    it('should hold for the duration configured on the device', async () => {
      sinon.useFakeTimers(1_700_000_000_000);
      const handler = buildHandler();

      await handler.setValue(device([{ name: 'THERMOSTAT_MANUAL_DURATION', value: '45' }]), setpointFeature, 20);

      expect(Number(paramCall(handler, 'THERMOSTAT_MANUAL_UNTIL').args[2])).to.equal(
        1_700_000_000_000 + 45 * 60 * 1000,
      );
    });

    it('should fall back to the shared duration on a schedule with no point', async () => {
      sinon.useFakeTimers(1_700_000_000_000);
      const { setValue } = proxyquire('../../../../services/thermostat/lib/thermostat.setValue', {
        './thermostat.scheduleDevice': {
          followsSchedule: fake.resolves(true),
          // A schedule with no point has nothing to hand the thermostat back to.
          getScheduleOfDevice: fake.resolves({ transitions: [] }),
        },
        '../../../utils/logger': { debug: fake.returns(null), info: fake.returns(null), warn: fake.returns(null) },
      });
      const handler = { ...buildHandler(), setValue };

      await handler.setValue(device(), setpointFeature, 20);

      expect(Number(paramCall(handler, 'THERMOSTAT_MANUAL_UNTIL').args[2])).to.equal(
        1_700_000_000_000 + MANUAL_DURATION_MS,
      );
    });

    it('should not arm an expiry on a thermostat that follows no schedule', async () => {
      const handler = buildHandler(false);

      // Nothing would take the setpoint over, so the hold is permanent.
      await handler.setValue(device(), setpointFeature, 21.5);

      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT').args[2]).to.equal('21.5');
      expect(paramCall(handler, 'THERMOSTAT_MANUAL_UNTIL').args[2]).to.equal('');
    });

    it('should not arm a hold when the write is not manual', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), setpointFeature, 19, false);

      assert.notCalled(handler.gladys.device.setParam);
      assert.calledWith(handler.gladys.device.saveState, setpointFeature, 19);
    });

    it('should still regulate after a non-manual write', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), setpointFeature, 19, false);

      assert.calledOnce(handler.triggerApplySchedules);
    });

    it('should treat an unspecified write as manual, like a scene does', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), setpointFeature, 21.5);

      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT')).to.not.equal(undefined);
    });
  });

  describe('on the preset feature', () => {
    it('should store the preset on the feature', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), presetFeature, THERMOSTAT_PRESET.AWAY);

      assert.calledWith(handler.gladys.device.saveState, presetFeature, THERMOSTAT_PRESET.AWAY);
    });

    it('should hold the setpoint of the preset that was picked', async () => {
      const handler = buildHandler();

      await handler.setValue(
        device([{ name: 'THERMOSTAT_PRESET_AWAY', value: '15' }]),
        presetFeature,
        THERMOSTAT_PRESET.AWAY,
      );

      // Without the hold, the next regulation pass would resolve the schedule's
      // preset and overwrite the choice within the minute.
      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT').args[2]).to.equal('15');
    });

    it('should fall back to the shared preset default', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), presetFeature, THERMOSTAT_PRESET.FROST);

      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT').args[2]).to.equal('7');
    });

    // A preset's temperature is configured in the thermostat's unit, but the
    // hold is read back in the unit of the feature it is written on: the minute
    // loop hands it to the real device untouched. Comfort at 21 °C on a
    // Fahrenheit feature has to be held as 70 °F, or the device is commanded to
    // 21 °F.
    it('should convert a preset setpoint into the unit of the external feature', async () => {
      const handler = buildHandler(true, THERMOSTAT_MODE.HEATING, DEVICE_FEATURE_UNITS.FAHRENHEIT);

      await handler.setValue(externalDevice(), presetFeature, THERMOSTAT_PRESET.COMFORT);

      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT').args[2]).to.equal('69.8');
    });

    it('should leave a preset setpoint alone when both units agree', async () => {
      const handler = buildHandler(true, THERMOSTAT_MODE.HEATING, DEVICE_FEATURE_UNITS.CELSIUS);

      await handler.setValue(externalDevice(), presetFeature, THERMOSTAT_PRESET.COMFORT);

      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT').args[2]).to.equal('21');
    });

    it('should hold a preset setpoint as configured on a virtual thermostat', async () => {
      const handler = buildHandler(true, THERMOSTAT_MODE.HEATING, DEVICE_FEATURE_UNITS.FAHRENHEIT);

      await handler.setValue(device(), presetFeature, THERMOSTAT_PRESET.COMFORT);

      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT').args[2]).to.equal('21');
    });

    it('should hold the configured setpoint when the external feature is gone', async () => {
      const handler = buildHandler(true, THERMOSTAT_MODE.HEATING, DEVICE_FEATURE_UNITS.FAHRENHEIT);
      handler.gladys.device.get = fake.resolves([]);

      await handler.setValue(externalDevice(), presetFeature, THERMOSTAT_PRESET.COMFORT);

      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT').args[2]).to.equal('21');
    });

    // Nothing to convert into: the device names no feature to write on.
    it('should hold the configured setpoint when no target feature is named', async () => {
      const handler = buildHandler(true, THERMOSTAT_MODE.HEATING, DEVICE_FEATURE_UNITS.FAHRENHEIT);

      await handler.setValue(externalDevice([]), presetFeature, THERMOSTAT_PRESET.COMFORT);

      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT').args[2]).to.equal('21');
    });

    it('should clear the hold when handing the thermostat back to its schedule', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), presetFeature, THERMOSTAT_PRESET.SCHEDULE);

      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT').args[2]).to.equal('');
      expect(paramCall(handler, 'THERMOSTAT_MANUAL_UNTIL').args[2]).to.equal('');
    });

    it('should broadcast the new preset', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), presetFeature, THERMOSTAT_PRESET.ECO);

      assert.calledWith(handler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.PRESET_UPDATED,
        payload: { device: 'living-room', preset: 'eco' },
      });
    });

    it('should refuse a value that names no preset', async () => {
      const handler = buildHandler();

      let error = null;
      try {
        await handler.setValue(device(), presetFeature, 42);
      } catch (e) {
        error = e;
      }

      expect(error).to.not.equal(null);
      assert.notCalled(handler.gladys.device.saveState);
    });
  });

  describe('on the mode feature', () => {
    it('should store the mode on the feature', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), modeFeature, THERMOSTAT_MODE.COOLING);

      assert.calledWith(handler.gladys.device.saveState, modeFeature, THERMOSTAT_MODE.COOLING);
    });

    it('should clear the hold when the thermostat is stopped', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), modeFeature, THERMOSTAT_MODE.OFF);

      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT').args[2]).to.equal('');
    });

    it('should leave the hold alone when the thermostat is started again', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), modeFeature, THERMOSTAT_MODE.HEATING);

      assert.notCalled(handler.gladys.device.setParam);
    });

    it('should stop a real thermostat when its mode is turned off', async () => {
      // The real device is running: a mode write is only sent when it changes
      // something, since several of these integrations call a cloud API on every
      // command.
      const handler = buildHandler(true, THERMOSTAT_MODE.HEATING);

      await handler.setValue(
        device([
          { name: 'THERMOSTAT_TYPE', value: 'external' },
          { name: 'THERMOSTAT_TARGET_FEATURE', value: 'netatmo-setpoint' },
          { name: 'THERMOSTAT_MODE_FEATURE', value: 'netatmo-mode' },
        ]),
        modeFeature,
        THERMOSTAT_MODE.OFF,
      );

      // The mode goes first — it is what the machine obeys — then the frost
      // setpoint as the fallback for a device with no mode feature.
      const writes = handler.gladys.device.setValue.getCalls().map((call) => call.args[2]);
      expect(writes).to.deep.equal([THERMOSTAT_MODE.OFF, 7]);
    });
  });

  describe('on an external thermostat', () => {
    const external = () => externalDevice();
    const externalFeature = { selector: 'netatmo-setpoint' };

    it('should write through the owning integration, not saveState', async () => {
      const handler = buildHandler();

      await handler.setValue(external(), externalFeature, 21);

      assert.notCalled(handler.gladys.device.saveState);
      const call = handler.gladys.device.setValue.firstCall;
      expect(call.args[0].selector).to.equal('netatmo-device');
      expect(call.args[2]).to.equal(21);
    });

    it('should mark the value it writes, so its report is not held', async () => {
      const handler = buildHandler();

      await handler.setValue(external(), externalFeature, 21);

      expect(handler.selfWrittenSetpoints.get('netatmo-setpoint')).to.equal(21);
    });

    it('should drop the mark when the write fails', async () => {
      const handler = buildHandler();
      handler.gladys.device.setValue = fake.rejects(new Error('offline'));

      let error = null;
      try {
        await handler.setValue(external(), externalFeature, 21);
      } catch (e) {
        error = e;
      }

      // No echo will come, and a mark left behind would swallow a real change to
      // that same value later on.
      expect(error).to.not.equal(null);
      expect(handler.selfWrittenSetpoints.has('netatmo-setpoint')).to.equal(false);
    });

    it('should hand the mode back before writing the setpoint', async () => {
      const handler = buildHandler();

      await handler.setValue(
        device(
          [
            { name: 'THERMOSTAT_TYPE', value: 'external' },
            { name: 'THERMOSTAT_TARGET_FEATURE', value: 'netatmo-setpoint' },
            { name: 'THERMOSTAT_MODE_FEATURE', value: 'netatmo-mode' },
          ],
          [presetFeature],
        ),
        externalFeature,
        21,
      );

      // A thermostat left switched off ignores a setpoint.
      const writes = handler.gladys.device.setValue.getCalls().map((call) => call.args[2]);
      expect(writes).to.deep.equal([THERMOSTAT_MODE.HEATING, 21]);
    });

    it('should write only the setpoint when no mode feature is configured', async () => {
      const handler = buildHandler();

      await handler.setValue(external(), externalFeature, 21);

      expect(handler.gladys.device.setValue.getCalls()).to.have.lengthOf(1);
    });

    it('should still write through the integration when returning to the schedule', async () => {
      const handler = buildHandler();

      await handler.setValue(external(), externalFeature, 19, false);

      assert.calledOnce(handler.gladys.device.setValue);
      assert.notCalled(handler.gladys.device.setParam);
    });

    it('should hold the write, like a virtual one', async () => {
      const handler = buildHandler();

      await handler.setValue(external(), externalFeature, 21);

      expect(paramCall(handler, 'THERMOSTAT_MANUAL_SETPOINT').args[2]).to.equal('21');
    });

    it('should not write anything when the owning device is gone', async () => {
      const handler = buildHandler();
      handler.gladys.device.get = fake.resolves([]);

      await handler.setValue(external(), externalFeature, 21);

      assert.notCalled(handler.gladys.device.setValue);
      assert.notCalled(handler.gladys.device.saveState);
    });

    it('should persist a feature that is not the configured target', async () => {
      const handler = buildHandler();
      const otherFeature = { selector: 'some-other-feature' };

      await handler.setValue(external(), otherFeature, 21);

      assert.calledWith(handler.gladys.device.saveState, otherFeature, 21);
      assert.notCalled(handler.gladys.device.setValue);
    });

    it('should persist through saveState when the device is virtual', async () => {
      const handler = buildHandler();

      await handler.setValue(device(), setpointFeature, 21);

      assert.calledWith(handler.gladys.device.saveState, setpointFeature, 21);
      assert.notCalled(handler.gladys.device.setValue);
    });
  });
});
