const { assert } = require('chai');
const { convertFeature } = require('../../../../services/zigbee2mqtt/utils/convertFeature');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

describe('zigbee2mqtt convertFeature', () => {
  it('should return switch binary', () => {
    const feature = convertFeature('switch');
    assert.strictEqual(feature.category, DEVICE_FEATURE_CATEGORIES.SWITCH);
    assert.strictEqual(feature.type, DEVICE_FEATURE_TYPES.SENSOR.BINARY);
    assert.strictEqual(feature.read_only, false);
  });
  it('should return light binary', () => {
    const feature = convertFeature('light');
    assert.strictEqual(feature.category, DEVICE_FEATURE_CATEGORIES.LIGHT);
    assert.strictEqual(feature.type, DEVICE_FEATURE_TYPES.SENSOR.BINARY);
    assert.strictEqual(feature.read_only, false);
  });
  it('should return contact', () => {
    try {
      convertFeature('unknowned');
      assert.fail();
    } catch (e) {
      assert.isNotNull(e);
    }
  });
});
