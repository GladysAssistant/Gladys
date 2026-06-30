const { expect } = require('chai');

const {
  DEVICE_FEATURE_TYPES,
  FAN_ROCK_SETTING,
  FAN_WIND_SETTING,
  FAN_AIRFLOW_DIRECTION,
  getFanFeatureOptions,
} = require('../../utils/constants');

describe('getFanFeatureOptions', () => {
  it('should return rock setting options within device bounds', () => {
    expect(getFanFeatureOptions(DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING, FAN_ROCK_SETTING.OFF, 1)).to.deep.equal([
      FAN_ROCK_SETTING.OFF,
      FAN_ROCK_SETTING.LEFT_RIGHT,
    ]);
  });

  it('should return all wind setting options when device supports them', () => {
    expect(
      getFanFeatureOptions(
        DEVICE_FEATURE_TYPES.FAN.WIND_SETTING,
        FAN_WIND_SETTING.OFF,
        FAN_WIND_SETTING.SLEEP_AND_NATURAL,
      ),
    ).to.deep.equal([
      FAN_WIND_SETTING.OFF,
      FAN_WIND_SETTING.SLEEP,
      FAN_WIND_SETTING.NATURAL,
      FAN_WIND_SETTING.SLEEP_AND_NATURAL,
    ]);
  });

  it('should return airflow direction options', () => {
    expect(
      getFanFeatureOptions(
        DEVICE_FEATURE_TYPES.FAN.AIRFLOW_DIRECTION,
        FAN_AIRFLOW_DIRECTION.FORWARD,
        FAN_AIRFLOW_DIRECTION.REVERSE,
      ),
    ).to.deep.equal([FAN_AIRFLOW_DIRECTION.FORWARD, FAN_AIRFLOW_DIRECTION.REVERSE]);
  });

  it('should return a numeric range for unknown fan feature types', () => {
    expect(getFanFeatureOptions('unknown-type', 2, 4)).to.deep.equal([2, 3, 4]);
  });

  it('should use default min and max when not provided', () => {
    expect(getFanFeatureOptions('unknown-type')).to.deep.equal([0]);
  });
});
