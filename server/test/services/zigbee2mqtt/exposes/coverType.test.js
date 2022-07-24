const { assert } = require('chai');

const coverType = require('../../../../services/zigbee2mqtt/exposes/coverType');
const { COVER_STATE } = require('../../../../utils/constants');

describe('zigbee2mqtt coverType', () => {
  const expose = {
    values: ['OPEN', 'CLOSE', 'STOP'],
  };

  [
    { enumValue: 'OPEN', intValue: COVER_STATE.OPEN },
    { enumValue: 'CLOSE', intValue: COVER_STATE.CLOSE },
    { enumValue: 'STOP', intValue: COVER_STATE.STOP },
  ].forEach((mapping) => {
    const { enumValue, intValue } = mapping;

    it(`should write ${enumValue} value as ${intValue} value`, () => {
      const result = coverType.writeValue(expose, intValue);
      assert.equal(result, enumValue);
    });

    it(`should read ${intValue} value as ${enumValue}`, () => {
      const result = coverType.readValue(expose, enumValue);
      assert.equal(result, intValue);
    });
  });

  it('should write undefined value on missing enum', () => {
    const missingEnumExpose = {
      values: ['OPEN', 'CLOSE'],
    };
    const result = coverType.writeValue(missingEnumExpose, COVER_STATE.STOP);
    assert.equal(result, undefined);
  });

  it('should write undefined value', () => {
    const result = coverType.writeValue(expose, 7);
    assert.equal(result, undefined);
  });

  it('should read enum value', () => {
    const result = coverType.readValue(expose, 'unknown');
    assert.equal(result, undefined);
  });
});
