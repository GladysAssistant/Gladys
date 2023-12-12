const { expect } = require('chai');

const onlineParam = require('../../../../../services/ewelink/lib/params/online.param');

describe('eWeLink online param', () => {
  it('should return 1 if device is online', () => {
    const value = onlineParam.convertValue(true);
    expect(value).to.equal('1');
  });

  it('should return 0 if device is offline', () => {
    const value = onlineParam.convertValue(false);
    expect(value).to.equal('0');
  });
});
