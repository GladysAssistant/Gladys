const { expect } = require('chai');
const {
  THERMOSTAT_MODE,
  THERMOSTAT_OPERATING_STATE,
  BATTERY_STORAGE_MODE,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_CATEGORIES_LIST,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_TYPES_LIST,
  DEVICE_FEATURE_UNITS,
  DEVICE_FEATURE_UNITS_BY_CATEGORY,
  DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE,
} = require('../../utils/constants');

describe('constants THERMOSTAT_MODE', () => {
  it('should expose the expected mode values', () => {
    expect(THERMOSTAT_MODE).to.deep.equal({
      OFF: 0,
      HEATING: 1,
      COOLING: 2,
      AUTO: 3,
    });
  });
});

describe('constants THERMOSTAT_OPERATING_STATE', () => {
  it('should expose the expected operating state values', () => {
    expect(THERMOSTAT_OPERATING_STATE).to.deep.equal({
      IDLE: 0,
      HEATING: 1,
      COOLING: 2,
    });
  });
});

describe('constants DEVICE_FEATURE_CATEGORIES.THERMOSTAT / DEVICE_FEATURE_TYPES.THERMOSTAT', () => {
  it('should expose the thermostat category', () => {
    expect(DEVICE_FEATURE_CATEGORIES.THERMOSTAT).to.equal('thermostat');
  });

  it('should expose the mode, the temperature and operating-state feature types', () => {
    expect(DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE).to.equal('target-temperature');
    expect(DEVICE_FEATURE_TYPES.THERMOSTAT.MODE).to.equal('mode');
    expect(DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE).to.equal('operating-state');
  });
});

describe('constants DEVICE_FEATURE_CATEGORIES.MAINTENANCE / DEVICE_FEATURE_TYPES.MAINTENANCE', () => {
  it('should expose the maintenance category', () => {
    expect(DEVICE_FEATURE_CATEGORIES.MAINTENANCE).to.equal('maintenance');
  });

  it('should expose a single generic life-remaining feature type', () => {
    expect(DEVICE_FEATURE_TYPES.MAINTENANCE).to.deep.equal({
      LIFE_REMAINING: 'life-remaining',
    });
  });

  it('should only allow the percent unit', () => {
    expect(DEVICE_FEATURE_UNITS_BY_CATEGORY[DEVICE_FEATURE_CATEGORIES.MAINTENANCE]).to.deep.equal([
      DEVICE_FEATURE_UNITS.PERCENT,
    ]);
  });

  it('should stay distinct from the HEPA filter monitoring contract', () => {
    expect(DEVICE_FEATURE_CATEGORIES.MAINTENANCE).to.not.equal(DEVICE_FEATURE_CATEGORIES.HEPA_FILTER_MONITORING);
    expect(DEVICE_FEATURE_TYPES.MAINTENANCE.LIFE_REMAINING).to.not.equal(
      DEVICE_FEATURE_TYPES.FILTER_MONITORING.FILTER_LIFE_REMAINING,
    );
  });
});

describe('constants DEVICE_FEATURE_CATEGORIES.GRID_CARBON_SENSOR / DEVICE_FEATURE_TYPES.GRID_CARBON_SENSOR', () => {
  it('should expose the grid carbon category', () => {
    expect(DEVICE_FEATURE_CATEGORIES.GRID_CARBON_SENSOR).to.equal('grid-carbon-sensor');
  });

  it('should expose the intensity and the two generation shares', () => {
    expect(DEVICE_FEATURE_TYPES.GRID_CARBON_SENSOR).to.deep.equal({
      CARBON_INTENSITY: 'carbon-intensity',
      CARBON_FREE_PERCENTAGE: 'carbon-free-percentage',
      RENEWABLE_PERCENTAGE: 'renewable-percentage',
    });
  });

  it('should stay distinct from the grid energy exchange category', () => {
    expect(DEVICE_FEATURE_CATEGORIES.GRID_CARBON_SENSOR).to.not.equal(DEVICE_FEATURE_CATEGORIES.GRID_SENSOR);
  });

  it('should allow the carbon intensity unit and the percent unit', () => {
    expect(DEVICE_FEATURE_UNITS.GRAM_CO2_EQ_PER_KILOWATT_HOUR).to.equal('gram-co2eq-per-kilowatt-hour');
    expect(DEVICE_FEATURE_UNITS_BY_CATEGORY[DEVICE_FEATURE_CATEGORIES.GRID_CARBON_SENSOR]).to.deep.equal([
      DEVICE_FEATURE_UNITS.GRAM_CO2_EQ_PER_KILOWATT_HOUR,
      DEVICE_FEATURE_UNITS.PERCENT,
    ]);
  });

  it('should scope the unit of each type: gCO2eq/kWh for the intensity, percent for the shares', () => {
    const unitsByType = DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE[DEVICE_FEATURE_CATEGORIES.GRID_CARBON_SENSOR];
    expect(unitsByType[DEVICE_FEATURE_TYPES.GRID_CARBON_SENSOR.CARBON_INTENSITY]).to.deep.equal([
      DEVICE_FEATURE_UNITS.GRAM_CO2_EQ_PER_KILOWATT_HOUR,
    ]);
    expect(unitsByType[DEVICE_FEATURE_TYPES.GRID_CARBON_SENSOR.CARBON_FREE_PERCENTAGE]).to.deep.equal([
      DEVICE_FEATURE_UNITS.PERCENT,
    ]);
    expect(unitsByType[DEVICE_FEATURE_TYPES.GRID_CARBON_SENSOR.RENEWABLE_PERCENTAGE]).to.deep.equal([
      DEVICE_FEATURE_UNITS.PERCENT,
    ]);
  });
});

describe('constants BATTERY_STORAGE_MODE', () => {
  it('should expose the full generic set of battery storage modes', () => {
    expect(BATTERY_STORAGE_MODE).to.deep.equal({
      AUTO: 0,
      CHARGE: 1,
      DISCHARGE: 2,
      STANDBY: 3,
      TIME_OF_USE: 4,
      BACKUP: 5,
    });
  });
});

describe('constants DEVICE_FEATURE_CATEGORIES.BATTERY_STORAGE / DEVICE_FEATURE_TYPES.BATTERY_STORAGE', () => {
  it('should expose the battery storage category', () => {
    expect(DEVICE_FEATURE_CATEGORIES.BATTERY_STORAGE).to.equal('battery-storage');
  });

  it('should expose the measurements and the commands of a storage battery', () => {
    expect(DEVICE_FEATURE_TYPES.BATTERY_STORAGE).to.deep.equal({
      BATTERY_LEVEL: 'battery-level',
      CHARGE_POWER: 'charge-power',
      DISCHARGE_POWER: 'discharge-power',
      CHARGE_INDEX: 'charge-index',
      DISCHARGE_INDEX: 'discharge-index',
      BATTERY_ENERGY_REMAINING: 'battery-energy-remaining',
      CHARGE_POWER_LIMIT: 'charge-power-limit',
      DISCHARGE_POWER_LIMIT: 'discharge-power-limit',
      TARGET_CHARGE_LIMIT: 'target-charge-limit',
      TARGET_DISCHARGE_LIMIT: 'target-discharge-limit',
      MODE: 'mode',
      GRID_CHARGE_POWER_LIMIT: 'grid-charge-power-limit',
    });
  });

  it('should share the target-charge-limit string with the electrical vehicle charge limit', () => {
    expect(DEVICE_FEATURE_TYPES.BATTERY_STORAGE.TARGET_CHARGE_LIMIT).to.equal(
      DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.TARGET_CHARGE_LIMIT,
    );
  });

  it('should scope the unit of each command type: power for the power limits, percent for the charge limits', () => {
    const unitsByType = DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE[DEVICE_FEATURE_CATEGORIES.BATTERY_STORAGE];
    expect(unitsByType).to.deep.equal({
      [DEVICE_FEATURE_TYPES.BATTERY_STORAGE.CHARGE_POWER_LIMIT]: [
        DEVICE_FEATURE_UNITS.WATT,
        DEVICE_FEATURE_UNITS.KILOWATT,
      ],
      [DEVICE_FEATURE_TYPES.BATTERY_STORAGE.DISCHARGE_POWER_LIMIT]: [
        DEVICE_FEATURE_UNITS.WATT,
        DEVICE_FEATURE_UNITS.KILOWATT,
      ],
      [DEVICE_FEATURE_TYPES.BATTERY_STORAGE.TARGET_CHARGE_LIMIT]: [DEVICE_FEATURE_UNITS.PERCENT],
      [DEVICE_FEATURE_TYPES.BATTERY_STORAGE.TARGET_DISCHARGE_LIMIT]: [DEVICE_FEATURE_UNITS.PERCENT],
      [DEVICE_FEATURE_TYPES.BATTERY_STORAGE.MODE]: [],
      [DEVICE_FEATURE_TYPES.BATTERY_STORAGE.GRID_CHARGE_POWER_LIMIT]: [
        DEVICE_FEATURE_UNITS.WATT,
        DEVICE_FEATURE_UNITS.KILOWATT,
      ],
    });
  });

  it('should keep every command unit within the category unit list', () => {
    const categoryUnits = DEVICE_FEATURE_UNITS_BY_CATEGORY[DEVICE_FEATURE_CATEGORIES.BATTERY_STORAGE];
    const unitsByType = DEVICE_FEATURE_UNITS_BY_CATEGORY_AND_TYPE[DEVICE_FEATURE_CATEGORIES.BATTERY_STORAGE];
    Object.values(unitsByType).forEach((units) => {
      units.forEach((unit) => expect(categoryUnits).to.include(unit));
    });
  });
});

describe('constants DEVICE_FEATURE_CATEGORIES.HOME_OUTPUT / DEVICE_FEATURE_TYPES.HOME_OUTPUT', () => {
  it('should expose the home output command category next to its read-only measurement category', () => {
    expect(DEVICE_FEATURE_CATEGORIES.HOME_OUTPUT).to.equal('home-output');
    expect(DEVICE_FEATURE_CATEGORIES.HOME_OUTPUT_SENSOR).to.equal('home-output-sensor');
  });

  it('should expose the output power limit command', () => {
    expect(DEVICE_FEATURE_TYPES.HOME_OUTPUT).to.deep.equal({
      POWER_LIMIT: 'power-limit',
    });
  });

  it('should only accept power units for the output power limit', () => {
    expect(DEVICE_FEATURE_UNITS_BY_CATEGORY[DEVICE_FEATURE_CATEGORIES.HOME_OUTPUT]).to.deep.equal([
      DEVICE_FEATURE_UNITS.WATT,
      DEVICE_FEATURE_UNITS.KILOWATT,
    ]);
  });

  it('should be accepted by the lists external integrations are validated against', () => {
    expect(DEVICE_FEATURE_CATEGORIES_LIST).to.include(DEVICE_FEATURE_CATEGORIES.HOME_OUTPUT);
    expect(DEVICE_FEATURE_TYPES_LIST).to.include(DEVICE_FEATURE_TYPES.HOME_OUTPUT.POWER_LIMIT);
    expect(DEVICE_FEATURE_TYPES_LIST).to.include(DEVICE_FEATURE_TYPES.BATTERY_STORAGE.GRID_CHARGE_POWER_LIMIT);
  });
});
