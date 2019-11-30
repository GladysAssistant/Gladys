const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../utils/constants');

const { getDeviceHandlerType } = require('../../../../../services/smartthings/lib/connector/getDeviceHandlerType');

describe('SmartThings service - getDeviceHandlerType', () => {
  it('c2c-smoke-2', async () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    ];

    const deviceHandlerType = getDeviceHandlerType({ features });
    expect(deviceHandlerType).to.have.property('value', 'c2c-smoke-2');
  });
});
