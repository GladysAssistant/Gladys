const { assert } = require('chai');

const numericType = require('../../../../services/zigbee2mqtt/exposes/numericType');

describe('zigbee2mqtt numericType', () => {
  it('should write value', () => {
    const expose = {};
    const result = numericType.writeValue(expose, 17);
    assert.equal(result, 17);
  });

  it('should read value', () => {
    const expose = {};
    const result = numericType.readValue(expose, 17);
    assert.equal(result, 17);
  });

  it('should read linkquality value', () => {
    const expose = { name: 'linkquality' };
    const result = numericType.readValue(expose, 102);
    assert.equal(result, 2);
  });
});
