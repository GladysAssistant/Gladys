const { assert } = require('chai');
const { convertFeature } = require('../../../../services/zigbee2mqtt/utils/convertFeature');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const features = [
  {
    external_id: 'zigbee2mqtt:device:switch:binary:switch',
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    read_only: false,
  },
  {
    external_id: 'zigbee2mqtt:device:light:binary:light',
    category: DEVICE_FEATURE_CATEGORIES.LIGHT,
    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    read_only: false,
  },
];

describe('zigbee2mqtt convertFeature', () => {
  it('should return switch binary', () => {
    const feature = convertFeature(features, 'switch');
    assert.strictEqual(feature.category, DEVICE_FEATURE_CATEGORIES.SWITCH);
    assert.strictEqual(feature.type, DEVICE_FEATURE_TYPES.SENSOR.BINARY);
    assert.strictEqual(feature.read_only, false);
  });
  it('should return light binary', () => {
    const feature = convertFeature(features, 'light');
    assert.strictEqual(feature.category, DEVICE_FEATURE_CATEGORIES.LIGHT);
    assert.strictEqual(feature.type, DEVICE_FEATURE_TYPES.SENSOR.BINARY);
    assert.strictEqual(feature.read_only, false);
  });
  it('should return nothing', () => {
    const feature = convertFeature(features, 'bad_field');
    assert.isUndefined(feature);
  });
});
