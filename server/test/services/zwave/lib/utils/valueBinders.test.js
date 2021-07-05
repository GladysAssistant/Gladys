const { expect } = require('chai');
const { transformValue, normalizeValue } = require('../../../../../services/zwave/lib/utils/valueBinders');

describe('zWave valueBinders Utils', () => {
  it('should transform a bool type into boolean', () => {
    expect(transformValue('bool', true)).equals(true);
    expect(transformValue('bool', false)).equals(false);
    expect(transformValue('bool', 0)).equals(false);
    expect(transformValue('bool', 1)).equals(true);
    expect(transformValue('bool', '0')).equals(false);
    expect(transformValue('bool', '1')).equals(true);
  });

  it('should transform the value as it for all others types', () => {
    expect(transformValue('anything-else', 10)).equals(10);
    expect(transformValue('anything-else', 10.0)).equals(10.0);
    expect(transformValue('anything-else', '10')).equals('10');
    const list = ['v1', 'v2', 'v3'];
    expect(transformValue('anything-else', list)).equals(list);
  });

  it('should normalize the value as it for all', () => {
    expect(normalizeValue('anything-else', 10)).equals(10);
    expect(normalizeValue('anything-else', 10.0)).equals(10.0);
    expect(normalizeValue('anything-else', '10')).equals('10');
    const list = ['v1', 'v2', 'v3'];
    expect(normalizeValue('anything-else', list)).equals(list);
  });
});
