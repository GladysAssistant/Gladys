const { expect } = require('chai');
const { parseExternalId } = require('../../../../services/tp-link/lib/utils/parseExternalId');

describe('parseExternalId', () => {
  it('should return deviceId', () => {
    const deviceId = parseExternalId('tp-link:A2E4B5');
    expect(deviceId).to.equal('A2E4B5');
  });
});
