const { assert } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');

describe('zigbee2mqtt melody enumType', () => {
  const expose = {
    name: 'melody',
  };

  it('should write value', () => {
    const result = enumType.writeValue(expose, 1);
    assert.equal(result, 1);
  });

  it(`should read value`, () => {
    const result = enumType.readValue(expose, '1');
    assert.equal(result, 1);
  });
});
