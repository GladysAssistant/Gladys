const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../utils/constants');

const { getDeviceHandlerType } = require('../../../../../services/smartthings/lib/connector/getDeviceHandlerType');

describe('SmartThings service - getDeviceHandlerType', () => {
  it('c2c-button', async () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
      },
    ];

    const deviceHandlerType = getDeviceHandlerType({ features });
    expect(deviceHandlerType).to.have.property('value', 'c2c-button');
  });
});
