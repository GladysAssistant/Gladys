const { expect } = require('chai');
const { normalizeEmail } = require('../../utils/email');

describe('normalizeEmail', () => {
  it('should lower case the email', () => {
    expect(normalizeEmail('Tony.Stark@GladysAssistant.com')).to.equal('tony.stark@gladysassistant.com');
  });
  it('should remove surrounding spaces', () => {
    expect(normalizeEmail('  tony.stark@gladysassistant.com ')).to.equal('tony.stark@gladysassistant.com');
  });
  it('should return a value which is not a string untouched', () => {
    expect(normalizeEmail(undefined)).to.equal(undefined);
    expect(normalizeEmail(null)).to.equal(null);
  });
});
