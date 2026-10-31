const { expect } = require('chai');

const {
  MATTER_LIGHT_DEVICE_TYPE,
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
    expect(isLightEndpoint({ getDeviceTypes: () => undefined }, [{ category: 'light', type: 'color' }])).to.equal(
      true,
    );
  });

  it('should not take a plug for a light', () => {
    const device = { getDeviceTypes: () => [{ code: 0x010a }] };
    expect(isLightEndpoint(device, [buildOnOffFeature()])).to.equal(false);
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
});
