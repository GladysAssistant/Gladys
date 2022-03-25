const { expect } = require('chai');
const {
  type,
  readValue,
  writeValue,
  getFeatureAttributes,
} = require('../../../../../../../services/tuya/lib/device/feature/type/tuya.integer');

describe('Tuya integer feature type', () => {
  it('check type', () => {
    expect(type).to.eq('Integer');
  });

  it('read value from Tuya device', () => {
    const tuyaValue = 126;
    const gladysValue = readValue(tuyaValue);
    expect(gladysValue).to.eq(tuyaValue);
  });

  it('write value to Tuya device', () => {
    const gladysValue = 126;
    const tuyaValue = writeValue(gladysValue);
    expect(tuyaValue).to.eq(gladysValue);
  });

  it('get feature attributes', () => {
    const tuyaValues = { min: 25, scale: 0, unit: '', max: 255, step: 1 };
    const feature = getFeatureAttributes(tuyaValues);
    expect(feature).to.deep.eq({ min: 25, max: 255, unit: null });
  });
});
