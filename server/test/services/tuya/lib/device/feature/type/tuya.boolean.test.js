const { expect } = require('chai');
const {
  type,
  readValue,
  writeValue,
  getFeatureAttributes,
} = require('../../../../../../../services/tuya/lib/device/feature/type/tuya.boolean');

describe('Tuya boolean feature type', () => {
  it('check type', () => {
    expect(type).to.eq('Boolean');
  });

  it('read true value from Tuya device', () => {
    const tuyaValue = true;
    const gladysValue = readValue(tuyaValue);
    expect(gladysValue).to.eq(1);
  });

  it('read false value from Tuya device', () => {
    const tuyaValue = false;
    const gladysValue = readValue(tuyaValue);
    expect(gladysValue).to.eq(0);
  });

  it('write 1 value to Tuya device', () => {
    const gladysValue = 1;
    const tuyaValue = writeValue(gladysValue);
    expect(tuyaValue).to.eq(true);
  });

  it('write 0 value to Tuya device', () => {
    const gladysValue = 0;
    const tuyaValue = writeValue(gladysValue);
    expect(tuyaValue).to.eq(false);
  });

  it('get feature attributes', () => {
    const feature = getFeatureAttributes();
    expect(feature).to.deep.eq({ min: 0, max: 1 });
  });
});
