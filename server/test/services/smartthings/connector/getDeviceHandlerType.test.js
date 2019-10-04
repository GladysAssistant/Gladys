const { assert } = require('sinon');
const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const { getDeviceHandlerType } = require('../../../../services/smartthings/lib/connector/getDeviceHandlerType');

describe('SmartThings service - getDeviceHandlerType', () => {
  it('get corresponding device handler type', async () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.CAMERA,
        type: DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
      },
    ];

    const deviceHandlerType = getDeviceHandlerType(features);
    expect(deviceHandlerType).to.be.a('string');
    expect(deviceHandlerType).to.not.be.lengthOf(0);
  });

  it('get error on empty features', async () => {
    const features = [];

    try {
      getDeviceHandlerType(features);
      assert.fail('should have fail');
    } catch (e) {
      expect(e.message).to.eq(`SmartThings don't manage this kind of device yet.`);
    }
  });

  it('get error on multiple feature categories', async () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.CAMERA,
        type: DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
      },
      {
        category: DEVICE_FEATURE_CATEGORIES.SIREN,
        type: DEVICE_FEATURE_TYPES.SIREN.BINARY,
      },
    ];

    try {
      getDeviceHandlerType(features);
      assert.fail('should have fail');
    } catch (e) {
      expect(e.message).to.eq(`SmartThings don't manage a device with multiple categories yet.`);
    }
  });
});
