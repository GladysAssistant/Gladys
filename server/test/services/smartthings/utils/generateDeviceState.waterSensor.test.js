const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { generateDeviceState } = require('../../../../services/smartthings/lib/utils/generateDeviceState');

describe('SmartThings service - generateDeviceState', () => {
  it('match waterSensor (dry)', () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        last_value: 0,
      },
    ];
    const states = generateDeviceState(features);

    expect(states).to.deep.eq([
      {
        component: 'main',
        capability: 'st.waterSensor',
        attribute: 'water',
        value: 'dry',
      },
      {
        component: 'main',
        capability: 'st.healthCheck',
        attribute: 'healthStatus',
        value: 'online',
      },
    ]);
  });

  it('match waterSensor (wet)', () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        last_value: 1,
      },
    ];
    const states = generateDeviceState(features);

    expect(states).to.deep.eq([
      {
        component: 'main',
        capability: 'st.waterSensor',
        attribute: 'water',
        value: 'wet',
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
