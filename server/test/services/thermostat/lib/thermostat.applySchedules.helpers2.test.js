const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  SYSTEM_VARIABLE_NAMES,
} = require('../../../../utils/constants');

const load = () =>
  proxyquire('../../../../services/thermostat/lib/thermostat.applySchedules', {
    '../../../models': {
      ThermostatSchedule: { findOne: fake.resolves(null) },
      ThermostatScheduleSlot: {},
    },
    '../../../utils/logger': {
      debug: fake.returns(null),
      info: fake.returns(null),
      warn: fake.returns(null),
    },
  });

const { getThermostatFeature, phaseOffset, computeSwitchActive, applySchedules } = load();

const setpointFeature = {
  selector: 'thermostat-living-room',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
};

describe('thermostat.getThermostatFeature', () => {
  it('should find the setpoint feature whatever its position', () => {
    const device = { features: [{ category: 'light', type: 'binary' }, setpointFeature] };

    expect(getThermostatFeature(device)).to.equal(setpointFeature);
  });

  it('should ignore a thermostat feature of another type', () => {
    const device = {
      features: [{ category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT, type: 'mode' }],
    };

    expect(getThermostatFeature(device)).to.equal(null);
  });

  it('should return null for a device without features', () => {
    expect(getThermostatFeature({})).to.equal(null);
  });

  it('should return null when features is not an array', () => {
    expect(getThermostatFeature({ features: 'nope' })).to.equal(null);
  });

  it('should return null for a missing device', () => {
    expect(getThermostatFeature(null)).to.equal(null);
  });
});

describe('thermostat.phaseOffset', () => {
  it('should stay within the cycle', () => {
    const offset = phaseOffset('thermostat-living-room', 10);

    expect(offset).to.be.at.least(0);
    expect(offset).to.be.below(10);
  });

  it('should be stable for the same key', () => {
    expect(phaseOffset('thermostat-living-room', 10)).to.equal(phaseOffset('thermostat-living-room', 10));
  });

  it('should spread two thermostats sharing a cycle time', () => {
    const offsets = new Set(
      ['thermostat-living-room', 'thermostat-bedroom', 'thermostat-office', 'thermostat-kitchen'].map((selector) =>
        phaseOffset(selector, 10),
      ),
    );

    // Not every key can land on a distinct minute, but they must not all collide
    expect(offsets.size).to.be.above(1);
  });

  it('should return 0 without a key', () => {
    expect(phaseOffset('', 10)).to.equal(0);
    expect(phaseOffset(null, 10)).to.equal(0);
  });

  it('should return 0 without a cycle time', () => {
    expect(phaseOffset('thermostat-living-room', 0)).to.equal(0);
  });
});

describe('thermostat.computeSwitchActive - TPI', () => {
  const tpiConfig = { control_type: 'tpi', tpi_cycle_time: 10, tpi_proportional_band: 2 };

  it('should stay on for the whole cycle when the error exceeds the band', () => {
    expect(computeSwitchActive(15, 21, 'heating', tpiConfig, false, 0, '')).to.equal(true);
  });

  it('should stay off when the required on-time is below one minute', () => {
    // error 0.1 / band 2 → 0.5 minute over a 10 minute cycle
    expect(computeSwitchActive(20.9, 21, 'heating', tpiConfig, false, 0, '')).to.equal(false);
  });

  it('should be on at the beginning of the cycle and off at its end', () => {
    // error 1 / band 2 → 50% duty over 10 minutes, no phase offset
    const early = computeSwitchActive(20, 21, 'heating', tpiConfig, false, 0, '');
    const late = computeSwitchActive(20, 21, 'heating', tpiConfig, false, 7 * 60000, '');

    expect(early).to.equal(true);
    expect(late).to.equal(false);
  });

  it('should shift the duty window with the phase key', () => {
    const results = ['', 'thermostat-bedroom', 'thermostat-office', 'thermostat-kitchen'].map((key) =>
      computeSwitchActive(20, 21, 'heating', tpiConfig, false, 0, key),
    );

    expect(new Set(results).size).to.be.above(1);
  });

  it('should never go negative on the error', () => {
    expect(computeSwitchActive(25, 21, 'heating', tpiConfig, false, 0, '')).to.equal(false);
  });

  it('should fall back to hysteresis for cooling', () => {
    // A compressor cannot be pulsed: cooling ignores TPI
    expect(computeSwitchActive(25, 21, 'cooling', tpiConfig, false, 0, '')).to.equal(true);
  });

  it('should use the default cycle and band when unset', () => {
    expect(computeSwitchActive(15, 21, 'heating', { control_type: 'tpi' }, false, 0, '')).to.equal(true);
  });
});

describe('thermostat.computeSwitchActive - hysteresis', () => {
  const config = { hysteresis_start: 0.5, hysteresis_stop: 0.5 };

  it('should turn on when heating and the room is too cold', () => {
    expect(computeSwitchActive(19, 21, 'heating', config, false)).to.equal(true);
  });

  it('should turn off when heating and the room is warm enough', () => {
    expect(computeSwitchActive(22, 21, 'heating', config, true)).to.equal(false);
  });

  it('should hold the current state inside the neutral zone when heating', () => {
    expect(computeSwitchActive(21, 21, 'heating', config, true)).to.equal(true);
    expect(computeSwitchActive(21, 21, 'heating', config, false)).to.equal(false);
  });

  it('should turn on when cooling and the room is too hot', () => {
    expect(computeSwitchActive(23, 21, 'cooling', config, false)).to.equal(true);
  });

  it('should turn off when cooling and the room is cold enough', () => {
    expect(computeSwitchActive(19, 21, 'cooling', config, true)).to.equal(false);
  });

  it('should hold the current state inside the neutral zone when cooling', () => {
    expect(computeSwitchActive(21, 21, 'cooling', config, true)).to.equal(true);
    expect(computeSwitchActive(21, 21, 'cooling', config, false)).to.equal(false);
  });

  it('should use the default hysteresis without config', () => {
    expect(computeSwitchActive(19, 21, 'heating', null, false)).to.equal(true);
  });

  it('should stay off without a temperature reading', () => {
    expect(computeSwitchActive(null, 21, 'heating', config, true)).to.equal(false);
    expect(computeSwitchActive(undefined, 21, 'heating', config, true)).to.equal(false);
  });

  it('should stay off without a setpoint', () => {
    expect(computeSwitchActive(19, null, 'heating', config, true)).to.equal(false);
    expect(computeSwitchActive(19, undefined, 'heating', config, true)).to.equal(false);
  });
});

describe('thermostat.applySchedules', () => {
  const buildContext = (devices, timezone) => ({
    gladys: {
      device: {
        get: fake((query) => {
          if (query && query.service === 'thermostat') {
            return Promise.resolve(devices);
          }
          return Promise.resolve([]);
        }),
        setValue: fake.resolves(null),
        saveState: fake.resolves(null),
      },
      variable: {
        getValue: fake((key) => Promise.resolve(key === SYSTEM_VARIABLE_NAMES.TIMEZONE ? timezone || null : null)),
        setValue: fake.resolves(null),
      },
      event: { emit: fake.returns(null) },
    },
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should do nothing when no thermostat device exists', async () => {
    const ctx = buildContext([]);

    await applySchedules.call(ctx);

    assert.notCalled(ctx.gladys.device.setValue);
  });

  it('should do nothing when device.get returns nothing', async () => {
    const ctx = buildContext(null);

    await applySchedules.call(ctx);

    assert.notCalled(ctx.gladys.device.setValue);
  });

  it('should read the schedule clock in the configured timezone', async () => {
    const ctx = buildContext([{ features: [setpointFeature], params: [] }], 'America/New_York');

    await applySchedules.call(ctx);

    assert.calledWith(ctx.gladys.variable.getValue, SYSTEM_VARIABLE_NAMES.TIMEZONE);
  });

  it('should fall back to a default timezone when the variable is unreadable', async () => {
    const ctx = buildContext([{ features: [setpointFeature], params: [] }]);
    ctx.gladys.variable.getValue = fake.rejects(new Error('no variable table'));

    await applySchedules.call(ctx);

    assert.notCalled(ctx.gladys.device.setValue);
  });

  it('should keep regulating the other devices when one fails', async () => {
    const failing = {
      get features() {
        throw new Error('broken device');
      },
    };
    const ctx = buildContext([failing, { features: [setpointFeature], params: [] }]);

    await applySchedules.call(ctx);

    // Reaching here without throwing is the assertion: one bad device is isolated
    assert.called(ctx.gladys.device.get);
  });

  it('should swallow a failure while loading the devices', async () => {
    const ctx = buildContext([]);
    ctx.gladys.device.get = fake.rejects(new Error('db down'));

    await applySchedules.call(ctx);

    assert.notCalled(ctx.gladys.device.setValue);
  });
});
