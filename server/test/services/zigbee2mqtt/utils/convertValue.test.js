const { assert } = require('chai');
const { BUTTON_STATUS } = require('../../../../utils/constants');
const { convertValue } = require('../../../../services/zigbee2mqtt/utils/convertValue');
const { DEVICE } = require('../../../../services/zigbee2mqtt/lib/constants');

describe('zigbee2mqtt convertValue', () => {
  it('should return binary 1 from device parameters', () => {
    const property = 'property';
    const result = convertValue(
      { params: [{ name: `${DEVICE.PARAM_PREFIX}${property}`, value: '{"ON": 1}' }] },
      'binary',
      property,
      'ON',
    );
    return assert.deepEqual(result, 1);
  });
  it('should return binary 1 fallback device parameters', () => {
    const property = 'property';
    const result = convertValue(
      { params: [{ name: `${DEVICE.PARAM_PREFIX}${property}`, value: '{"OFF": 0}' }] },
      'binary',
      property,
      'ON',
    );
    return assert.deepEqual(result, 1);
  });
  it('should return binary 1 on non parsable parameter', () => {
    const property = 'property';
    const result = convertValue(
      { params: [{ name: `${DEVICE.PARAM_PREFIX}${property}`, value: 'NOT_JSON' }] },
      'binary',
      property,
      'ON',
    );
    return assert.deepEqual(result, 1);
  });
  it('should return binary 1', () => {
    const result = convertValue({}, 'binary', 'property', 'ON');
    return assert.deepEqual(result, 1);
  });
  it('should return binary 0', () => {
    const result = convertValue({}, 'binary', 'property', 'OFF');
    return assert.deepEqual(result, 0);
  });
  it('should return color 16711680', () => {
    const result = convertValue({}, 'color', 'property', { x: 0.701, y: 0.299 });
    return assert.deepEqual(result, 16711680);
  });
  it('should return simple click state', () => {
    const result = convertValue({}, 'click', 'property', 'single');
    return assert.deepEqual(result, BUTTON_STATUS.CLICK);
  });
  it('should return double click state', () => {
    const result = convertValue({}, 'click', 'property', 'double');
    return assert.deepEqual(result, BUTTON_STATUS.DOUBLE_CLICK);
  });
  it('should return hold click state', () => {
    const result = convertValue({}, 'click', 'property', 'hold');
    return assert.deepEqual(result, BUTTON_STATUS.LONG_CLICK);
  });
  it('should return default click state', () => {
    const result = convertValue({}, 'click', 'property', 'unknown');
    return assert.deepEqual(result, 'unknown');
  });
  it('should return unknown feature boolean true', () => {
    const result = convertValue({}, 'unknown feature', 'property', true);
    return assert.deepEqual(result, 1);
  });
  it('should return unknown feature boolean false', () => {
    const result = convertValue({}, 'unknown feature', 'property', false);
    return assert.deepEqual(result, 0);
  });
  it('should return unknown feature number', () => {
    const result = convertValue({}, 'unknown feature', 'property', 4);
    return assert.deepEqual(result, 4);
  });
  it('should throw exception on string value', () => {
    assert.throw(
      () => convertValue({}, 'unknown feature', 'property', 'closed'),
      Error,
      `Zigbee2mqqt don't handle value "closed" for feature "unknown feature".`,
    );
  });
  it('should throw Exception', () => {
    assert.throw(
      () => {
        convertValue({}, 'unknown feature', 'property', null);
      },
      Error,
      `Zigbee2mqqt don't handle value "null" for feature "unknown feature".`,
    );
  });
});
