const { expect } = require('chai');
const {
  type,
  readValue,
  writeValue,
  getFeatureAttributes,
} = require('../../../../../../../services/tuya/lib/device/feature/type/tuya.enum');

describe('Tuya enum feature type', () => {
  it('check type', () => {
    expect(type).to.eq('Enum');
  });

  it('read white value from Tuya device', () => {
    const tuyaValue = 'white';
    const tuyaValues = { range: ['white', 'colour', 'another'] };
    const gladysValue = readValue(tuyaValue, tuyaValues);
    expect(gladysValue).to.eq(0);
  });

  it('read colour value from Tuya device', () => {
    const tuyaValue = 'colour';
    const tuyaValues = { range: ['white', 'colour', 'another'] };
    const gladysValue = readValue(tuyaValue, tuyaValues);
    expect(gladysValue).to.eq(1);
  });

  it('write 0 value from Tuya device', () => {
    const tuyaValues = { range: ['white', 'colour', 'another'] };
    const tuyaValue = writeValue(0, tuyaValues);
    expect(tuyaValue).to.eq('white');
  });

  it('write 1 value from Tuya device', () => {
    const tuyaValues = { range: ['white', 'colour', 'another'] };
    const tuyaValue = writeValue(1, tuyaValues);
    expect(tuyaValue).to.eq('colour');
  });

  it('get feature attributes', () => {
    const feature = getFeatureAttributes({ range: ['white', 'colour', 'another'] });
    expect(feature).to.deep.eq({ min: 0, max: 2 });
  });
});
