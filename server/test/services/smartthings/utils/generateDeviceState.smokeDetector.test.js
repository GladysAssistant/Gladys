const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { generateDeviceState } = require('../../../../services/smartthings/lib/utils/generateDeviceState');

describe('SmartThings service - generateDeviceState', () => {
  it('match smokeDetector (detected)', () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        last_value: 1,
      },
    ];
    const states = generateDeviceState(features);

    expect(states).to.deep.eq([
      {
        component: 'main',
        capability: 'st.smokeDetector',
        attribute: 'smoke',
        value: 'detected',
      },
      {
        component: 'main',
        capability: 'st.healthCheck',
        attribute: 'healthStatus',
        value: 'online',
      },
    ]);
  });

  it('match smokeDetector (clear)', () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        last_value: 0,
      },
    ];
    const states = generateDeviceState(features);

    expect(states).to.deep.eq([
      {
        component: 'main',
        capability: 'st.smokeDetector',
        attribute: 'smoke',
        value: 'clear',
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
