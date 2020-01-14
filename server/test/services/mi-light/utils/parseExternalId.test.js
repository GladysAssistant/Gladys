const { expect } = require('chai');
const { parseExternalId } = require('../../../../services/mi-light/lib/utils/parseExternalId');

describe('parseExternalId', () => {
  it('should return zoneId and bridge mac', () => {
    const { bridgeMac, zoneId } = parseExternalId('mi-light-light:mac:1');
    expect(bridgeMac).to.equal('mac');
    expect(zoneId).to.equal(1);
  });
});
