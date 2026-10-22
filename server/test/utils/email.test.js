const { expect } = require('chai');
const { normalizeEmail } = require('../../utils/email');
const { BadParameters } = require('../../utils/coreErrors');

describe('normalizeEmail', () => {
  it('should lower case the email', () => {
    expect(normalizeEmail('Tony.Stark@GladysAssistant.com')).to.equal('tony.stark@gladysassistant.com');
  });
  it('should remove surrounding spaces', () => {
    expect(normalizeEmail('  tony.stark@gladysassistant.com ')).to.equal('tony.stark@gladysassistant.com');
  });
  it('should reject a value which is not a string', () => {
    expect(() => normalizeEmail(undefined)).to.throw(BadParameters, 'Email must be a string');
    expect(() => normalizeEmail(['demo@demo.com', 'Demo@Demo.com'])).to.throw(BadParameters);
  });
});
