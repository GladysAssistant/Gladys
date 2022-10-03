const { assert } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');
const { COVER_STATE } = require('../../../../utils/constants');

describe('zigbee2mqtt cover enumType', () => {
  const expose = {
    name: 'state',
    values: ['OPEN', 'CLOSE', 'STOP'],
  };

  [
    { enumValue: 'OPEN', intValue: COVER_STATE.OPEN },
    { enumValue: 'CLOSE', intValue: COVER_STATE.CLOSE },
    { enumValue: 'STOP', intValue: COVER_STATE.STOP },
  ].forEach((mapping) => {
    const { enumValue, intValue } = mapping;

    it(`should write ${enumValue} value as ${intValue} value`, () => {
      const result = enumType.writeValue(expose, intValue);
      assert.equal(result, enumValue);
    });

    it(`should read ${intValue} value as ${enumValue}`, () => {
      const result = enumType.readValue(expose, enumValue);
      assert.equal(result, intValue);
    });
  });

  it('should write undefined value on missing enum', () => {
    const missingEnumExpose = {
      values: ['OPEN', 'CLOSE'],
    };
    const result = enumType.writeValue(missingEnumExpose, COVER_STATE.STOP);
    assert.equal(result, undefined);
  });

  it('should write undefined value', () => {
    const result = enumType.writeValue(expose, 7);
    assert.equal(result, undefined);
  });

  it('should read enum value', () => {
    const result = enumType.readValue(expose, 'unknown');
    assert.equal(result, undefined);
  });
});
