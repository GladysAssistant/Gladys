const { expect } = require('chai');
const { parseOrigin } = require('../../utils/origin');

describe('parseOrigin', () => {
  it('should return the canonical origin', () => {
    expect(parseOrigin('http://localhost:1444')).to.equal('http://localhost:1444');
    expect(parseOrigin('https://gladys.example.com')).to.equal('https://gladys.example.com');
    expect(parseOrigin('http://192.168.1.10:1443')).to.equal('http://192.168.1.10:1443');
  });
  it('should canonicalize case, default port and trailing slash', () => {
    expect(parseOrigin('HTTP://Gladys.Local:80/')).to.equal('http://gladys.local');
    expect(parseOrigin('https://gladys.example.com:443/')).to.equal('https://gladys.example.com');
  });
  it('should return null for a non-string or empty value', () => {
    expect(parseOrigin(undefined)).to.equal(null);
    expect(parseOrigin(null)).to.equal(null);
    expect(parseOrigin('')).to.equal(null);
    expect(parseOrigin({ origin: 'http://localhost' })).to.equal(null);
  });
  it('should return null for a value that is not a URL', () => {
    expect(parseOrigin('not an origin')).to.equal(null);
    expect(parseOrigin('localhost:1444')).to.equal(null);
  });
  it('should return null for a non http(s) scheme', () => {
    // eslint-disable-next-line no-script-url
    expect(parseOrigin('javascript:alert(1)')).to.equal(null);
    expect(parseOrigin('file:///etc/passwd')).to.equal(null);
    expect(parseOrigin('ftp://gladys.local')).to.equal(null);
  });
  it('should return null when the value is more than a bare origin', () => {
    expect(parseOrigin('http://gladys.local/reset-password')).to.equal(null);
    expect(parseOrigin('http://gladys.local/?token=x')).to.equal(null);
    expect(parseOrigin('http://gladys.local/#hash')).to.equal(null);
    expect(parseOrigin('http://user:pass@gladys.local')).to.equal(null);
    expect(parseOrigin('http://attacker.com\\@gladys.local')).to.equal(null);
  });
});
