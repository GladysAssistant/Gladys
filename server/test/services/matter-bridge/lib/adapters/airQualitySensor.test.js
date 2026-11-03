const { expect } = require('chai');

const airQualitySensor = require('../../../../../services/matter-bridge/lib/adapters/airQualitySensor');
const { AIR_QUALITY, MEASUREMENT_UNIT } = require('../../../../../services/matter-bridge/lib/constants');
const { createMatter, feature, createContext } = require('../../fakes');

const co2 = feature('co2', 'co2-sensor', 'integer');
const pm25 = feature('pm25', 'pm25-sensor', 'decimal');
const pm10 = feature('pm10', 'pm10-sensor', 'decimal');

describe('Matter bridge air quality adapter', () => {
  const matter = createMatter();

  it('should group the concentrations of a device', () => {
    expect(airQualitySensor.claim([co2, pm25, pm10, feature('x', 'co2-sensor', 'binary')])).to.deep.equal([
      { co2, pm25, pm10 },
    ]);
  });

  it('should build a sensor for the concentrations it measures', () => {
    const built = airQualitySensor.build(matter, { co2, pm25 }, createContext({ co2: 600 }));
    expect(built.type.name).to.equal('AirQualitySensorDevice');
    expect(built.type.behaviors.map((b) => [b.behaviorName, b.features])).to.deep.equal([
      ['CarbonDioxideConcentrationMeasurementServer', ['NumericMeasurement']],
      ['Pm25ConcentrationMeasurementServer', ['NumericMeasurement']],
    ]);
    expect(built.state.carbonDioxideConcentrationMeasurement).to.include({
      measuredValue: 600,
      measurementUnit: MEASUREMENT_UNIT.PPM,
    });
    expect(built.state.pm25ConcentrationMeasurement).to.include({
      measuredValue: null,
      measurementUnit: MEASUREMENT_UNIT.UGM3,
    });
    expect(built.state).to.not.have.property('pm10ConcentrationMeasurement');
    expect(built.state.airQuality).to.deep.equal({ airQuality: AIR_QUALITY.GOOD });
  });

  it('should forward a concentration with the air quality it leads to', () => {
    const endpointState = { carbonDioxideConcentrationMeasurement: { measuredValue: 3000 } };
    expect(airQualitySensor.toMatter('pm25', 10, { co2, pm25 }, endpointState)).to.deep.equal({
      pm25ConcentrationMeasurement: { measuredValue: 10 },
      airQuality: { airQuality: AIR_QUALITY.GOOD },
    });
    expect(airQualitySensor.toMatter('co2', 1200, { co2 }, {})).to.deep.equal({
      carbonDioxideConcentrationMeasurement: { measuredValue: 1200 },
      airQuality: { airQuality: AIR_QUALITY.MODERATE },
    });
  });
});
