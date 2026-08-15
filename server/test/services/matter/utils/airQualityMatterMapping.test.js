const { expect } = require('chai');

const { AIR_QUALITY_LEVEL } = require('../../../../utils/constants');
const {
  AIR_QUALITY_LEVEL_LABELS,
  getAirQualityLevelSupportedOptions,
} = require('../../../../services/matter/utils/airQualityMatterMapping');

describe('Matter airQualityMatterMapping', () => {
  it('should only expose the mandatory levels when no optional feature is supported', () => {
    expect(getAirQualityLevelSupportedOptions({})).to.deep.eq([
      { value: AIR_QUALITY_LEVEL.UNKNOWN, label: 'Unknown' },
      { value: AIR_QUALITY_LEVEL.GOOD, label: 'Good' },
      { value: AIR_QUALITY_LEVEL.POOR, label: 'Poor' },
    ]);
  });

  it('should only expose the mandatory levels when the cluster declares no feature at all', () => {
    expect(getAirQualityLevelSupportedOptions(undefined)).to.deep.eq([
      { value: AIR_QUALITY_LEVEL.UNKNOWN, label: 'Unknown' },
      { value: AIR_QUALITY_LEVEL.GOOD, label: 'Good' },
      { value: AIR_QUALITY_LEVEL.POOR, label: 'Poor' },
    ]);
  });

  it('should add the optional levels the cluster supports, sorted by level', () => {
    expect(getAirQualityLevelSupportedOptions({ moderate: true, extremelyPoor: true })).to.deep.eq([
      { value: AIR_QUALITY_LEVEL.UNKNOWN, label: 'Unknown' },
      { value: AIR_QUALITY_LEVEL.GOOD, label: 'Good' },
      { value: AIR_QUALITY_LEVEL.MODERATE, label: 'Moderate' },
      { value: AIR_QUALITY_LEVEL.POOR, label: 'Poor' },
      { value: AIR_QUALITY_LEVEL.EXTREMELY_POOR, label: 'Extremely poor' },
    ]);
  });

  it('should expose the whole scale when every optional feature is supported', () => {
    const options = getAirQualityLevelSupportedOptions({
      fair: true,
      moderate: true,
      veryPoor: true,
      extremelyPoor: true,
    });

    expect(options).to.deep.eq(
      Object.values(AIR_QUALITY_LEVEL).map((level) => ({ value: level, label: AIR_QUALITY_LEVEL_LABELS[level] })),
    );
  });
});
