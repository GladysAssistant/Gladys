const { expect } = require('chai');
const { transformBrightnessValue } = require('../../../../services/philips-hue/lib/utils/transformBrightnessValue');

describe('Transform Brightness Value', () => {
  it('should return min value', () => {
    expect(transformBrightnessValue(-1)).eq(1);
  });

  it('should return max value', () => {
    expect(transformBrightnessValue(102)).eq(254);
  });

  it('should return calculated value', () => {
    expect(transformBrightnessValue(50)).eq(127);
  });
});
