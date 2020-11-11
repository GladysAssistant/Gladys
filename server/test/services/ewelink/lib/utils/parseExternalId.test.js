const { expect } = require('chai');
const { parseExternalId } = require('../../../../../services/ewelink/lib/utils/parseExternalId');

describe('eWeLink utils parseExternalId', () => {
  it('should return prefix, deviceId and channel', () => {
    const { prefix, deviceId, channel } = parseExternalId('ewelink:serial-number:1');
    expect(prefix).to.equal('ewelink');
    expect(deviceId).to.equal('serial-number');
    expect(channel).to.equal(1);
  });
});
