const { expect } = require('chai');
const { getBatteryPercent } = require('../../../services/xiaomi/lib/utils/getBatteryPercent');

describe('xiaomi getBatteryPercent', () => {
  it('should return 0 below the minimum voltage', () => {
    expect(getBatteryPercent(2700, 2800, 3300)).to.equal(0);
  });

  it('should return 100 at or above the maximum voltage', () => {
    expect(getBatteryPercent(3300, 2800, 3300)).to.equal(100);
    expect(getBatteryPercent(3299, 2800, 3300)).to.equal(100);
  });

  it('should return higher percent for higher voltage', () => {
    // 3200mV is 80% of the way from 2800mV to 3300mV
    expect(getBatteryPercent(3200, 2800, 3300)).to.equal(80);
    // 3000mV is 40% of the way from 2800mV to 3300mV
    expect(getBatteryPercent(3000, 2800, 3300)).to.equal(40);
  });
});
