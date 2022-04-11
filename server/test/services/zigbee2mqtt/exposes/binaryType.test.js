const { assert } = require('chai');

const binaryType = require('../../../../services/zigbee2mqtt/exposes/binaryType');

describe('zigbee2mqtt binaryType', () => {
  const expose = {
    value_on: 'ON',
    value_off: 7,
  };

  it('should write 1 value', () => {
    const result = binaryType.writeValue(expose, 1);
    assert.equal(result, 'ON');
  });

  it('should write 0 value', () => {
    const result = binaryType.writeValue(expose, 0);
    assert.equal(result, 7);
  });

  it('should read 1 value', () => {
    const result = binaryType.readValue(expose, 'ON');
    assert.equal(result, 1);
  });

  it('should read 0 value', () => {
    const result = binaryType.readValue(expose, 7);
    assert.equal(result, 0);
  });

  it('should read unknown value', () => {
    const result = binaryType.readValue(expose, 'unknown');
    assert.equal(result, undefined);
  });
});
