const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { generateDeviceState } = require('../../../../services/smartthings/lib/utils/generateDeviceState');

describe('SmartThings service - generateDeviceState', () => {
  it('match switch (on)', () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        last_value: 1,
      },
    ];
    const states = generateDeviceState(features);

    expect(states).to.deep.eq([
      {
        component: 'main',
        capability: 'st.switch',
        attribute: 'switch',
        value: 'on',
      },
      {
        component: 'main',
        capability: 'st.healthCheck',
        attribute: 'healthStatus',
        value: 'online',
      },
    ]);
  });

  it('match switch (off)', () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
        last_value: 0,
      },
    ];
    const states = generateDeviceState(features);

    expect(states).to.deep.eq([
      {
        component: 'main',
        capability: 'st.switch',
        attribute: 'switch',
        value: 'off',
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
