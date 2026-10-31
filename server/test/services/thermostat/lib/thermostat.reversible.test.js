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
          },
          event: { emit: fake.returns(null) },
        },
        windowSelectorsCache: null,
        targetSelectorsCache: null,
        powerSelectorsCache: null,
        modeSelectorsCache: null,
        observedModes: new Map(),
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

      assert.calledOnce(handler.setValue);
      expect(handler.setValue.firstCall.args[1].selector).to.equal('heat-pump:mode');
      expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_MODE.COOLING);
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

      expect(handler.setValue.firstCall.args[2]).to.equal(THERMOSTAT_MODE.HEATING);
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

      assert.calledOnce(handler.setValue);
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

    // With no mode to write, the unit would keep its use while the cooling presets applied.
    it('should clear the reversible param of a real thermostat with no mode', async () => {
      const created = await createDevice.call(buildCreateHandler(), {
        name: 'Heat pump',
        external_id: 'thermostat:heat-pump',
        params: [
          { name: 'THERMOSTAT_TYPE', value: 'external' },
          { name: 'THERMOSTAT_TARGET_FEATURE', value: 'ac-setpoint' },
          { name: 'THERMOSTAT_MODE_FEATURE', value: '' },
          { name: 'THERMOSTAT_REVERSIBLE', value: 'true' },
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
});
