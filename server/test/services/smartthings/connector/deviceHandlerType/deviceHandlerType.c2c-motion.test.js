const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../utils/constants');

const { getDeviceHandlerType } = require('../../../../../services/smartthings/lib/connector/getDeviceHandlerType');

describe('SmartThings service - getDeviceHandlerType', () => {
  it('c2c-motion', async () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
      {
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      },
      {
        category: DEVICE_FEATURE_CATEGORIES.BATTERY,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
      },
    ];

    const deviceHandlerType = getDeviceHandlerType({ features });
    expect(deviceHandlerType).to.have.property('value', 'c2c-motion');
  });
});
