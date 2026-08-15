const { expect } = require('chai');

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const {
  MATTER_DEVICE_TYPE,
  DEFAULT_BOOLEAN_STATE_FEATURE,
  getBooleanStateFeatureCategoryAndType,
} = require('../../../../services/matter/utils/booleanStateMatterMapping');

describe('Matter booleanStateMatterMapping', () => {
  it('should map a water leak detector endpoint to a leak sensor', () => {
    const device = {
      getDeviceTypes: () => [{ name: 'MA-waterleakdetector', code: MATTER_DEVICE_TYPE.WATER_LEAK_DETECTOR }],
    };

    expect(getBooleanStateFeatureCategoryAndType(device)).to.deep.eq({
      category: DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    });
  });

  it('should map a contact sensor endpoint to an opening sensor', () => {
    const device = {
      getDeviceTypes: () => [{ name: 'MA-contactsensor', code: MATTER_DEVICE_TYPE.CONTACT_SENSOR }],
    };

    expect(getBooleanStateFeatureCategoryAndType(device)).to.deep.eq({
      category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    });
  });

  it('should map a rain sensor endpoint to a rain sensor', () => {
    const device = {
      getDeviceTypes: () => [{ name: 'MA-rainsensor', code: MATTER_DEVICE_TYPE.RAIN_SENSOR }],
    };

    expect(getBooleanStateFeatureCategoryAndType(device)).to.deep.eq({
      category: DEVICE_FEATURE_CATEGORIES.RAIN_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    });
  });

  it('should find the known device type among several device types', () => {
    const device = {
      getDeviceTypes: () => [
        null,
        { name: 'MA-powersource', code: 0x0011 },
        { name: 'MA-waterleakdetector', code: MATTER_DEVICE_TYPE.WATER_LEAK_DETECTOR },
      ],
    };

    expect(getBooleanStateFeatureCategoryAndType(device)).to.deep.eq({
      category: DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    });
  });

  it('should fallback to a generic switch for a water freeze detector', () => {
    const device = {
      getDeviceTypes: () => [{ name: 'MA-waterfreezedetector', code: MATTER_DEVICE_TYPE.WATER_FREEZE_DETECTOR }],
    };

    expect(getBooleanStateFeatureCategoryAndType(device)).to.deep.eq(DEFAULT_BOOLEAN_STATE_FEATURE);
    expect(DEFAULT_BOOLEAN_STATE_FEATURE).to.deep.eq({
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    });
  });

  it('should fallback to a generic switch for an unknown device type', () => {
    const device = {
      getDeviceTypes: () => [{ name: 'MA-unknown', code: 0xfff1 }],
    };

    expect(getBooleanStateFeatureCategoryAndType(device)).to.deep.eq(DEFAULT_BOOLEAN_STATE_FEATURE);
  });

  it('should fallback to a generic switch when getDeviceTypes does not return an array', () => {
    const device = {
      getDeviceTypes: () => undefined,
    };

    expect(getBooleanStateFeatureCategoryAndType(device)).to.deep.eq(DEFAULT_BOOLEAN_STATE_FEATURE);
  });

  it('should fallback to a generic switch when the endpoint has no getDeviceTypes method', () => {
    expect(getBooleanStateFeatureCategoryAndType({})).to.deep.eq(DEFAULT_BOOLEAN_STATE_FEATURE);
  });

  it('should fallback to a generic switch when there is no device', () => {
    expect(getBooleanStateFeatureCategoryAndType(undefined)).to.deep.eq(DEFAULT_BOOLEAN_STATE_FEATURE);
  });
});
