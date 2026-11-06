const { expect } = require('chai');

const {
  MATTER_LIGHT_DEVICE_TYPE,
  MATTER_PLUG_DEVICE_TYPE,
  isLightEndpoint,
  applyLightCategoryToOnOff,
} = require('../../../../services/matter/utils/lightMatterMapping');

const buildOnOffFeature = () => ({
  category: 'switch',
  type: 'binary',
  external_id: 'matter:12345:1:6',
});

describe('Matter lightMatterMapping', () => {
  it('should recognize every lighting device type', () => {
    Object.values(MATTER_LIGHT_DEVICE_TYPE).forEach((code) => {
      expect(isLightEndpoint({ getDeviceTypes: () => [{ code }] }, [])).to.equal(true);
    });
  });

  it('should find a lighting device type behind a bridged node device type', () => {
    const device = {
      getDeviceTypes: () => [null, { code: 0x0013 }, { code: MATTER_LIGHT_DEVICE_TYPE.EXTENDED_COLOR_LIGHT }],
    };
    expect(isLightEndpoint(device, [])).to.equal(true);
  });

  it('should recognize a light by its light features when no device type is known', () => {
    expect(isLightEndpoint({}, [{ category: 'light', type: 'brightness' }])).to.equal(true);
    expect(isLightEndpoint({ getDeviceTypes: () => undefined }, [{ category: 'light', type: 'color' }])).to.equal(true);
  });

  it('should not take a plug for a light', () => {
    const device = { getDeviceTypes: () => [{ code: 0x010a }] };
    expect(isLightEndpoint(device, [buildOnOffFeature()])).to.equal(false);
  });

  it('should not take a dimmable plug or load control for a light, even with a lighting brightness', () => {
    // Their LevelControl has the lighting feature, so convertToGladysDevice gives them a light brightness
    const brightness = { category: 'light', type: 'brightness', external_id: 'matter:12345:1:8' };
    expect(MATTER_PLUG_DEVICE_TYPE).to.deep.equal({
      ON_OFF_PLUG_IN_UNIT: 0x010a,
      DIMMABLE_PLUG_IN_UNIT: 0x010b,
      MOUNTED_ON_OFF_CONTROL: 0x010f,
      MOUNTED_DIMMABLE_LOAD_CONTROL: 0x0110,
    });
    Object.values(MATTER_PLUG_DEVICE_TYPE).forEach((code) => {
      expect(isLightEndpoint({ getDeviceTypes: () => [{ code }] }, [buildOnOffFeature(), brightness])).to.equal(false);
    });
  });

  it('should find a plug device type behind a bridged node device type', () => {
    const device = {
      getDeviceTypes: () => [{ code: 0x0013 }, { code: MATTER_PLUG_DEVICE_TYPE.DIMMABLE_PLUG_IN_UNIT }],
    };
    expect(isLightEndpoint(device, [{ category: 'light', type: 'brightness' }])).to.equal(false);
  });

  it('should turn the OnOff feature of a light into a light binary feature', () => {
    const features = [buildOnOffFeature(), { category: 'light', type: 'brightness', external_id: 'matter:12345:1:8' }];
    applyLightCategoryToOnOff({}, features);
    expect(features[0]).to.deep.equal({ category: 'light', type: 'binary', external_id: 'matter:12345:1:6' });
    expect(features[1]).to.deep.equal({ category: 'light', type: 'brightness', external_id: 'matter:12345:1:8' });
  });

  it('should leave the other switch binary features of a light untouched', () => {
    // The BooleanState fallback (cluster 69) is also a switch binary, and its external_id starts like OnOff's.
    const booleanState = { category: 'switch', type: 'binary', external_id: 'matter:12345:1:69' };
    const features = [booleanState, { category: 'light', type: 'brightness', external_id: 'matter:12345:1:8' }];
    applyLightCategoryToOnOff({}, features);
    expect(features[0]).to.deep.equal({ category: 'switch', type: 'binary', external_id: 'matter:12345:1:69' });
  });

  it('should keep the OnOff feature of a plug a switch', () => {
    const features = [buildOnOffFeature()];
    applyLightCategoryToOnOff({ getDeviceTypes: () => [{ code: 0x010a }] }, features);
    expect(features[0]).to.deep.equal(buildOnOffFeature());
  });

  it('should keep the OnOff feature of a dimmable plug a switch', () => {
    const features = [buildOnOffFeature(), { category: 'light', type: 'brightness', external_id: 'matter:12345:1:8' }];
    applyLightCategoryToOnOff({ getDeviceTypes: () => [{ code: 0x010b }] }, features);
    expect(features[0]).to.deep.equal(buildOnOffFeature());
  });
});
