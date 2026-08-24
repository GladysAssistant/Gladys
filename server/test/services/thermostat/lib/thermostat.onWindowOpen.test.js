const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake } = sinon;

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const loadModule = () =>
  proxyquire('../../../../services/thermostat/lib/thermostat.onWindowOpen', {
    '../../../utils/logger': {
      debug: fake.returns(null),
      info: fake.returns(null),
      warn: fake.returns(null),
    },
  });

const buildGladys = ({ switchOn = true } = {}) => {
  const switchDevice = {
    features: [{ selector: 'heater-switch', last_value: switchOn ? 1 : 0 }],
  };
  const thermostatDevice = {
    features: [
      {
        selector: 'thermostat-living-room',
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
      },
    ],
    params: [
      { name: 'THERMOSTAT_WINDOW_FEATURE', value: 'window-sensor' },
      { name: 'THERMOSTAT_SWITCH_FEATURE', value: 'heater-switch' },
    ],
  };
  const setValue = fake.resolves(null);
  return {
    gladys: {
      device: {
        get: fake((query) => {
          if (query && query.service === 'thermostat') {
            return Promise.resolve([thermostatDevice]);
          }
          if (query && query.device_feature_selectors === 'heater-switch') {
            return Promise.resolve([switchDevice]);
          }
          return Promise.resolve([]);
        }),
        setValue,
      },
      stateManager: {
        get: fake((type, externalId) => {
          if (type === 'deviceFeatureByExternalId' && externalId === 'zigbee2mqtt:window:contact') {
            return { selector: 'window-sensor' };
          }
          return null;
        }),
      },
    },
    setValue,
  };
};

describe('thermostat.onDeviceNewState (window open)', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should cut the switch on the service event shape { device_feature_external_id, state }', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildGladys({ switchOn: true });
    await mod.onDeviceNewState.call(
      { gladys },
      {
        device_feature_external_id: 'zigbee2mqtt:window:contact',
        state: 0,
      },
    );
    expect(setValue.calledOnce).to.equal(true);
    expect(setValue.firstCall.args[2]).to.equal(0);
  });

  it('should cut the switch on the legacy event shape { device_feature, last_value }', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildGladys({ switchOn: true });
    await mod.onDeviceNewState.call(
      { gladys },
      {
        device_feature: 'window-sensor',
        last_value: 0,
      },
    );
    expect(setValue.calledOnce).to.equal(true);
    expect(setValue.firstCall.args[2]).to.equal(0);
  });

  it('should do nothing when the window closes (state 1)', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildGladys({ switchOn: true });
    await mod.onDeviceNewState.call(
      { gladys },
      {
        device_feature_external_id: 'zigbee2mqtt:window:contact',
        state: 1,
      },
    );
    expect(setValue.called).to.equal(false);
  });

  it('should do nothing when the changed feature is not a configured window sensor', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildGladys({ switchOn: true });
    await mod.onDeviceNewState.call(
      { gladys },
      {
        device_feature: 'some-other-sensor',
        last_value: 0,
      },
    );
    expect(setValue.called).to.equal(false);
  });

  it('should not send a command when the switch is already OFF', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildGladys({ switchOn: false });
    await mod.onDeviceNewState.call(
      { gladys },
      {
        device_feature_external_id: 'zigbee2mqtt:window:contact',
        state: 0,
      },
    );
    expect(setValue.called).to.equal(false);
  });
});

describe('thermostat.onDeviceNewState - ignored events', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should ignore a missing event', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildGladys();

    await mod.onDeviceNewState.call({ gladys }, null);

    expect(setValue.called).to.equal(false);
    expect(gladys.device.get.called).to.equal(false);
  });

  it('should ignore a non-zero value without loading any device', async () => {
    const mod = loadModule();
    const { gladys } = buildGladys();

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 1 });

    expect(gladys.device.get.called).to.equal(false);
  });

  it('should ignore an event whose feature cannot be resolved', async () => {
    const mod = loadModule();
    const { gladys } = buildGladys();

    await mod.onDeviceNewState.call({ gladys }, { device_feature_external_id: 'unknown:device', state: 0 });

    expect(gladys.device.get.called).to.equal(false);
  });

  it('should ignore an event carrying no selector at all', async () => {
    const mod = loadModule();
    const { gladys } = buildGladys();

    await mod.onDeviceNewState.call({ gladys }, { state: 0 });

    expect(gladys.device.get.called).to.equal(false);
  });

  it('should accept the device_feature_selector shape', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildGladys({ switchOn: true });

    await mod.onDeviceNewState.call({ gladys }, { device_feature_selector: 'window-sensor', state: 0 });

    expect(setValue.calledOnce).to.equal(true);
  });

  it('should do nothing when there is no thermostat device', async () => {
    const mod = loadModule();
    const setValue = fake.resolves(null);
    const gladys = {
      device: { get: fake.resolves([]), setValue },
      stateManager: { get: fake.returns({ selector: 'window-sensor' }) },
    };

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 0 });

    expect(setValue.called).to.equal(false);
  });

  it('should tolerate device.get returning nothing', async () => {
    const mod = loadModule();
    const setValue = fake.resolves(null);
    const gladys = {
      device: { get: fake.resolves(null), setValue },
      stateManager: { get: fake.returns({ selector: 'window-sensor' }) },
    };

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 0 });

    expect(setValue.called).to.equal(false);
  });

  it('should skip a thermostat device without a setpoint feature', async () => {
    const mod = loadModule();
    const setValue = fake.resolves(null);
    const gladys = {
      device: {
        get: fake.resolves([{ features: [{ selector: 'x', category: 'light', type: 'binary' }], params: [] }]),
        setValue,
      },
      stateManager: { get: fake.returns({ selector: 'window-sensor' }) },
    };

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 0 });

    expect(setValue.called).to.equal(false);
  });

  it('should skip a thermostat whose window sensor is a different feature', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildGladys({ switchOn: true });

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'another-window', last_value: 0 });

    expect(setValue.called).to.equal(false);
  });

  it('should skip a thermostat without params', async () => {
    const mod = loadModule();
    const setValue = fake.resolves(null);
    const gladys = {
      device: {
        get: fake.resolves([
          {
            features: [
              {
                selector: 'thermostat-living-room',
                category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
                type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
              },
            ],
            params: [],
          },
        ]),
        setValue,
      },
      stateManager: { get: fake.returns({ selector: 'window-sensor' }) },
    };

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 0 });

    expect(setValue.called).to.equal(false);
  });

  it('should not re-cut a switch that is already off', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildGladys({ switchOn: false });

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 0 });

    expect(setValue.called).to.equal(false);
  });

  it('should swallow a failure while turning the switch off', async () => {
    const mod = loadModule();
    const { gladys } = buildGladys({ switchOn: true });
    gladys.device.setValue = fake.rejects(new Error('switch offline'));

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 0 });

    expect(gladys.device.setValue.calledOnce).to.equal(true);
  });

  it('should swallow a failure while loading the thermostats', async () => {
    const mod = loadModule();
    const setValue = fake.resolves(null);
    const gladys = {
      device: { get: fake.rejects(new Error('db down')), setValue },
      stateManager: { get: fake.returns({ selector: 'window-sensor' }) },
    };

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 0 });

    expect(setValue.called).to.equal(false);
  });
});

describe('thermostat.onDeviceNewState - window selector cache', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should reject a non-window selector without loading the thermostat devices twice', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildGladys();
    const handler = { gladys, windowSelectorsCache: null };

    // First event builds the cache, the next ones must hit it instead of querying again.
    await mod.onDeviceNewState.call(handler, { device_feature: 'some-other-sensor', last_value: 0 });
    await mod.onDeviceNewState.call(handler, { device_feature: 'yet-another-sensor', last_value: 0 });
    await mod.onDeviceNewState.call(handler, { device_feature: 'a-third-sensor', last_value: 0 });

    expect(gladys.device.get.callCount).to.equal(1);
    expect(setValue.called).to.equal(false);
  });

  it('should still cut the switch for a cached window selector', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildGladys({ switchOn: true });
    const handler = { gladys, windowSelectorsCache: null };

    await mod.onDeviceNewState.call(handler, { device_feature: 'some-other-sensor', last_value: 0 });
    await mod.onDeviceNewState.call(handler, { device_feature: 'window-sensor', last_value: 0 });

    expect(setValue.calledOnce).to.equal(true);
  });

  it('should rebuild the cache once it has been invalidated', async () => {
    const mod = loadModule();
    const { gladys } = buildGladys();
    const handler = {
      gladys,
      windowSelectorsCache: null,
      featureKeysCache: new Set(['LIVING_ROOM']),
      invalidateDeviceCaches: mod.invalidateDeviceCaches,
    };

    await mod.onDeviceNewState.call(handler, { device_feature: 'some-other-sensor', last_value: 0 });
    expect(gladys.device.get.callCount).to.equal(1);

    handler.invalidateDeviceCaches();
    expect(handler.windowSelectorsCache).to.equal(null);
    // The same invalidation covers the runtime feature keys: both are derived
    // from this service's devices and go stale at the same moments.
    expect(handler.featureKeysCache).to.equal(null);

    await mod.onDeviceNewState.call(handler, { device_feature: 'some-other-sensor', last_value: 0 });
    expect(gladys.device.get.callCount).to.equal(2);
  });

  it('should drop the cache when a thermostat is updated', async () => {
    // A device saved through the generic device route can carry a new window
    // sensor: without postUpdate the immediate cut-off would keep watching the
    // previous one until the next create, delete or restart.
    const mod = loadModule();
    const { gladys } = buildGladys();
    const handler = {
      gladys,
      windowSelectorsCache: null,
      invalidateDeviceCaches: mod.invalidateDeviceCaches,
      postUpdate: mod.postUpdate,
    };

    await mod.onDeviceNewState.call(handler, { device_feature: 'some-other-sensor', last_value: 0 });
    expect(handler.windowSelectorsCache).to.not.equal(null);

    handler.postUpdate();

    expect(handler.windowSelectorsCache).to.equal(null);
  });

  it('should expose the configured window selectors', async () => {
    const mod = loadModule();
    const { gladys } = buildGladys();

    const selectors = await mod.getWindowSelectors.call({ gladys, windowSelectorsCache: null });

    expect([...selectors]).to.deep.equal(['window-sensor']);
  });

  it('should return an empty set when no thermostat configures a window', async () => {
    const mod = loadModule();
    const gladys = { device: { get: fake.resolves([{ params: [] }, {}]) } };

    const selectors = await mod.getWindowSelectors.call({ gladys, windowSelectorsCache: null });

    expect(selectors.size).to.equal(0);
  });
});

describe('thermostat.onDeviceNewState - per-device rejection after the cache hit', () => {
  beforeEach(() => {
    sinon.reset();
  });

  // The cache says "this selector is a window somewhere", but each thermostat is
  // still checked individually: a house can have several, only one of which is
  // wired to the sensor that changed.
  const buildTwoThermostats = (second) => {
    const setValue = fake.resolves(null);
    const configured = {
      features: [
        {
          selector: 'thermostat-living-room',
          category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
          type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        },
      ],
      params: [
        { name: 'THERMOSTAT_WINDOW_FEATURE', value: 'window-sensor' },
        { name: 'THERMOSTAT_SWITCH_FEATURE', value: 'heater-switch' },
      ],
    };
    return {
      setValue,
      gladys: {
        device: {
          get: fake((query) => {
            if (query && query.service === 'thermostat') {
              return Promise.resolve([second, configured]);
            }
            if (query && query.device_feature_selectors === 'heater-switch') {
              return Promise.resolve([{ features: [{ selector: 'heater-switch', last_value: 1 }] }]);
            }
            return Promise.resolve([]);
          }),
          setValue,
        },
        stateManager: { get: fake.returns(null) },
      },
    };
  };

  it('should skip a thermostat without a setpoint feature', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildTwoThermostats({ features: [], params: [] });

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 0 });

    // The other thermostat is still regulated
    expect(setValue.calledOnce).to.equal(true);
  });

  it('should skip a thermostat watching another window', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildTwoThermostats({
      features: [
        {
          selector: 'thermostat-bedroom',
          category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
          type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        },
      ],
      params: [
        { name: 'THERMOSTAT_WINDOW_FEATURE', value: 'another-window' },
        { name: 'THERMOSTAT_SWITCH_FEATURE', value: 'bedroom-switch' },
      ],
    });

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 0 });

    expect(setValue.calledOnce).to.equal(true);
    expect(setValue.firstCall.args[1].selector).to.equal('heater-switch');
  });

  it('should skip a thermostat whose window has no switch wired', async () => {
    const mod = loadModule();
    const { gladys, setValue } = buildTwoThermostats({
      features: [
        {
          selector: 'thermostat-bedroom',
          category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
          type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        },
      ],
      params: [{ name: 'THERMOSTAT_WINDOW_FEATURE', value: 'window-sensor' }],
    });

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 0 });

    expect(setValue.calledOnce).to.equal(true);
  });

  it('should skip a thermostat that lost its params between the two reads', async () => {
    const mod = loadModule();
    const setValue = fake.resolves(null);
    let call = 0;
    const gladys = {
      device: {
        get: fake((query) => {
          if (query && query.service === 'thermostat') {
            call += 1;
            // The cache is built from a configured device; by the time the second
            // read happens its params are gone, so buildParamsConfig returns null.
            return Promise.resolve(
              call === 1
                ? [{ params: [{ name: 'THERMOSTAT_WINDOW_FEATURE', value: 'window-sensor' }] }]
                : [
                    {
                      features: [
                        {
                          selector: 'thermostat-living-room',
                          category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
                          type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
                        },
                      ],
                      params: [],
                    },
                  ],
            );
          }
          return Promise.resolve([]);
        }),
        setValue,
      },
      stateManager: { get: fake.returns(null) },
    };

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 0 });

    expect(setValue.called).to.equal(false);
  });

  it('should stop when the thermostat devices disappear between the two reads', async () => {
    const mod = loadModule();
    const setValue = fake.resolves(null);
    let call = 0;
    const gladys = {
      device: {
        get: fake(() => {
          call += 1;
          // First read builds the cache, the device is deleted right after.
          return Promise.resolve(
            call === 1 ? [{ params: [{ name: 'THERMOSTAT_WINDOW_FEATURE', value: 'window-sensor' }] }] : [],
          );
        }),
        setValue,
      },
      stateManager: { get: fake.returns(null) },
    };

    await mod.onDeviceNewState.call({ gladys }, { device_feature: 'window-sensor', last_value: 0 });

    expect(setValue.called).to.equal(false);
  });
});
