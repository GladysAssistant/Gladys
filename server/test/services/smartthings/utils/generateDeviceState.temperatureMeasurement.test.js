const { expect } = require('chai');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
const { generateDeviceState } = require('../../../../services/smartthings/lib/utils/generateDeviceState');

describe('SmartThings service - generateDeviceState', () => {
  it('match temperatureMeasurement (C)', () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        last_value: 21,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
      },
    ];
    const states = generateDeviceState(features);

    expect(states).to.deep.eq([
      {
        component: 'main',
        capability: 'st.temperatureMeasurement',
        attribute: 'temperature',
        value: 21,
        unit: 'C',
      },
      {
        component: 'main',
        capability: 'st.healthCheck',
        attribute: 'healthStatus',
        value: 'online',
      },
    ]);
  });

  it('match temperatureMeasurement (default F)', () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        last_value: 22,
      },
    ];
    const states = generateDeviceState(features);

    expect(states).to.deep.eq([
      {
        component: 'main',
        capability: 'st.temperatureMeasurement',
        attribute: 'temperature',
        value: 22,
        unit: 'F',
      },
      {
        component: 'main',
        capability: 'st.healthCheck',
        attribute: 'healthStatus',
        value: 'online',
      },
    ]);
  });
});
