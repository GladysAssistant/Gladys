const { assert } = require('sinon');
const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const { getDeviceHandlerType } = require('../../../../services/smartthings/lib/connector/getDeviceHandlerType');

describe('SmartThings service - getDeviceHandlerType', () => {
  it('get corresponding device handler type', () => {
    const features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      },
    ];

    const deviceHandlerType = getDeviceHandlerType({ features });
    expect(deviceHandlerType).to.have.property('value', 'c2c-switch');
  });

  it('get error on empty features', () => {
    const features = [];

    try {
      getDeviceHandlerType({ features });
      assert.fail('should have fail');
    } catch (e) {
      expect(e.message).to.eq(`SmartThings don't manage this kind of device yet : "undefined" ("undefined").`);
    }
  });

  it('get error on multiple feature categories', () => {
    const features = [
      {
        category: 'any',
        type: 'device',
      },
    ];

    try {
      getDeviceHandlerType({ name: 'name', external_id: 'id', features });
      assert.fail('should have fail');
    } catch (e) {
      expect(e.message).to.eq(`SmartThings don't manage this kind of device yet : "name" ("id").`);
    }
  });
});
