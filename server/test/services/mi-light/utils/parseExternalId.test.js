const { expect } = require('chai');
const { parseExternalId } = require('../../../../services/mi-light/lib/utils/parseExternalId');

describe('parseExternalId', () => {
  it('should return zoneId and bridge mac', () => {
    const { bridgeMac, zoneId } = parseExternalId('mi-light-light:001b44113ab7:1');
    expect(bridgeMac).to.equal('001b44113ab7');
    expect(zoneId).to.equal('1');
  });
});
