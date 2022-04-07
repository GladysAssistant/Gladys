const { assert } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');

describe('zigbee2mqtt enumType', () => {
  const expose = {
    values: ['SINGLE', 'LONG', 'SHORT', 'DOUBLE', 'TRIPLE'],
  };

  it('should write enum value', () => {
    const result = enumType.writeValue(expose, 2);
    assert.equal(result, 'SHORT');
  });

  it('should read enum value', () => {
    const result = enumType.readValue(expose, 'DOUBLE');
    assert.equal(result, 3);
  });
});
