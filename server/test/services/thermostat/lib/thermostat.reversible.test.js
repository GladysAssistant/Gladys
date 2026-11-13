const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const {
  AC_MODE,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  THERMOSTAT_MODE,
} = require('../../../../utils/constants');
const { presetParamName } = require('../../../../utils/thermostatConstants');
const { buildParamsConfig } = require('../../../../services/thermostat/lib/thermostat.deviceConfig');
const { createDevice, buildStateFeatures } = require('../../../../services/thermostat/lib/thermostat.createDevice');
const { setValue: coreSetValue } = require('../../../../lib/device/device.setValue');
const { nextModeSequence } = require('../../../../services/thermostat/lib/thermostat.state');
const { startExternalThermostat } = require('../../../../services/thermostat/lib/thermostat.applySchedules');

const silentLogger = { debug: fake.returns(null), info: fake.returns(null), warn: fake.returns(null) };

const modeFeature = (mode = THERMOSTAT_MODE.HEATING) => ({
  selector: 'heat-pump:mode',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
  last_value: mode,
});

// A heat pump driven as a real thermostat (A.0.3), reversible unless told not.
const heatPump = ({ use = 'heating', reversible = true, mode = THERMOSTAT_MODE.HEATING, extra = [] } = {}) => ({
  id: 'heat-pump-id',
  selector: 'heat-pump',
  features: [modeFeature(mode)],
  params: [
    { name: 'THERMOSTAT_TYPE', value: 'external' },
    { name: 'THERMOSTAT_TARGET_FEATURE', value: 'ac-setpoint' },
    { name: 'THERMOSTAT_MODE_FEATURE', value: 'ac-mode' },
    { name: 'THERMOSTAT_MODE', value: use },
    ...(reversible ? [{ name: 'THERMOSTAT_REVERSIBLE', value: 'true' }] : []),
    ...extra,
  ],
});

describe('thermostat: reversible heat pump', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('presetParamName', () => {
    it('should keep the heating presets where every thermostat has them', () => {
      expect(presetParamName('comfort', 'heating', true)).to.equal('THERMOSTAT_PRESET_COMFORT');
      expect(presetParamName('eco', 'cooling', false)).to.equal('THERMOSTAT_PRESET_ECO');
    });

    it('should read the cooling presets of a reversible heat pump apart', () => {
      expect(presetParamName('night', 'cooling', true)).to.equal('THERMOSTAT_PRESET_COOLING_NIGHT');
    });
  });

  describe('buildParamsConfig', () => {
    it('should read the heating presets while a reversible heat pump heats', () => {
      const config = buildParamsConfig(
        heatPump({
          extra: [
            { name: 'THERMOSTAT_PRESET_COMFORT', value: '20' },
            { name: 'THERMOSTAT_PRESET_COOLING_COMFORT', value: '25' },
          ],
        }),
      );

      expect(config.reversible).to.equal(true);
      expect(config.preset_comfort).to.equal(20);
      expect(config.preset_eco).to.equal(18);
    });

    it('should read the cooling presets while it cools, on their own defaults', () => {
      const config = buildParamsConfig(
        heatPump({
          use: 'cooling',
          extra: [
            { name: 'THERMOSTAT_PRESET_COMFORT', value: '20' },
            { name: 'THERMOSTAT_PRESET_COOLING_COMFORT', value: '25' },
          ],
        }),
      );

      expect(config.default_mode).to.equal('cooling');
      expect(config.preset_comfort).to.equal(25);
      expect(config.preset_eco).to.equal(26);
    });

    it('should keep the one set of presets of a thermostat that is not reversible', () => {
      const config = buildParamsConfig(
        heatPump({
          use: 'cooling',
          reversible: false,
          extra: [
            { name: 'THERMOSTAT_PRESET_COMFORT', value: '23' },
            { name: 'THERMOSTAT_PRESET_COOLING_COMFORT', value: '25' },
          ],
        }),
      );

      expect(config.reversible).to.equal(false);
      expect(config.preset_comfort).to.equal(23);
    });

    it('should read the range of the use in force', () => {
      const range = [
        { name: 'THERMOSTAT_MIN_TEMP', value: '7' },
        { name: 'THERMOSTAT_MAX_TEMP', value: '22' },
        { name: 'THERMOSTAT_COOLING_MIN_TEMP', value: '24' },
        { name: 'THERMOSTAT_COOLING_MAX_TEMP', value: '30' },
      ];
      const heating = buildParamsConfig(heatPump({ extra: range }));
      const cooling = buildParamsConfig(heatPump({ use: 'cooling', extra: range }));

      expect([heating.temp_min, heating.temp_max]).to.deep.equal([7, 22]);
      expect([cooling.temp_min, cooling.temp_max]).to.deep.equal([24, 30]);
    });

    it('should keep a single range when the cooling one is not set, or the thermostat is not reversible', () => {
      const range = [
        { name: 'THERMOSTAT_MIN_TEMP', value: '10' },
        { name: 'THERMOSTAT_MAX_TEMP', value: '31' },
      ];
      const cooling = buildParamsConfig(heatPump({ use: 'cooling', extra: range }));
      const notReversible = buildParamsConfig(
        heatPump({
          use: 'cooling',
          reversible: false,
          extra: [...range, { name: 'THERMOSTAT_COOLING_MIN_TEMP', value: '24' }],
        }),
      );

      expect([cooling.temp_min, cooling.temp_max]).to.deep.equal([10, 31]);
      expect(notReversible.temp_min).to.equal(10);
    });

    it('should never read a pilot-wire heater as reversible', () => {
      const pilotWire = buildParamsConfig({
        params: [
          { name: 'THERMOSTAT_TYPE', value: 'pilot-wire' },
          { name: 'THERMOSTAT_PILOT_WIRE_FEATURE', value: 'heater-wire' },
          { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
        ],
      });
      const regulatedWire = buildParamsConfig({
        params: [
          { name: 'THERMOSTAT_PILOT_WIRE_FEATURE', value: 'heater-wire' },
          { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
        ],
      });

      expect(pilotWire.reversible).to.equal(false);
      expect(regulatedWire.reversible).to.equal(false);
    });

    it('should never read a virtual thermostat as reversible', () => {
      // Its single heater relay would turn on in a room too warm.
      const virtual = buildParamsConfig({
        params: [
          { name: 'THERMOSTAT_SWITCH_FEATURE', value: 'heater-relay' },
          { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
        ],
      });

      expect(virtual.reversible).to.equal(false);
    });

    it('should never read a real thermostat with no mode as reversible', () => {
      const noMode = buildParamsConfig({
        params: [
          { name: 'THERMOSTAT_TYPE', value: 'external' },
          { name: 'THERMOSTAT_TARGET_FEATURE', value: 'ac-setpoint' },
          { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
        ],
      });

      expect(noMode.reversible).to.equal(false);
    });
  });

  describe('setValue on the mode feature', () => {
    const load = () =>
      proxyquire('../../../../services/thermostat/lib/thermostat.setValue', {
        './thermostat.scheduleDevice': {
          clearScheduleStop: fake.resolves(null),
          clearRemoteStop: fake.resolves(null),
          clearModuleStop: fake.resolves(null),
          getScheduleOfDevice: fake.resolves(null),
        },
        '../../../utils/logger': silentLogger,
      });

    const buildHandler = () => {
      const { setValue } = load();
      return {
        gladys: {
          device: {
            saveState: fake.resolves(null),
            setParam: fake.resolves(null),
            setValue: fake.resolves(null),
            get: fake.resolves([]),
          },
          event: { emit: fake.returns(null) },
        },
        selfWrittenSetpoints: new Map(),
        selfWrittenPowers: new Map(),
        triggerApplySchedules: fake.returns(null),
        broadcastConfigUpdated: fake.returns(null),
        setValue,
      };
    };

    it('should switch a running heat pump to cooling, and drop the hold taken while heating', async () => {
      const handler = buildHandler();
      const device = heatPump();

      await handler.setValue(device, device.features[0], THERMOSTAT_MODE.COOLING);

      assert.calledWith(handler.gladys.device.setParam, device, 'THERMOSTAT_MODE', 'cooling');
      assert.calledWith(handler.gladys.device.setParam, device, 'THERMOSTAT_MANUAL_SETPOINT', '');
      assert.calledOnce(handler.broadcastConfigUpdated);
      assert.calledWith(handler.gladys.device.saveState, device.features[0], THERMOSTAT_MODE.COOLING);
      assert.calledOnce(handler.triggerApplySchedules);
      // The config the rest of the write builds reads the new use.
      expect(buildParamsConfig(device).default_mode).to.equal('cooling');
    });

    // Saved after the use, a hold that failed to clear stayed to be regulated
    // under the new use, and a retry found the use already switched.
    it('should clear the hold before it saves the new use', async () => {
      const handler = buildHandler();
      const device = heatPump();
      handler.gladys.device.setParam = sinon.stub().rejects(new Error('db busy'));

      await handler.setValue(device, device.features[0], THERMOSTAT_MODE.COOLING).catch(() => null);

      assert.calledWith(handler.gladys.device.setParam, device, 'THERMOSTAT_MANUAL_SETPOINT', '');
      assert.neverCalledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE');
      expect(buildParamsConfig(device).default_mode).to.equal('heating');
    });

    it('should only switch the use of a stopped heat pump, without starting it', async () => {
      const handler = buildHandler();
      const device = heatPump({ mode: THERMOSTAT_MODE.OFF });

      await handler.setValue(device, device.features[0], THERMOSTAT_MODE.COOLING);

      assert.calledWith(handler.gladys.device.setParam, device, 'THERMOSTAT_MODE', 'cooling');
      assert.calledOnce(handler.broadcastConfigUpdated);
      assert.notCalled(handler.gladys.device.saveState);
      assert.notCalled(handler.triggerApplySchedules);
    });

    it('should keep a stopped heat pump stopped when the switch goes through the core', async () => {
      // A scene, the widget and the API all write through the core, which saves
      // the written value itself on a feature without feedback: the mode feature
      // is built with feedback, so the stop stays (A.4).
      const handler = buildHandler();
      const device = {
        ...heatPump({ mode: THERMOSTAT_MODE.OFF }),
        service: { name: 'thermostat' },
      };
      const builtMode = buildStateFeatures({ external_id: 'thermostat:heat-pump' }, true).find(
        (feature) => feature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
      );
      const feature = { ...builtMode, last_value: THERMOSTAT_MODE.OFF };
      device.features = [feature];
      const core = {
        serviceManager: { getService: () => ({ device: { setValue: (...args) => handler.setValue(...args) } }) },
        saveState: handler.gladys.device.saveState,
        saveStringState: fake.resolves(null),
      };

      await coreSetValue.call(core, device, feature, THERMOSTAT_MODE.COOLING);

      assert.calledWith(handler.gladys.device.setParam, device, 'THERMOSTAT_MODE', 'cooling');
      assert.notCalled(handler.gladys.device.saveState);
      expect(feature.last_value).to.equal(THERMOSTAT_MODE.OFF);
    });

    // Followed from the unit's remote, the switch runs on a device read from the
    // database: the core's copy, which the next widget or scene write hands over,
    // must take the new use too.
    it("should switch the use on the core's copy of the device as well", async () => {
      const handler = buildHandler();
      const cached = heatPump({ use: 'cooling' });
      handler.gladys.stateManager = { get: fake.returns(cached) };
      const fromDatabase = heatPump({ use: 'cooling' });

      await handler.setValue(fromDatabase, fromDatabase.features[0], THERMOSTAT_MODE.HEATING);

      assert.calledWith(handler.gladys.stateManager.get, 'deviceById', 'heat-pump-id');
      expect(buildParamsConfig(cached).default_mode).to.equal('heating');
      expect(buildParamsConfig(fromDatabase).default_mode).to.equal('heating');
    });

    it('should start a stopped heat pump when its own use is written', async () => {
      const handler = buildHandler();
      const device = heatPump({ mode: THERMOSTAT_MODE.OFF });

      await handler.setValue(device, device.features[0], THERMOSTAT_MODE.HEATING);

      assert.neverCalledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE');
      assert.calledWith(handler.gladys.device.saveState, device.features[0], THERMOSTAT_MODE.HEATING);
    });

    it('should switch nothing when the use is already the one in force', async () => {
      const handler = buildHandler();
      const device = heatPump();

      await handler.setValue(device, device.features[0], THERMOSTAT_MODE.HEATING);

      assert.neverCalledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE');
      assert.notCalled(handler.broadcastConfigUpdated);
    });

    // Every switch wrote two params and told the dashboards of a cleared hold.
    it('should switch without clearing a hold there is not', async () => {
      const handler = buildHandler();
      const device = heatPump();
      handler.gladys.device.get = fake.resolves([heatPump()]);

      await handler.setValue(device, device.features[0], THERMOSTAT_MODE.COOLING);

      assert.calledWith(handler.gladys.device.setParam, device, 'THERMOSTAT_MODE', 'cooling');
      assert.neverCalledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MANUAL_SETPOINT');
      assert.notCalled(handler.gladys.event.emit);
    });

    // The copy the widget or a scene hands over predates a hold armed since:
    // `setParam` writes the database alone.
    it('should clear a hold only the database knows of, or one it cannot check', async () => {
      const stale = buildHandler();
      const device = heatPump();
      stale.gladys.device.get = fake.resolves([
        heatPump({ extra: [{ name: 'THERMOSTAT_MANUAL_SETPOINT', value: '21' }] }),
      ]);
      const unreadable = buildHandler();
      unreadable.gladys.device.get = fake.rejects(new Error('db down'));
      const empty = buildHandler();
      empty.gladys.device.get = fake.resolves(null);
      const held = buildHandler();
      const heldDevice = heatPump({ extra: [{ name: 'THERMOSTAT_MANUAL_SETPOINT', value: '21' }] });

      await stale.setValue(device, device.features[0], THERMOSTAT_MODE.COOLING);
      const other = heatPump();
      await unreadable.setValue(other, other.features[0], THERMOSTAT_MODE.COOLING);
      await held.setValue(heldDevice, heldDevice.features[0], THERMOSTAT_MODE.COOLING);
      const third = heatPump();
      await empty.setValue(third, third.features[0], THERMOSTAT_MODE.COOLING);

      [stale, unreadable, held, empty].forEach((handler) =>
        assert.calledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MANUAL_SETPOINT', ''),
      );
      assert.notCalled(held.gladys.device.get);
    });

    it('should keep the use of a thermostat that is not reversible', async () => {
      const handler = buildHandler();
      const device = heatPump({ reversible: false });

      await handler.setValue(device, device.features[0], THERMOSTAT_MODE.COOLING);

      assert.neverCalledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE');
      assert.notCalled(handler.broadcastConfigUpdated);
    });
  });

  describe('onExternalModeChanged', () => {
    const loadListener = () =>
      proxyquire('../../../../services/thermostat/lib/thermostat.onWindowOpen', {
        '../../../utils/logger': silentLogger,
      });

    const unitMode = (category, value) => ({
      selector: 'ac-mode',
      category,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
      last_value: value,
    });

    // `previous`: the mode the unit was reporting, null when it never reported.
    const buildHandler = ({ devices = [heatPump()], previous = AC_MODE.HEATING, unit } = {}) => {
      const feature = unit || unitMode(DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING, AC_MODE.COOLING);
      const handler = {
        gladys: {
          device: {
            get: fake((query) =>
              Promise.resolve(
                query && query.device_feature_selectors ? [{ selector: 'ac', features: [feature] }] : devices,
              ),
            ),
            setParam: fake.resolves(null),
            saveState: fake.resolves(null),
          },
          event: { emit: fake.returns(null) },
        },
        triggerApplySchedules: fake.returns(null),
        windowSelectorsCache: null,
        targetSelectorsCache: null,
        powerSelectorsCache: null,
        modeSelectorsCache: null,
        observedModes: new Map(),
        modeReports: new Map(),
        selfWrittenModes: new Map(),
        setValue: fake.resolves(null),
        broadcastConfigUpdated: fake.returns(null),
      };
      if (previous !== null) {
        handler.observedModes.set('ac-mode', previous);
      }
      return handler;
    };

    it('should switch a running heat pump to the use picked on its remote', async () => {
      const mod = loadListener();
      const handler = buildHandler();

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);

      assert.calledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE', 'cooling');
      assert.calledOnce(handler.gladys.device.saveState);
      expect(handler.gladys.device.saveState.firstCall.args[0].selector).to.equal('heat-pump:mode');
      expect(handler.gladys.device.saveState.firstCall.args[1]).to.equal(THERMOSTAT_MODE.COOLING);
      assert.calledOnce(handler.triggerApplySchedules);
    });

    // The remote sends its whole state with each press: the setpoint held from
    // that press is the unit's own, in the use it now runs. Dropped, the next
    // pass put the unit back on the programme — off, on an Off point.
    it('should keep the hold of a running heat pump whose use is switched on its remote', async () => {
      const mod = loadListener();
      const handler = buildHandler({
        devices: [heatPump({ extra: [{ name: 'THERMOSTAT_MANUAL_SETPOINT', value: '21' }] })],
      });

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);

      assert.neverCalledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MANUAL_SETPOINT', '');
      assert.notCalled(handler.setValue);
    });

    it('should only take the use on a stopped heat pump, without starting it', async () => {
      const mod = loadListener();
      const handler = buildHandler({ devices: [heatPump({ mode: THERMOSTAT_MODE.OFF })] });

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);

      assert.notCalled(handler.setValue);
      assert.calledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE', 'cooling');
    });

    it('should read a thermostat mode as well as an air-conditioning one', async () => {
      const mod = loadListener();
      const handler = buildHandler({
        devices: [heatPump({ use: 'cooling' })],
        previous: THERMOSTAT_MODE.COOLING,
        unit: unitMode(DEVICE_FEATURE_CATEGORIES.THERMOSTAT, THERMOSTAT_MODE.HEATING),
      });

      await mod.onExternalModeChanged.call(handler, 'ac-mode', THERMOSTAT_MODE.HEATING);

      expect(handler.gladys.device.saveState.firstCall.args[1]).to.equal(THERMOSTAT_MODE.HEATING);
    });

    it('should leave auto, drying and fan to the regulation pass', async () => {
      const mod = loadListener();
      const handler = buildHandler({ unit: unitMode(DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING, AC_MODE.DRYING) });

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.DRYING);

      assert.notCalled(handler.setValue);
      assert.notCalled(handler.gladys.device.setParam);
    });

    it('should ignore a mode of another category, and a unit no longer found', async () => {
      const mod = loadListener();
      const otherCategory = buildHandler({ unit: unitMode(DEVICE_FEATURE_CATEGORIES.SWITCH, AC_MODE.COOLING) });
      const gone = buildHandler();
      gone.gladys.device.get = fake((query) =>
        Promise.resolve(query && query.device_feature_selectors ? [] : [heatPump()]),
      );

      await mod.onExternalModeChanged.call(otherCategory, 'ac-mode', AC_MODE.COOLING);
      await mod.onExternalModeChanged.call(gone, 'ac-mode', AC_MODE.COOLING);

      assert.notCalled(otherCategory.setValue);
      assert.notCalled(gone.setValue);
    });

    it('should take the first report as the reference, and an unchanged one as nothing', async () => {
      const mod = loadListener();
      const first = buildHandler({ previous: null });
      const unchanged = buildHandler({ previous: AC_MODE.COOLING });

      await mod.onExternalModeChanged.call(first, 'ac-mode', AC_MODE.COOLING);
      await mod.onExternalModeChanged.call(unchanged, 'ac-mode', AC_MODE.COOLING);

      expect(first.observedModes.get('ac-mode')).to.equal(AC_MODE.COOLING);
      assert.notCalled(first.setValue);
      assert.notCalled(unchanged.setValue);
    });

    it('should ignore a mode no reversible heat pump drives, and an empty report', async () => {
      const mod = loadListener();
      const notReversible = buildHandler({ devices: [heatPump({ reversible: false })] });
      const handler = buildHandler();

      await mod.onExternalModeChanged.call(notReversible, 'ac-mode', AC_MODE.COOLING);
      await mod.onExternalModeChanged.call(handler, 'ac-mode', null);
      await mod.onExternalModeChanged.call(handler, 'another-mode', AC_MODE.COOLING);

      assert.notCalled(notReversible.setValue);
      assert.notCalled(handler.setValue);
    });

    it('should leave a heat pump already in that use, and a thermostat on another unit', async () => {
      const mod = loadListener();
      const otherUnit = heatPump();
      otherUnit.params = otherUnit.params.map((param) =>
        param.name === 'THERMOSTAT_MODE_FEATURE' ? { ...param, value: 'other-mode' } : param,
      );
      const handler = buildHandler({ devices: [heatPump({ use: 'cooling' }), otherUnit, { params: [] }] });

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);

      assert.notCalled(handler.setValue);
    });

    it('should take the use without a mode feature to write it on', async () => {
      const mod = loadListener();
      const bare = heatPump();
      bare.features = [];
      const handler = buildHandler({ devices: [bare] });

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);

      assert.calledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE', 'cooling');
    });

    it('should log and swallow a lookup that fails', async () => {
      const mod = loadListener();
      const handler = buildHandler();
      handler.gladys.device.get = fake.rejects(new Error('db down'));
      handler.modeSelectorsCache = new Set(['ac-mode']);
      handler.windowSelectorsCache = new Set();

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);

      assert.notCalled(handler.setValue);
    });

    it('should log and swallow a failure to list the units', async () => {
      const mod = loadListener();
      const handler = buildHandler();
      handler.gladys.device.get = fake.rejects(new Error('db down'));

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);

      assert.notCalled(handler.gladys.device.setParam);
    });

    // Recorded as seen, a report whose switch failed was ignored until the unit
    // reported another mode, while every pass wrote the old use to it.
    it('should retry a failed switch when the same report arrives again', async () => {
      const mod = loadListener();
      const handler = buildHandler();
      const setParam = sinon.stub().resolves(null);
      setParam.onFirstCall().rejects(new Error('db busy'));
      handler.gladys.device.setParam = setParam;

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);
      expect(Number.isNaN(handler.observedModes.get('ac-mode'))).to.equal(true);
      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);

      expect(setParam.secondCall.args.slice(1)).to.deep.equal(['THERMOSTAT_MODE', 'cooling']);
      expect(handler.observedModes.get('ac-mode')).to.equal(AC_MODE.COOLING);
    });

    // Run side by side, a heating report that arrived before a cooling one
    // finished after it, and switched the heat pump back to heating.
    it('should follow the reports of a unit in the order they arrived', async () => {
      const mod = loadListener();
      const device = heatPump();
      const handler = buildHandler({ devices: [device] });
      let lookups = 0;
      handler.gladys.device.get = fake((query) => {
        if (!query || !query.device_feature_selectors) {
          return Promise.resolve([device]);
        }
        lookups += 1;
        const feature = unitMode(DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING, AC_MODE.COOLING);
        const delay = lookups === 1 ? 30 : 0;
        return new Promise((resolve) => {
          setTimeout(() => resolve([{ selector: 'ac', features: [feature] }]), delay);
        });
      });

      await Promise.all([
        mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING),
        mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.HEATING),
      ]);

      const uses = handler.gladys.device.setParam
        .getCalls()
        .filter((call) => call.args[1] === 'THERMOSTAT_MODE')
        .map((call) => call.args[2]);
      expect(uses).to.deep.equal(['cooling', 'heating']);
      expect(buildParamsConfig(device).default_mode).to.equal('heating');
      expect(handler.modeReports.size).to.equal(0);
    });

    // Recorded as seen, the report was ignored when it came again after a
    // restart, and every pass wrote the old use to the unit.
    it('should write nothing once the service stopped during the lookups, and follow the report again', async () => {
      const mod = loadListener();
      const handler = buildHandler();
      handler.lifecycle = 1;

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING, 0);

      assert.notCalled(handler.gladys.device.setParam);
      assert.notCalled(handler.gladys.device.saveState);
      expect(Number.isNaN(handler.observedModes.get('ac-mode'))).to.equal(true);

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING, 1);

      assert.calledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE', 'cooling');
    });

    // Put back to heating after a partial failure, the next heating report was
    // ignored and left the heat pump that had switched in cooling.
    it('should bring every heat pump of a unit to the next report after a partial failure', async () => {
      const mod = loadListener();
      const first = { ...heatPump(), id: 'first-id', selector: 'first' };
      const second = { ...heatPump(), id: 'second-id', selector: 'second' };
      const handler = buildHandler({ devices: [first, second] });
      // Writes the param on the device in memory, as the core's copy is updated.
      handler.gladys.device.setParam = sinon.stub().callsFake((device, name, value) => {
        if (device.selector === 'second' && value === 'cooling') {
          return Promise.reject(new Error('db busy'));
        }
        const param = device.params.find((p) => p.name === name);
        if (param) {
          param.value = value;
        }
        return Promise.resolve(null);
      });

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);

      expect(buildParamsConfig(first).default_mode).to.equal('cooling');
      expect(buildParamsConfig(second).default_mode).to.equal('heating');
      expect(Number.isNaN(handler.observedModes.get('ac-mode'))).to.equal(true);

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.HEATING);

      expect(buildParamsConfig(first).default_mode).to.equal('heating');
      expect(buildParamsConfig(second).default_mode).to.equal('heating');
      expect(handler.observedModes.get('ac-mode')).to.equal(AC_MODE.HEATING);
    });

    // Each on a read of the devices of its own, a heating report that arrived
    // after a cooling one could resume first, and only the cooling was followed.
    it('should follow the reports of a unit in the order they arrived when the caches are empty', async () => {
      const mod = loadListener();
      const device = heatPump();
      const handler = buildHandler({ devices: [device] });
      let lists = 0;
      handler.gladys.device.get = fake((query) => {
        if (query && query.device_feature_selectors) {
          const feature = unitMode(DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING, AC_MODE.COOLING);
          return Promise.resolve([{ selector: 'ac', features: [feature] }]);
        }
        lists += 1;
        const delay = lists === 1 ? 30 : 0;
        return new Promise((resolve) => {
          setTimeout(() => resolve([device]), delay);
        });
      });

      await Promise.all([
        mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING),
        mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.HEATING),
      ]);

      const uses = handler.gladys.device.setParam
        .getCalls()
        .filter((call) => call.args[1] === 'THERMOSTAT_MODE')
        .map((call) => call.args[2]);
      expect(uses).to.deep.equal(['cooling', 'heating']);
      expect(handler.deviceCachesFill).to.equal(null);
    });

    // The pass under way read the devices before they changed: published, its
    // caches hid the change until the next one.
    it('should start a new read of the devices once they changed during one, and drop the old one', async () => {
      const mod = loadListener();
      const handler = buildHandler();
      const releases = [];
      handler.gladys.device.get = fake(
        () =>
          new Promise((resolve) => {
            releases.push(resolve);
          }),
      );

      const before = mod.getWindowSelectors.call(handler);
      mod.invalidateDeviceCaches.call(handler);
      const after = mod.getWindowSelectors.call(handler);
      // The new pass waits for the old one to end before reading.
      expect(handler.gladys.device.get.callCount).to.equal(1);
      releases[0]([heatPump()]);
      await before;

      expect(handler.modeSelectorsCache).to.equal(null);
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      expect(handler.gladys.device.get.callCount).to.equal(2);
      releases[1]([]);
      await after;
      expect([...handler.modeSelectorsCache]).to.deep.equal([]);
      expect(handler.deviceCachesFill).to.equal(null);
    });

    it('should read the devices again after a stale pass that failed', async () => {
      const mod = loadListener();
      const handler = buildHandler();
      let rejectFirst;
      handler.gladys.device.get = sinon.stub();
      handler.gladys.device.get.onFirstCall().returns(
        new Promise((resolve, reject) => {
          rejectFirst = reject;
        }),
      );
      handler.gladys.device.get.onSecondCall().resolves([heatPump()]);

      const before = mod.getWindowSelectors.call(handler);
      mod.invalidateDeviceCaches.call(handler);
      const after = mod.getWindowSelectors.call(handler);
      rejectFirst(new Error('db down'));

      let failed = null;
      try {
        await before;
      } catch (e) {
        failed = e;
      }
      expect(failed.message).to.equal('db down');
      await after;
      expect([...handler.modeSelectorsCache]).to.deep.equal(['ac-mode']);
    });

    // A report arriving after a device change starts a read of its own: it
    // still waits for the reports that arrived before the change.
    it('should keep the arrival order of the reports across a device change', async () => {
      const mod = loadListener();
      const device = heatPump();
      const handler = buildHandler({ devices: [device] });
      const releases = [];
      handler.gladys.device.get = fake((query) => {
        if (query && query.device_feature_selectors) {
          const feature = unitMode(DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING, AC_MODE.COOLING);
          return Promise.resolve([{ selector: 'ac', features: [feature] }]);
        }
        if (releases.length === 0) {
          return new Promise((resolve) => {
            releases.push(resolve);
          });
        }
        return Promise.resolve([device]);
      });

      const cooling = mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);
      mod.invalidateDeviceCaches.call(handler);
      const heating = mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.HEATING);
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      releases[0]([device]);
      await Promise.all([cooling, heating]);

      const uses = handler.gladys.device.setParam
        .getCalls()
        .filter((call) => call.args[1] === 'THERMOSTAT_MODE')
        .map((call) => call.args[2]);
      expect(uses).to.deep.equal(['cooling', 'heating']);
    });

    // Switched, but its mode feature still showed the old use: the next report
    // skipped it, since it was already in the use reported.
    it('should save the mode feature again when its save failed after the switch', async () => {
      const mod = loadListener();
      const device = heatPump();
      const handler = buildHandler({ devices: [device] });
      const saveState = sinon.stub().resolves(null);
      saveState.onFirstCall().rejects(new Error('db busy'));
      handler.gladys.device.saveState = saveState;

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);
      expect(buildParamsConfig(device).default_mode).to.equal('cooling');
      assert.notCalled(handler.triggerApplySchedules);

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);

      assert.calledOnceWithExactly(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE', 'cooling');
      expect(saveState.secondCall.args[1]).to.equal(THERMOSTAT_MODE.COOLING);
      assert.calledOnce(handler.triggerApplySchedules);
      expect(handler.observedModes.get('ac-mode')).to.equal(AC_MODE.COOLING);
    });

    it('should forget the mode of a unit no heat pump drives any more', async () => {
      const mod = loadListener();
      const handler = buildHandler({ devices: [] });
      handler.observedModes.set('gone-mode', AC_MODE.COOLING);
      handler.observedSetpoints = new Map();
      handler.selfWrittenSetpoints = new Map();
      handler.observedPowers = new Map();
      handler.selfWrittenPowers = new Map();

      await mod.primeObservedSetpoints.call(handler);

      expect(handler.observedModes.has('gone-mode')).to.equal(false);
    });

    it('should be reached from the new-state listener', async () => {
      const mod = loadListener();
      const handler = buildHandler();
      handler.observedSetpoints = new Map();
      handler.selfWrittenSetpoints = new Map();
      handler.observedPowers = new Map();
      handler.selfWrittenPowers = new Map();
      handler.lifecycle = 0;

      await mod.onDeviceNewState.call(handler, { device_feature: 'ac-mode', state: AC_MODE.COOLING });

      assert.calledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE', 'cooling');
    });
  });

  // A remote sends its whole state with each press, mode included: a unit
  // switched on in heating while the thermostat was set to cool is to heat.
  describe('onExternalPowerChanged', () => {
    const loadListener = () =>
      proxyquire('../../../../services/thermostat/lib/thermostat.onWindowOpen', {
        '../../../utils/logger': silentLogger,
      });

    const poweredPump = (mode) =>
      heatPump({ use: 'cooling', mode, extra: [{ name: 'THERMOSTAT_POWER_FEATURE', value: 'ac-power' }] });

    // `unitModeValue` undefined: the unit's mode is not found.
    const buildHandler = (device, unitModeValue, category = DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING) => {
      const features = {
        'ac-mode': unitModeValue !== undefined && {
          selector: 'ac-mode',
          category,
          type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
          last_value: unitModeValue,
        },
        'ac-setpoint': { selector: 'ac-setpoint', last_value: 21 },
      };
      return {
        gladys: {
          device: {
            get: fake((query) => {
              const selector = query && query.device_feature_selectors;
              if (selector) {
                return Promise.resolve(features[selector] ? [{ selector: 'ac', features: [features[selector]] }] : []);
              }
              return Promise.resolve([device]);
            }),
            setParam: fake.resolves(null),
          },
          event: { emit: fake.returns(null) },
        },
        powerSelectorsCache: null,
        observedPowers: new Map([['ac-power', 0]]),
        selfWrittenPowers: new Map(),
        selfWrittenSetpoints: new Map(),
        selfWrittenModes: new Map(),
        setValue: fake.resolves(null),
        broadcastConfigUpdated: fake.returns(null),
        triggerApplySchedules: fake.returns(null),
      };
    };

    it('should start a stopped heat pump in the use its unit was switched on in', async () => {
      const mod = loadListener();
      const device = poweredPump(THERMOSTAT_MODE.OFF);
      const handler = buildHandler(device, AC_MODE.HEATING);

      await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

      assert.calledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE', 'heating');
      assert.calledOnce(handler.setValue);
      expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_MODE.HEATING);
    });

    it('should leave the use of a unit switched on in a mode that names none', async () => {
      const mod = loadListener();
      const handler = buildHandler(poweredPump(THERMOSTAT_MODE.OFF), AC_MODE.DRYING);
      const others = [
        buildHandler(poweredPump(THERMOSTAT_MODE.OFF), null),
        buildHandler(poweredPump(THERMOSTAT_MODE.OFF), undefined),
        buildHandler(poweredPump(THERMOSTAT_MODE.OFF), AC_MODE.HEATING, DEVICE_FEATURE_CATEGORIES.SWITCH),
      ];

      await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);
      await Promise.all(others.map((other) => mod.onExternalPowerChanged.call(other, 'ac-power', 1)));

      assert.neverCalledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE');
      expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_MODE.COOLING);
      others.forEach((other) =>
        assert.neverCalledWith(other.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE'),
      );
    });
  });

  describe('createDevice', () => {
    const buildCreateHandler = () => ({
      serviceId: 'service-id',
      gladys: { device: { create: fake((device) => Promise.resolve(device)) } },
      invalidateDeviceCaches: fake.returns(null),
    });
    const setpoint = {
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
    };
    const reversibleParam = (created) => created.params.find((param) => param.name === 'THERMOSTAT_REVERSIBLE').value;

    it('should keep the reversible param of a real thermostat', async () => {
      const created = await createDevice.call(buildCreateHandler(), {
        name: 'Heat pump',
        external_id: 'thermostat:heat-pump',
        params: [
          { name: 'THERMOSTAT_TYPE', value: 'external' },
          { name: 'THERMOSTAT_TARGET_FEATURE', value: 'ac-setpoint' },
          { name: 'THERMOSTAT_MODE_FEATURE', value: 'ac-mode' },
          { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
        ],
      });

      expect(reversibleParam(created)).to.equal('true');
    });

    // The write is clamped to the mode's maximum: a heating-only mode would keep
    // the unit heating under the cooling presets.
    const saveWithMode = (unitMode) => {
      const handler = buildCreateHandler();
      handler.gladys.device.get = fake.resolves(
        unitMode === null ? [] : [{ selector: 'unit', features: [{ selector: 'ac-mode', ...unitMode }] }],
      );
      return createDevice.call(handler, {
        name: 'Heat pump',
        external_id: 'thermostat:heat-pump',
        params: [
          { name: 'THERMOSTAT_TYPE', value: 'external' },
          { name: 'THERMOSTAT_TARGET_FEATURE', value: 'ac-setpoint' },
          { name: 'THERMOSTAT_MODE_FEATURE', value: 'ac-mode' },
          { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
        ],
      });
    };

    const thermostatMode = {
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
    };
    const airConditionerMode = {
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
    };

    // Saved as not reversible, after the form split its presets, a thermostat
    // set to cool read the heating ones and cooled to 21 °C.
    const refusal = async (promise) => {
      try {
        await promise;
      } catch (e) {
        return e.message;
      }
      return null;
    };

    it('should refuse a unit whose mode only heats', async () => {
      const message = await refusal(saveWithMode({ ...thermostatMode, max: 1 }));

      expect(message).to.match(/^Thermostat: a reversible thermostat needs a mode that can cool/);
    });

    // What the form offers: a writable mode. Anything else takes no mode write.
    it('should refuse a read-only mode or a feature that is no mode', async () => {
      const readOnly = await refusal(saveWithMode({ ...airConditionerMode, read_only: true }));
      const noMode = await refusal(
        saveWithMode({ category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING, type: 'fan-speed', max: 5 }),
      );

      expect(readOnly).to.match(/needs a mode that can cool/);
      expect(noMode).to.match(/needs a mode that can cool/);
    });

    it('should save nothing when it refuses a thermostat', async () => {
      const handler = buildCreateHandler();
      handler.gladys.device.get = fake.resolves([
        { selector: 'unit', features: [{ selector: 'ac-mode', ...thermostatMode, max: 1 }] },
      ]);

      await refusal(
        createDevice.call(handler, {
          name: 'Heat pump',
          params: [
            { name: 'THERMOSTAT_TYPE', value: 'external' },
            { name: 'THERMOSTAT_TARGET_FEATURE', value: 'ac-setpoint' },
            { name: 'THERMOSTAT_MODE_FEATURE', value: 'ac-mode' },
            { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
          ],
        }),
      );

      assert.notCalled(handler.gladys.device.create);
    });

    it('should keep the reversible param of a unit whose mode can cool', async () => {
      expect(reversibleParam(await saveWithMode({ ...thermostatMode, max: 3 }))).to.equal('true');
      // An air conditioner speaks AC_MODE, which always cools, whatever its max.
      expect(reversibleParam(await saveWithMode({ ...airConditionerMode, max: 1 }))).to.equal('true');
      // No declared maximum, or a mode not found: taken at its word.
      expect(reversibleParam(await saveWithMode(thermostatMode))).to.equal('true');
      expect(reversibleParam(await saveWithMode(null))).to.equal('true');
    });

    // With no mode to write, the unit would keep its use while the cooling presets applied.
    it('should refuse a real thermostat with no mode', async () => {
      const save = (modeParams) =>
        refusal(
          createDevice.call(buildCreateHandler(), {
            name: 'Heat pump',
            external_id: 'thermostat:heat-pump',
            params: [
              { name: 'THERMOSTAT_TYPE', value: 'external' },
              { name: 'THERMOSTAT_TARGET_FEATURE', value: 'ac-setpoint' },
              ...modeParams,
              { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
            ],
          }),
        );

      expect(await save([{ name: 'THERMOSTAT_MODE_FEATURE', value: '' }])).to.match(/needs a mode feature/);
      expect(await save([])).to.match(/needs a mode feature/);
    });

    it('should save a real thermostat that is not reversible without a mode', async () => {
      const created = await createDevice.call(buildCreateHandler(), {
        name: 'Heat pump',
        external_id: 'thermostat:heat-pump',
        params: [
          { name: 'THERMOSTAT_TYPE', value: 'external' },
          { name: 'THERMOSTAT_TARGET_FEATURE', value: 'ac-setpoint' },
          { name: 'THERMOSTAT_REVERSIBLE', value: '' },
        ],
      });

      expect(reversibleParam(created)).to.equal('');
    });

    it('should clear the reversible param of a virtual thermostat', async () => {
      const created = await createDevice.call(buildCreateHandler(), {
        name: 'Heater',
        external_id: 'thermostat:heater',
        features: [setpoint],
        params: [
          { name: 'THERMOSTAT_SWITCH_FEATURE', value: 'heater-relay' },
          { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
        ],
      });

      expect(reversibleParam(created)).to.equal('');
    });

    it('should clear the reversible param of a pilot-wire heater', async () => {
      const handler = buildCreateHandler();

      const created = await createDevice.call(handler, {
        name: 'Heater',
        external_id: 'thermostat:heater',
        features: [
          {
            category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
            type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
          },
        ],
        params: [
          { name: 'THERMOSTAT_TYPE', value: 'pilot-wire' },
          { name: 'THERMOSTAT_PILOT_WIRE_FEATURE', value: 'heater-wire' },
          { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
          { name: 'THERMOSTAT_PRESET_COOLING_COMFORT', value: '24' },
        ],
      });

      const reversible = created.params.find((param) => param.name === 'THERMOSTAT_REVERSIBLE');
      expect(reversible.value).to.equal('');
      // Allowed through, so a reversible heat pump keeps its cooling presets.
      expect(created.params.some((param) => param.name === 'THERMOSTAT_PRESET_COOLING_COMFORT')).to.equal(true);
    });
  });

  // A use switched from the edit form is a switch like any other (A.4).
  describe('createDevice switching the use', () => {
    const stored = (use, extra = []) => ({
      selector: 'heat-pump',
      params: [
        { name: 'THERMOSTAT_MODE', value: use },
        { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
        { name: 'THERMOSTAT_MANUAL_SETPOINT', value: '21' },
        { name: 'THERMOSTAT_MANUAL_UNTIL', value: '1700000000000' },
        ...extra,
      ],
    });
    const buildHandler = (existing) => ({
      serviceId: 'service-id',
      gladys: {
        device: {
          create: fake((device) => Promise.resolve(device)),
          get: fake((query) =>
            Promise.resolve(
              query && query.device_feature_selectors
                ? [
                    {
                      selector: 'unit',
                      features: [
                        {
                          selector: 'ac-mode',
                          category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
                          type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
                        },
                      ],
                    },
                  ]
                : [existing],
            ),
          ),
        },
      },
      event: { emit: fake.returns(null) },
      invalidateDeviceCaches: fake.returns(null),
    });
    const save = (handler, { use, reversible = 'true', hold = [] } = {}) =>
      createDevice.call(Object.assign(handler, { gladys: { ...handler.gladys, event: handler.event } }), {
        name: 'Heat pump',
        selector: 'heat-pump',
        params: [
          { name: 'THERMOSTAT_TYPE', value: 'external' },
          { name: 'THERMOSTAT_TARGET_FEATURE', value: 'ac-setpoint' },
          { name: 'THERMOSTAT_MODE_FEATURE', value: 'ac-mode' },
          { name: 'THERMOSTAT_REVERSIBLE', value: reversible },
          ...(use ? [{ name: 'THERMOSTAT_MODE', value: use }] : []),
          ...hold,
        ],
      });
    const param = (created, name) => {
      const found = created.params.find((candidate) => candidate.name === name);
      return found ? found.value : undefined;
    };

    it('should drop the hold of a reversible heat pump whose use the form switched', async () => {
      const handler = buildHandler(stored('heating'));

      const created = await save(handler, { use: 'cooling' });

      expect(param(created, 'THERMOSTAT_MODE')).to.equal('cooling');
      expect(param(created, 'THERMOSTAT_MANUAL_SETPOINT')).to.equal(undefined);
      expect(param(created, 'THERMOSTAT_MANUAL_UNTIL')).to.equal(undefined);
      assert.calledOnce(handler.event.emit);
      expect(handler.event.emit.firstCall.args[1].payload).to.deep.equal({
        device: 'heat-pump',
        setpoint: null,
        until: null,
      });
      // No marker of where a param came from reaches the database.
      created.params.forEach((saved) => expect(saved).to.not.have.property('carried'));
    });

    // Unticked in the same save: the hold still belonged to the other use.
    it('should drop the hold of a heat pump unticked reversible in the same save', async () => {
      const created = await save(buildHandler(stored('heating')), { use: 'cooling', reversible: '' });

      expect(param(created, 'THERMOSTAT_MANUAL_SETPOINT')).to.equal(undefined);
    });

    it('should keep the hold when the use is carried over, unchanged, or the thermostat never was reversible', async () => {
      const carried = await save(buildHandler(stored('heating')));
      const unchanged = await save(buildHandler(stored('heating')), { use: 'heating' });
      const neverReversible = buildHandler({
        selector: 'heat-pump',
        params: [
          { name: 'THERMOSTAT_MODE', value: 'heating' },
          { name: 'THERMOSTAT_MANUAL_SETPOINT', value: '21' },
        ],
      });
      const notReversible = await save(neverReversible, { use: 'cooling', reversible: '' });

      expect(param(carried, 'THERMOSTAT_MANUAL_SETPOINT')).to.equal('21');
      expect(param(unchanged, 'THERMOSTAT_MANUAL_SETPOINT')).to.equal('21');
      expect(param(notReversible, 'THERMOSTAT_MANUAL_SETPOINT')).to.equal('21');
      assert.notCalled(neverReversible.event.emit);
    });

    it('should switch without telling the dashboards of a hold there was not', async () => {
      const noHold = buildHandler({
        selector: 'heat-pump',
        params: [
          { name: 'THERMOSTAT_MODE', value: 'heating' },
          { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
          { name: 'THERMOSTAT_MANUAL_SETPOINT', value: '' },
        ],
      });
      const noStoredUse = buildHandler({
        selector: 'heat-pump',
        params: [{ name: 'THERMOSTAT_REVERSIBLE', value: 'true' }],
      });

      const created = await save(noHold, { use: 'cooling' });
      await save(noStoredUse, { use: 'cooling' });

      expect(param(created, 'THERMOSTAT_MANUAL_SETPOINT')).to.equal('');
      assert.notCalled(noHold.event.emit);
      assert.notCalled(noStoredUse.event.emit);
    });

    // A hold the payload sends is its own, and a client cannot pass a param off
    // as one carried from the device.
    it('should keep a hold the payload sends', async () => {
      const created = await save(buildHandler(stored('heating')), {
        use: 'cooling',
        hold: [{ name: 'THERMOSTAT_MANUAL_SETPOINT', value: '25', carried: true }],
      });

      expect(param(created, 'THERMOSTAT_MANUAL_SETPOINT')).to.equal('25');
      expect(param(created, 'THERMOSTAT_MANUAL_UNTIL')).to.equal(undefined);
    });
  });

  // A pass that wrote the old use while a remote press was being followed: its
  // echo arrived after the press, and switched the heat pump back (A.4).
  describe('the marks of the modes this service writes', () => {
    const loadListener = () =>
      proxyquire('../../../../services/thermostat/lib/thermostat.onWindowOpen', {
        '../../../utils/logger': silentLogger,
      });

    const acMode = (value) => ({
      selector: 'ac-mode',
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
      last_value: value,
    });

    const buildHandler = (device, lookup) => ({
      gladys: {
        device: {
          get: fake((query) => (query && query.device_feature_selectors ? lookup() : Promise.resolve([device]))),
          setParam: sinon.stub().callsFake((target, name, value) => {
            target.params = [...target.params.filter((p) => p.name !== name), { name, value }];
            return Promise.resolve(null);
          }),
          saveState: fake.resolves(null),
        },
        event: { emit: fake.returns(null) },
      },
      triggerApplySchedules: fake.returns(null),
      broadcastConfigUpdated: fake.returns(null),
      modeSelectorsCache: new Set(['ac-mode']),
      windowSelectorsCache: new Set(),
      targetSelectorsCache: new Set(),
      powerSelectorsCache: new Set(),
      observedModes: new Map([['ac-mode', AC_MODE.HEATING]]),
      modeReports: new Map(),
      selfWrittenModes: new Map(),
    });

    it('should mark a mode it writes on the unit, and only when it writes one', async () => {
      const marks = new Map();
      const setValue = fake.resolves(null);
      const gladys = {
        device: {
          get: fake.resolves([{ selector: 'ac', features: [acMode(AC_MODE.HEATING)] }]),
          setValue,
        },
      };
      const config = { mode_feature: 'ac-mode', default_mode: 'cooling' };

      await startExternalThermostat(gladys, config, 'test', null, marks);
      expect(marks.get('ac-mode').value).to.equal(AC_MODE.COOLING);

      const held = new Map();
      await startExternalThermostat(gladys, { ...config, default_mode: 'heating' }, 'test', null, held);
      expect(held.size).to.equal(0);
      // Without marks to keep, the write goes out all the same.
      await startExternalThermostat(gladys, config, 'test');
      assert.calledTwice(setValue);
    });

    it("should not follow the echo of a pass's write that arrives after a remote press", async () => {
      const mod = loadListener();
      const device = heatPump();
      let release;
      const handler = buildHandler(
        device,
        () =>
          new Promise((resolve) => {
            release = () => resolve([{ selector: 'ac', features: [acMode(AC_MODE.COOLING)] }]);
          }),
      );

      // The press: cooling picked on the remote, still being followed…
      const press = mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      // …when a pass, which still read heating, writes it back to the unit…
      handler.selfWrittenModes.set('ac-mode', { value: AC_MODE.HEATING, sequence: nextModeSequence() });
      // …and its echo arrives behind the press.
      const echo = mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.HEATING);
      release();
      await Promise.all([press, echo]);

      expect(buildParamsConfig(device).default_mode).to.equal('cooling');
      const uses = handler.gladys.device.setParam
        .getCalls()
        .filter((call) => call.args[1] === 'THERMOSTAT_MODE')
        .map((call) => call.args[2]);
      expect(uses).to.deep.equal(['cooling']);
      expect(handler.observedModes.get('ac-mode')).to.equal(AC_MODE.HEATING);
    });

    // Kept after the unit moved away from it, the mark would swallow a press
    // back to the mode last written.
    it('should drop a mark once the unit reports another mode after it', async () => {
      const mod = loadListener();
      const device = heatPump();
      const handler = buildHandler(device, () =>
        Promise.resolve([{ selector: 'ac', features: [acMode(AC_MODE.COOLING)] }]),
      );
      handler.selfWrittenModes.set('ac-mode', { value: AC_MODE.HEATING, sequence: nextModeSequence() });

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);
      expect(handler.selfWrittenModes.has('ac-mode')).to.equal(false);
      expect(buildParamsConfig(device).default_mode).to.equal('cooling');

      handler.gladys.device.get = fake((query) =>
        Promise.resolve(
          query && query.device_feature_selectors
            ? [{ selector: 'ac', features: [acMode(AC_MODE.HEATING)] }]
            : [device],
        ),
      );
      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.HEATING);

      expect(buildParamsConfig(device).default_mode).to.equal('heating');
    });
  });

  describe('the observed mode at start-up', () => {
    const loadListener = () =>
      proxyquire('../../../../services/thermostat/lib/thermostat.onWindowOpen', {
        '../../../utils/logger': silentLogger,
      });

    const buildHandler = (device, unitValue) => ({
      gladys: {
        device: {
          get: fake((query) =>
            Promise.resolve(
              query && query.device_feature_selectors
                ? [
                    {
                      selector: 'ac',
                      features: [
                        {
                          selector: query.device_feature_selectors,
                          category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
                          type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
                          last_value: unitValue,
                        },
                      ],
                    },
                  ]
                : [device],
            ),
          ),
          setParam: fake.resolves(null),
          saveState: fake.resolves(null),
        },
        event: { emit: fake.returns(null) },
      },
      triggerApplySchedules: fake.returns(null),
      broadcastConfigUpdated: fake.returns(null),
      observedSetpoints: new Map(),
      selfWrittenSetpoints: new Map(),
      observedPowers: new Map(),
      selfWrittenPowers: new Map(),
      observedModes: new Map(),
      selfWrittenModes: new Map(),
      modeReports: new Map(),
    });

    it('should seed the mode of each unit from the database', async () => {
      const mod = loadListener();
      const handler = buildHandler(heatPump(), AC_MODE.HEATING);

      await mod.primeObservedSetpoints.call(handler);

      expect(handler.observedModes.get('ac-mode')).to.equal(AC_MODE.HEATING);
    });

    // On an integration that only reports changes, the first report after a
    // restart is the press itself: taken as the reference, the pass wrote the
    // old use back.
    it('should follow a first report that differs from the stored mode, and ignore an equal one', async () => {
      const mod = loadListener();
      const pressed = buildHandler(heatPump(), AC_MODE.HEATING);
      const same = buildHandler(heatPump(), AC_MODE.HEATING);
      await mod.primeObservedSetpoints.call(pressed);
      await mod.primeObservedSetpoints.call(same);

      await mod.onExternalModeChanged.call(pressed, 'ac-mode', AC_MODE.COOLING);
      await mod.onExternalModeChanged.call(same, 'ac-mode', AC_MODE.HEATING);

      assert.calledWith(pressed.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MODE', 'cooling');
      assert.notCalled(same.gladys.device.setParam);
    });

    // A null read made `observedModes` NaN, and the next identical report was
    // then followed as a change.
    it('should take a list of devices that comes back empty as no heat pump to switch', async () => {
      const mod = loadListener();
      const handler = buildHandler(heatPump(), AC_MODE.COOLING);
      handler.modeSelectorsCache = new Set(['ac-mode']);
      handler.windowSelectorsCache = new Set();
      handler.targetSelectorsCache = new Set();
      handler.powerSelectorsCache = new Set();
      handler.observedModes.set('ac-mode', AC_MODE.HEATING);
      const { get } = handler.gladys.device;
      handler.gladys.device.get = fake((query) =>
        query && query.device_feature_selectors ? get(query) : Promise.resolve(null),
      );

      await mod.onExternalModeChanged.call(handler, 'ac-mode', AC_MODE.COOLING);

      expect(handler.observedModes.get('ac-mode')).to.equal(AC_MODE.COOLING);
      assert.notCalled(handler.gladys.device.setParam);
    });
  });

  // The use a unit switched on from its remote reports is best effort: the hold
  // and the start behind it must not depend on it (A.4).
  describe('a remote start whose use cannot be taken', () => {
    // Whether the programme keeps the unit off is read by `programmeKeepsOff`
    // (thermostat.offPoint.js), the one reading of an Off point (C.0.1).
    const programmeKeepsOff = fake.resolves(false);
    const loadListener = () =>
      proxyquire('../../../../services/thermostat/lib/thermostat.onWindowOpen', {
        '../../../utils/logger': silentLogger,
        './thermostat.offPoint': { programmeKeepsOff },
      });

    const poweredPump = (mode) =>
      heatPump({ use: 'cooling', mode, extra: [{ name: 'THERMOSTAT_POWER_FEATURE', value: 'ac-power' }] });

    const buildHandler = (device, { modeLookupFails = false, useSaveFails = false } = {}) => ({
      gladys: {
        device: {
          get: fake((query) => {
            const selector = query && query.device_feature_selectors;
            if (selector === 'ac-mode') {
              return modeLookupFails
                ? Promise.reject(new Error('cloud down'))
                : Promise.resolve([
                    {
                      selector: 'ac',
                      features: [
                        {
                          selector: 'ac-mode',
                          category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
                          type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
                          last_value: AC_MODE.HEATING,
                        },
                      ],
                    },
                  ]);
            }
            if (selector === 'ac-setpoint') {
              return Promise.resolve([{ selector: 'ac', features: [{ selector: 'ac-setpoint', last_value: 22 }] }]);
            }
            return Promise.resolve([device]);
          }),
          setParam: sinon
            .stub()
            .callsFake((target, name) =>
              useSaveFails && name === 'THERMOSTAT_MODE' ? Promise.reject(new Error('db busy')) : Promise.resolve(null),
            ),
        },
        event: { emit: fake.returns(null) },
      },
      powerSelectorsCache: new Set(['ac-power']),
      observedPowers: new Map([['ac-power', 0]]),
      selfWrittenPowers: new Map(),
      selfWrittenSetpoints: new Map([['ac-setpoint', 19]]),
      selfWrittenModes: new Map(),
      setValue: fake.resolves(null),
      broadcastConfigUpdated: fake.returns(null),
      triggerApplySchedules: fake.returns(null),
    });

    it('should still hold the setpoint and start a stopped heat pump when the lookup fails', async () => {
      const mod = loadListener();
      const handler = buildHandler(poweredPump(THERMOSTAT_MODE.OFF), { modeLookupFails: true });

      await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

      assert.calledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MANUAL_SETPOINT', '22');
      assert.calledOnce(handler.setValue);
    });

    it('should still hold the setpoint and start a stopped heat pump when the use cannot be saved', async () => {
      const mod = loadListener();
      const handler = buildHandler(poweredPump(THERMOSTAT_MODE.OFF), { useSaveFails: true });

      await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

      assert.calledWith(handler.gladys.device.setParam, sinon.match.any, 'THERMOSTAT_MANUAL_SETPOINT', '22');
      assert.calledOnce(handler.setValue);
    });

    it('should still look for an Off point on a running heat pump when the lookup fails', async () => {
      const mod = loadListener();
      const device = poweredPump(THERMOSTAT_MODE.COOLING);
      const handler = buildHandler(device, { modeLookupFails: true });
      programmeKeepsOff.resetHistory();

      await mod.onExternalPowerChanged.call(handler, 'ac-power', 1);

      assert.calledOnceWithExactly(programmeKeepsOff, device);
    });
  });
});
