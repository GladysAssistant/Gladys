const { assert } = require('chai');

const numericType = require('../../../../services/zigbee2mqtt/exposes/numericType');

describe('zigbee2mqtt numericType', () => {
  it('should write value', () => {
    const result = numericType.writeValue(null, 17);
    assert.equal(result, 17);
  });

  it('should read value', () => {
    const result = numericType.readValue(null, 17);
    assert.equal(result, 17);
  });
});
