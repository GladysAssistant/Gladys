const { assert } = require('chai');
const { convertValue } = require('../../../../services/zigbee2mqtt/utils/convertValue');

describe('zigbee2mqtt convertValue', () => {
  it('should return binary 1', () => {
    const result = convertValue('binary', 'ON');
    return assert.deepEqual(result, 1);
  });
  it('should return binary 0', () => {
    const result = convertValue('binary', 'OFF');
    return assert.deepEqual(result, 0);
  });
  it('should return click state', () => {
    const result = convertValue('click', 1);
    return assert.deepEqual(result, 1);
  });
  it('should return unknown feature boolean true', () => {
    const result = convertValue('unknown feature', true);
    return assert.deepEqual(result, 1);
  });
  it('should return unknown feature boolean false', () => {
    const result = convertValue('unknown feature', false);
    return assert.deepEqual(result, 0);
  });
  it('should return unknown feature number', () => {
    const result = convertValue('unknown feature', 4);
    return assert.deepEqual(result, 4);
  });
  it('should return unknown feature string', () => {
    const result = convertValue('unknown feature', 'closed');
    return assert.equal(result, 'closed');
  });
  it('should throw Exception', () => {
    assert.throw(
      () => {
        convertValue('unknown feature', null);
      },
      Error,
      `Zigbee2mqqt don't handle value "null" for feature "unknown feature".`,
    );
  });
});