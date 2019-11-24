const { expect } = require('chai');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { generateDeviceState } = require('../../../../services/smartthings/lib/utils/generateDeviceState');

describe('SmartThings service - generateDeviceState', () => {
  it('no features', () => {
    const features = undefined;
    const states = generateDeviceState(features);

    expect(states).to.deep.eq([]);
  });

  it('category no matches', () => {
    const features = [
      {
        category: 'unknown',
        type: 'no type',
      },
    ];
    const states = generateDeviceState(features);

    expect(states).to.deep.eq([]);
  });

  it('type no matches', () => {
    const features = [
      {
        category: 'light',
        type: 'no type',
      },
    ];
    const states = generateDeviceState(features);

    expect(states).to.deep.eq([]);
  });
});
