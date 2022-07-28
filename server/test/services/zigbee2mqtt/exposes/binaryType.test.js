const { assert } = require('chai');

const binaryType = require('../../../../services/zigbee2mqtt/exposes/binaryType');

describe('zigbee2mqtt binaryType', () => {
  const expose = {
    name: 'state',
    value_on: 'ON',
    value_off: 7,
  };
  const reversedExpose = {
    name: 'contact',
    value_on: 'ON',
    value_off: 'OFF',
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

  it('should write 1 value on reversed expose', () => {
    const result = binaryType.writeValue(reversedExpose, 1);
    assert.equal(result, 'OFF');
  });

  it('should write 0 value on reversed expose', () => {
    const result = binaryType.writeValue(reversedExpose, 0);
    assert.equal(result, 'ON');
  });

  it('should read 1 value on reversed expose', () => {
    const result = binaryType.readValue(reversedExpose, 'ON');
    assert.equal(result, 0);
  });

  it('should read 0 value on reversed expose', () => {
    const result = binaryType.readValue(reversedExpose, 'OFF');
    assert.equal(result, 1);
  });

  it('should read unknown value', () => {
    const result = binaryType.readValue(expose, 'unknown');
    assert.equal(result, undefined);
  });
});
