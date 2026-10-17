const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { isWindowOpenLongEnough } = require('../../../../services/thermostat/lib/thermostat.applySchedules');

const NOW = 1_700_000_000_000;

describe('thermostat.isWindowOpenLongEnough', () => {
  const open = (extra = {}) => ({ selector: 'window-sensor', last_value: 0, ...extra });

  it('should not suspend the heating before the delay has run out', () => {
    const openedAt = new Map([['window-sensor', NOW - 30 * 1000]]);

    expect(isWindowOpenLongEnough(open(), 'window-sensor', 60, openedAt, NOW)).to.equal(false);
  });

  it('should suspend the heating once the delay has run out', () => {
    const openedAt = new Map([['window-sensor', NOW - 60 * 1000]]);

    expect(isWindowOpenLongEnough(open(), 'window-sensor', 60, openedAt, NOW)).to.equal(true);
  });

  it('should suspend the heating at once with no delay', () => {
    expect(isWindowOpenLongEnough(open(), 'window-sensor', 0, new Map(), NOW)).to.equal(true);
  });

  // The listener's time wins over `last_value_changed`, which every report moves:
  // a contact re-reporting "open" would otherwise restart the count each time.
  it('should count from the recorded opening, not from the latest report', () => {
    const openedAt = new Map([['window-sensor', NOW - 120 * 1000]]);
    const feature = open({ last_value_changed: new Date(NOW - 1000) });

    expect(isWindowOpenLongEnough(feature, 'window-sensor', 60, openedAt, NOW)).to.equal(true);
  });

  it('should take a window found open with no recorded time as open since its last change', () => {
    const openedAt = new Map();
    const feature = open({ last_value_changed: new Date(NOW - 5 * 60 * 1000) });

    expect(isWindowOpenLongEnough(feature, 'window-sensor', 60, openedAt, NOW)).to.equal(true);
    expect(openedAt.get('window-sensor')).to.equal(NOW - 5 * 60 * 1000);
  });

  it('should take a window with no known change as opening now', () => {
    const openedAt = new Map();

    expect(isWindowOpenLongEnough(open(), 'window-sensor', 60, openedAt, NOW)).to.equal(false);
    expect(openedAt.get('window-sensor')).to.equal(NOW);
  });

  // `new Date(null)` is the epoch: read as a date, it would cut at once.
  it('should take an undated change as opening now', () => {
    const openedAt = new Map();

    expect(isWindowOpenLongEnough(open({ last_value_changed: null }), 'window-sensor', 60, openedAt, NOW)).to.equal(
      false,
    );
    expect(openedAt.get('window-sensor')).to.equal(NOW);
  });

  it('should not take a change dated in the future for a longer opening', () => {
    const openedAt = new Map();
    const feature = open({ last_value_changed: new Date(NOW + 60 * 1000) });

    isWindowOpenLongEnough(feature, 'window-sensor', 60, openedAt, NOW);

    expect(openedAt.get('window-sensor')).to.equal(NOW);
  });

  it('should forget the opening of a closed window', () => {
    const openedAt = new Map([['window-sensor', NOW - 120 * 1000]]);

    expect(isWindowOpenLongEnough(open({ last_value: 1 }), 'window-sensor', 60, openedAt, NOW)).to.equal(false);
    expect(openedAt.has('window-sensor')).to.equal(false);
  });

  it('should work without a record of the openings', () => {
    const feature = open({ last_value_changed: new Date(NOW - 5 * 60 * 1000) });

    expect(isWindowOpenLongEnough(feature, 'window-sensor', 60, null, NOW)).to.equal(true);
    expect(isWindowOpenLongEnough(open({ last_value: 1 }), 'window-sensor', 60, null, NOW)).to.equal(false);
  });
});

describe('thermostat.onDeviceNewState - opening delay', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers(NOW);
  });

  afterEach(() => {
    sinon.restore();
  });

  const loadModule = () =>
    proxyquire('../../../../services/thermostat/lib/thermostat.onWindowOpen', {
      '../../../utils/logger': {
        debug: fake.returns(null),
        info: fake.returns(null),
        warn: fake.returns(null),
      },
    });

  const buildHandler = (delay) => {
    const thermostat = {
      selector: 'thermostat-living-room',
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
        ...(delay === undefined ? [] : [{ name: 'THERMOSTAT_WINDOW_DELAY', value: String(delay) }]),
      ],
    };
    const setValue = fake.resolves(null);
    return {
      gladys: {
        device: {
          get: fake(async (query) => {
            if (query && query.service === 'thermostat') {
              return [thermostat];
            }
            if (query && query.device_feature_selectors === 'heater-switch') {
              return [{ features: [{ selector: 'heater-switch', last_value: 1 }] }];
            }
            return [];
          }),
          setValue,
        },
      },
      windowSelectorsCache: null,
      targetSelectorsCache: new Set(),
      windowOpenedAt: new Map(),
      windowTimers: new Map(),
      triggerApplySchedules: fake(),
    };
  };

  const opens = (mod, handler) => mod.onDeviceNewState.call(handler, { device_feature: 'window-sensor', state: 0 });
  const closes = (mod, handler) => mod.onDeviceNewState.call(handler, { device_feature: 'window-sensor', state: 1 });

  it('should leave the heating on while the delay runs', async () => {
    const mod = loadModule();
    const handler = buildHandler();

    await opens(mod, handler);

    assert.notCalled(handler.gladys.device.setValue);
    expect(handler.windowOpenedAt.get('window-sensor')).to.equal(NOW);
  });

  it('should run a regulation pass when the delay ends', async () => {
    const mod = loadModule();
    const handler = buildHandler(30);

    await opens(mod, handler);
    await clock.tickAsync(29 * 1000);
    assert.notCalled(handler.triggerApplySchedules);
    await clock.tickAsync(1000);

    assert.calledOnce(handler.triggerApplySchedules);
    expect(handler.windowTimers.size).to.equal(0);
  });

  // A contact re-reporting "open" must not push the cut back: the delay runs from
  // the opening, and the check is armed once for what is left of it.
  it('should keep counting from the first report of an opening', async () => {
    const mod = loadModule();
    const handler = buildHandler(60);

    await opens(mod, handler);
    await clock.tickAsync(40 * 1000);
    await opens(mod, handler);
    await clock.tickAsync(20 * 1000);

    expect(handler.windowOpenedAt.get('window-sensor')).to.equal(NOW);
    assert.calledOnce(handler.triggerApplySchedules);
  });

  it('should start a new count once the window has closed', async () => {
    const mod = loadModule();
    const handler = buildHandler(60);

    await opens(mod, handler);
    await clock.tickAsync(10 * 1000);
    await closes(mod, handler);

    expect(handler.windowOpenedAt.has('window-sensor')).to.equal(false);

    await opens(mod, handler);

    expect(handler.windowOpenedAt.get('window-sensor')).to.equal(NOW + 10 * 1000);
  });

  // Nothing is left to cut once the window has closed: the check waiting on it
  // is dropped rather than run as a pass of every thermostat.
  it('should drop the pending check when the window closes', async () => {
    const mod = loadModule();
    const handler = buildHandler(60);
    handler.windowTimers.set('other-thermostat', { timer: setTimeout(() => {}, 60 * 1000), window: 'other-window' });

    await opens(mod, handler);
    await clock.tickAsync(10 * 1000);
    await closes(mod, handler);
    await clock.tickAsync(60 * 1000);

    assert.notCalled(handler.triggerApplySchedules);
    expect([...handler.windowTimers.keys()]).to.deep.equal(['other-thermostat']);
  });

  it('should replace the pending check of a thermostat when it is armed again', async () => {
    const mod = loadModule();
    const handler = buildHandler(60);
    const stale = fake();
    handler.windowTimers.set('thermostat-living-room', { timer: setTimeout(stale, 5 * 1000), window: 'window-sensor' });

    await opens(mod, handler);
    await clock.tickAsync(60 * 1000);

    assert.notCalled(stale);
    assert.calledOnce(handler.triggerApplySchedules);
  });

  it('should cut at once a window already open for longer than the delay', async () => {
    const mod = loadModule();
    const handler = buildHandler(60);
    handler.windowOpenedAt.set('window-sensor', NOW - 90 * 1000);

    await opens(mod, handler);

    assert.calledOnce(handler.gladys.device.setValue);
    expect(handler.gladys.device.setValue.firstCall.args[2]).to.equal(0);
    expect(handler.windowTimers.size).to.equal(0);
  });

  // A state change in flight when the service stops resumes after stop() has
  // cleared the timers: it must not arm a check that would run a pass later.
  it('should not arm a check when the service stops during the device lookup', async () => {
    const mod = loadModule();
    const handler = buildHandler(60);
    handler.windowSelectorsCache = new Set(['window-sensor']);
    const { get } = handler.gladys.device;
    handler.gladys.device.get = fake(async (query) => {
      handler.stopped = true;
      return get(query);
    });

    await opens(mod, handler);
    await clock.tickAsync(60 * 1000);

    expect(handler.windowTimers.size).to.equal(0);
    assert.notCalled(handler.triggerApplySchedules);
    assert.notCalled(handler.gladys.device.setValue);
  });

  it('should not record an opening when the service stops during the selector lookup', async () => {
    const mod = loadModule();
    const handler = buildHandler(60);
    const { get } = handler.gladys.device;
    handler.gladys.device.get = fake(async (query) => {
      handler.stopped = true;
      return get(query);
    });

    await opens(mod, handler);

    expect(handler.windowOpenedAt.size).to.equal(0);
    expect(handler.windowTimers.size).to.equal(0);
    assert.calledOnce(handler.gladys.device.get);
  });

  it('should cut at once with no delay', async () => {
    const mod = loadModule();
    const handler = buildHandler(0);

    await opens(mod, handler);

    assert.calledOnce(handler.gladys.device.setValue);
  });

  it('should ignore a report without a value', async () => {
    const mod = loadModule();
    const handler = buildHandler();

    await mod.onDeviceNewState.call(handler, { device_feature: 'window-sensor', state: null });

    assert.notCalled(handler.gladys.device.get);
    expect(handler.windowOpenedAt.size).to.equal(0);
  });
});
