const { expect } = require('chai');

const { DEVICE_FEATURE_UNITS } = require('../../../../utils/constants');
const {
  parseEnd,
  findMatchingPreset,
  getSetpointForPreset,
  computeSwitchActive,
  readTemperatureInThermostatUnit,
} = require('../../../../services/thermostat/lib/thermostat.applySchedules');

describe('thermostat.applySchedules - parseEnd', () => {
  it('should convert HH:MM to minutes', () => {
    expect(parseEnd('08:30')).to.equal(510);
  });

  it('should treat 00:00 as end of day (1440)', () => {
    expect(parseEnd('00:00')).to.equal(1440);
  });

  it('should handle 23:59', () => {
    expect(parseEnd('23:59')).to.equal(1439);
  });
});

describe('thermostat.applySchedules - findMatchingPreset', () => {
  it('should match a normal same-day slot', () => {
    const today = [{ start_time: '08:00', end_time: '12:00', preset: 'comfort' }];
    expect(findMatchingPreset(today, [], 9 * 60)).to.equal('comfort');
  });

  it('should return null when no slot matches', () => {
    const today = [{ start_time: '08:00', end_time: '12:00', preset: 'comfort' }];
    expect(findMatchingPreset(today, [], 13 * 60)).to.equal(null);
  });

  it('should be inclusive of slot start and exclusive of slot end', () => {
    const today = [{ start_time: '08:00', end_time: '12:00', preset: 'comfort' }];
    expect(findMatchingPreset(today, [], 8 * 60)).to.equal('comfort');
    expect(findMatchingPreset(today, [], 12 * 60)).to.equal(null);
  });

  it('should match a slot ending at midnight (00:00 = end of day)', () => {
    const today = [{ start_time: '22:00', end_time: '00:00', preset: 'night' }];
    expect(findMatchingPreset(today, [], 23 * 60)).to.equal('night');
  });

  it('should match the start portion of an overnight slot on the same day', () => {
    // 22:00 -> 07:00 covers 22:00..23:59 on the start day
    const today = [{ start_time: '22:00', end_time: '07:00', preset: 'night' }];
    expect(findMatchingPreset(today, [], 23 * 60)).to.equal('night');
  });

  it('should match the tail of yesterday overnight slot after midnight', () => {
    // yesterday 22:00 -> 07:00 covers 00:00..07:00 today
    const yesterday = [{ start_time: '22:00', end_time: '07:00', preset: 'night' }];
    expect(findMatchingPreset([], yesterday, 5 * 60)).to.equal('night');
  });

  it('should not match yesterday overnight slot after its end', () => {
    const yesterday = [{ start_time: '22:00', end_time: '07:00', preset: 'night' }];
    expect(findMatchingPreset([], yesterday, 8 * 60)).to.equal(null);
  });

  it('should prefer a same-day normal slot over yesterday overnight', () => {
    const today = [{ start_time: '06:00', end_time: '09:00', preset: 'comfort' }];
    const yesterday = [{ start_time: '22:00', end_time: '07:00', preset: 'night' }];
    expect(findMatchingPreset(today, yesterday, 6 * 60 + 30)).to.equal('comfort');
  });
});

describe('thermostat.applySchedules - getSetpointForPreset', () => {
  it('should return null for off preset', () => {
    expect(getSetpointForPreset('off', {})).to.equal(null);
  });

  it('should return config value when present', () => {
    expect(getSetpointForPreset('comfort', { preset_comfort: 21 })).to.equal(21);
  });

  it('should fall back to default when config missing the preset', () => {
    expect(getSetpointForPreset('eco', {})).to.equal(18);
  });

  it('should fall back to default when config is null', () => {
    expect(getSetpointForPreset('frost', null)).to.equal(7);
  });

  it('should coerce a string config value to number', () => {
    expect(getSetpointForPreset('night', { preset_night: '19' })).to.equal(19);
  });

  it('should use generic 20 default for an unknown preset', () => {
    expect(getSetpointForPreset('unknown', {})).to.equal(20);
  });

  it('should keep a legitimate 0 value instead of falling back to the default', () => {
    expect(getSetpointForPreset('frost', { preset_frost: 0 })).to.equal(0);
    expect(getSetpointForPreset('frost', { preset_frost: '0' })).to.equal(0);
  });
});

describe('thermostat.applySchedules - computeSwitchActive', () => {
  const config = { hysteresis_start: 0.5, hysteresis_stop: 0.5 };

  it('should return false when current temp is null', () => {
    expect(computeSwitchActive(null, 20, 'heating', config, false)).to.equal(false);
  });

  describe('heating mode', () => {
    it('should turn ON when temp is below setpoint minus hysteresis', () => {
      expect(computeSwitchActive(19, 20, 'heating', config, false)).to.equal(true);
    });

    it('should turn OFF when temp is above setpoint plus hysteresis', () => {
      expect(computeSwitchActive(21, 20, 'heating', config, true)).to.equal(false);
    });

    it('should keep current state (ON) in the neutral zone', () => {
      expect(computeSwitchActive(20, 20, 'heating', config, true)).to.equal(true);
    });

    it('should keep current state (OFF) in the neutral zone', () => {
      expect(computeSwitchActive(20, 20, 'heating', config, false)).to.equal(false);
    });
  });

  describe('cooling mode', () => {
    it('should turn ON when temp is above setpoint plus hysteresis', () => {
      expect(computeSwitchActive(25, 24, 'cooling', config, false)).to.equal(true);
    });

    it('should turn OFF when temp is below setpoint minus hysteresis', () => {
      expect(computeSwitchActive(23, 24, 'cooling', config, true)).to.equal(false);
    });

    it('should keep current state in the neutral zone', () => {
      expect(computeSwitchActive(24, 24, 'cooling', config, true)).to.equal(true);
    });
  });

  it('should use default hysteresis of 0.5 when config missing', () => {
    expect(computeSwitchActive(19, 20, 'heating', {}, false)).to.equal(true);
    expect(computeSwitchActive(19.6, 20, 'heating', {}, false)).to.equal(false);
  });

  it('should return false when setpoint is null', () => {
    expect(computeSwitchActive(19, null, 'heating', config, true)).to.equal(false);
  });

  it('should honor a legitimate 0 hysteresis instead of falling back to 0.5', () => {
    const zeroConfig = { hysteresis_start: 0, hysteresis_stop: 0 };
    // With 0 hysteresis, 19.9 < 20 - 0 → ON (with default 0.5 it would stay in the neutral zone)
    expect(computeSwitchActive(19.9, 20, 'heating', zeroConfig, false)).to.equal(true);
  });

  describe('TPI control type', () => {
    const tpiConfig = { control_type: 'tpi', tpi_cycle_time: 10, tpi_proportional_band: 2 };

    it('should be fully ON when the error exceeds the proportional band', () => {
      // error = 20 - 17 = 3 ≥ band 2 → always ON regardless of cycle position
      expect(computeSwitchActive(17, 20, 'heating', tpiConfig, false, 0)).to.equal(true);
      expect(computeSwitchActive(17, 20, 'heating', tpiConfig, false, 9 * 60000)).to.equal(true);
    });

    it('should be fully OFF when at or above the setpoint', () => {
      expect(computeSwitchActive(20, 20, 'heating', tpiConfig, true, 0)).to.equal(false);
      expect(computeSwitchActive(21, 20, 'heating', tpiConfig, true, 0)).to.equal(false);
    });

    it('should modulate within the cycle when inside the proportional band', () => {
      // error = 1, band = 2 → ON 50% of a 10-minute cycle: minutes 0-4 ON, 5-9 OFF
      expect(computeSwitchActive(19, 20, 'heating', tpiConfig, false, 0)).to.equal(true);
      expect(computeSwitchActive(19, 20, 'heating', tpiConfig, false, 4 * 60000)).to.equal(true);
      expect(computeSwitchActive(19, 20, 'heating', tpiConfig, false, 5 * 60000)).to.equal(false);
      expect(computeSwitchActive(19, 20, 'heating', tpiConfig, false, 9 * 60000)).to.equal(false);
    });

    it('should fall back to hysteresis in cooling mode', () => {
      // TPI is heating-only: a compressor cannot be pulsed over a cycle.
      // 25 > 24 + 0.5 default start threshold → ON, and it stays ON for the
      // whole cycle instead of modulating.
      expect(computeSwitchActive(25, 24, 'cooling', tpiConfig, false, 0)).to.equal(true);
      expect(computeSwitchActive(25, 24, 'cooling', tpiConfig, true, 5 * 60000)).to.equal(true);
      // and below the stop threshold it turns off, as hysteresis does
      expect(computeSwitchActive(23, 24, 'cooling', tpiConfig, true, 0)).to.equal(false);
    });

    it('should stay off when the computed on-time is under one minute', () => {
      // Regulation runs once a minute: error = 0.1, band = 2 → 5% of a
      // 10-minute cycle = 30 s, shorter than the control step.
      expect(computeSwitchActive(19.9, 20, 'heating', tpiConfig, false, 0)).to.equal(false);
      // error = 0.5 → 2.5 minutes, comfortably actionable
      expect(computeSwitchActive(19.5, 20, 'heating', tpiConfig, false, 0)).to.equal(true);
    });
  });
});

describe('thermostat.applySchedules - readTemperatureInThermostatUnit', () => {
  it('should return the reading unchanged when both units match', () => {
    const feature = { last_value: 20, unit: DEVICE_FEATURE_UNITS.CELSIUS };
    expect(readTemperatureInThermostatUnit(feature, 'C')).to.equal(20);
  });

  it('should convert a celsius sensor for a fahrenheit thermostat', () => {
    // The sensor and the thermostat are two separate devices: comparing 20
    // against a 68 setpoint would leave the heating permanently off.
    const feature = { last_value: 20, unit: DEVICE_FEATURE_UNITS.CELSIUS };
    expect(readTemperatureInThermostatUnit(feature, 'F')).to.equal(68);
  });

  it('should convert a fahrenheit sensor for a celsius thermostat', () => {
    const feature = { last_value: 68, unit: DEVICE_FEATURE_UNITS.FAHRENHEIT };
    expect(readTemperatureInThermostatUnit(feature, 'C')).to.equal(20);
  });

  it('should leave a fahrenheit sensor alone for a fahrenheit thermostat', () => {
    const feature = { last_value: 68, unit: DEVICE_FEATURE_UNITS.FAHRENHEIT };
    expect(readTemperatureInThermostatUnit(feature, 'F')).to.equal(68);
  });

  it('should assume the thermostat unit when the sensor declares none', () => {
    // Pre-existing behaviour: guessing would be worse than not converting.
    expect(readTemperatureInThermostatUnit({ last_value: 20 }, 'F')).to.equal(20);
    expect(readTemperatureInThermostatUnit({ last_value: 68, unit: null }, 'C')).to.equal(68);
  });

  it('should ignore a unit it does not know about', () => {
    const feature = { last_value: 20, unit: 'kelvin' };
    expect(readTemperatureInThermostatUnit(feature, 'F')).to.equal(20);
  });

  it('should return null for a missing reading', () => {
    expect(readTemperatureInThermostatUnit(null, 'C')).to.equal(null);
    expect(readTemperatureInThermostatUnit({ last_value: null }, 'C')).to.equal(null);
    expect(readTemperatureInThermostatUnit({ last_value: undefined }, 'C')).to.equal(null);
  });

  it('should keep a 0 reading, which is a legitimate temperature', () => {
    expect(readTemperatureInThermostatUnit({ last_value: 0, unit: DEVICE_FEATURE_UNITS.CELSIUS }, 'F')).to.equal(32);
  });
});
