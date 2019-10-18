const { expect } = require('chai');
const { parseExternalId } = require('../../../../services/philips-hue/lib/utils/parseExternalId');

describe('parseExternalId', () => {
  it('should return lightId and bridge serial number', () => {
    const { bridgeSerialNumber, lightId } = parseExternalId('philips-hue-light:serial-number:1');
    expect(bridgeSerialNumber).to.equal('serial-number');
    expect(lightId).to.equal(1);
  });
});
