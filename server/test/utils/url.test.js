const { expect } = require('chai');
const { isURL, validateUrl } = require('../../utils/url');

describe('url.validation', () => {
  it('should return true for a valid url', () => {
    const url = 'https://example.com';
    expect(isURL(url)).to.equal(true);
  });

  it('should return false for an invalid url', () => {
    const url = '/a/b';
    expect(isURL(url)).to.equal(false);
  });

  it('should return valid url', () => {
    const url = 'https://example.com/test';
    expect(validateUrl(url)).to.be.equal('https://example.com/test');
  });

  it('should throw an error for malicious url', () => {
    const url = 'https://example.com/test?#a';
    expect(() => {
      validateUrl(url);
    }).to.throw(Error);
  });
});
