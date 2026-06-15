const { expect } = require('chai');
const nock = require('nock');
const dns = require('dns');
const { stub } = require('sinon');
const {
  fetchWebPage,
  htmlToText,
  isPrivateOrLocalIp,
  assertPublicUrl,
} = require('../../../../services/mcp/lib/webRequest');

describe('webRequest', () => {
  let lookupStub;

  beforeEach(() => {
    lookupStub = stub(dns.promises, 'lookup').resolves([{ address: '93.184.216.34', family: 4 }]);
  });

  afterEach(() => {
    lookupStub.restore();
    nock.cleanAll();
  });

  it('should detect private and local IP addresses', () => {
    expect(isPrivateOrLocalIp('127.0.0.1')).to.equal(true);
    expect(isPrivateOrLocalIp('10.0.0.5')).to.equal(true);
    expect(isPrivateOrLocalIp('192.168.1.10')).to.equal(true);
    expect(isPrivateOrLocalIp('::1')).to.equal(true);
    expect(isPrivateOrLocalIp('8.8.8.8')).to.equal(false);
  });

  it('should convert HTML to readable text', () => {
    const text = htmlToText('<html><body><h1>Pool</h1><p>Status: <strong>open</strong></p></body></html>');
    expect(text).to.include('Pool');
    expect(text).to.include('Status: open');
    expect(text).to.not.include('<strong>');
  });

  it('should reject local and private URLs', async () => {
    await expect(assertPublicUrl('http://localhost/status')).to.be.rejectedWith(
      'Requests to local addresses are not allowed',
    );
    await expect(assertPublicUrl('http://127.0.0.1/status')).to.be.rejectedWith(
      'Requests to private or local network addresses are not allowed',
    );
    await expect(assertPublicUrl('ftp://example.com')).to.be.rejectedWith('Only HTTP and HTTPS URLs are allowed');
  });

  it('should reject URLs that resolve to private addresses', async () => {
    lookupStub.restore();
    const privateLookupStub = stub(dns.promises, 'lookup').resolves([{ address: '192.168.1.20', family: 4 }]);

    try {
      await expect(assertPublicUrl('https://pool.example.com')).to.be.rejectedWith(
        'Requests to private or local network addresses are not allowed',
      );
    } finally {
      privateLookupStub.restore();
    }
  });

  it('should fetch a public page and return extracted text', async () => {
    nock('http://pool.example.com')
      .get('/hours')
      .reply(200, '<html><body><p>Today: pool is open</p></body></html>', {
        'Content-Type': 'text/html; charset=utf-8',
      });

    const text = await fetchWebPage({ url: 'http://pool.example.com/hours' });
    expect(text).to.equal('Today: pool is open');
  });

  it('should follow redirects when the target remains public', async () => {
    nock('http://pool.example.com').get('/old').reply(302, undefined, { Location: '/new' });
    nock('http://pool.example.com')
      .get('/new')
      .reply(200, '<html><body><p>Redirected page</p></body></html>', { 'Content-Type': 'text/html' });

    const text = await fetchWebPage({ url: 'http://pool.example.com/old' });
    expect(text).to.equal('Redirected page');
  });

  it('should surface HTTP errors', async () => {
    nock('http://pool.example.com').get('/missing').reply(404, 'Not found');

    await expect(fetchWebPage({ url: 'http://pool.example.com/missing' })).to.be.rejectedWith('HTTP 404');
  });
});
