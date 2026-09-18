const { expect } = require('chai');
const {
  THERMOSTAT_MODE,
  THERMOSTAT_OPERATING_STATE,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
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
