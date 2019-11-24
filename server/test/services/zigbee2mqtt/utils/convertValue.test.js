const { expect } = require('chai');

const { convertValue } = require('../../../../services/zigbee2mqtt/utils/convertValue');

describe('Zigbee2mqtt - Utils - convertValue', () => {
  it('state feature, value ON', async () => {
    const result = convertValue('state', 'ON');
    expect(result).to.eq(1);
  });

  it('state feature, value OFF', async () => {
    const result = convertValue('state', 'OFF');
    expect(result).to.eq(0);
  });

  it('click feature, anyValue', async () => {
    const result = convertValue('click', 'anyValue');
    expect(result).to.eq('anyValue');
  });

  it('any feature, value 12', async () => {
    const result = convertValue('any', 12);
    expect(result).to.eq(12);
  });

  it('any feature, value abc', async () => {
    const result = convertValue('any', 'abc');
    expect(result).to.eq('abc');
  });

  it('any feature, value true', async () => {
    const result = convertValue('any', true);
    expect(result).to.eq(1);
  });

  it('any feature, value false', async () => {
    const result = convertValue('any', false);
    expect(result).to.eq(0);
  });
});
