const { expect } = require('chai');
const nock = require('nock');
const dns = require('dns');
const { stub } = require('sinon');

const axios = require('../../../../services/mcp/node_modules/axios');
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
    expect(isPrivateOrLocalIp('172.16.0.1')).to.equal(true);
    expect(isPrivateOrLocalIp('192.168.1.10')).to.equal(true);
    expect(isPrivateOrLocalIp('169.254.0.1')).to.equal(true);
    expect(isPrivateOrLocalIp('0.0.0.0')).to.equal(true);
    expect(isPrivateOrLocalIp('::1')).to.equal(true);
    expect(isPrivateOrLocalIp('fc00::1')).to.equal(true);
    expect(isPrivateOrLocalIp('fd12::1')).to.equal(true);
    expect(isPrivateOrLocalIp('fe80::1')).to.equal(true);
    expect(isPrivateOrLocalIp('8.8.8.8')).to.equal(false);
    expect(isPrivateOrLocalIp('2001:db8::1')).to.equal(false);
    expect(isPrivateOrLocalIp('not-an-ip')).to.equal(false);
  });

  it('should convert HTML to readable text', () => {
    const text = htmlToText('<html><body><h1>Pool</h1><p>Status: <strong>open</strong></p></body></html>');
    expect(text).to.include('Pool');
    expect(text).to.include('Status: open');
    expect(text).to.not.include('<strong>');
  });

  it('should reject invalid, local and private URLs', async () => {
    await expect(assertPublicUrl('not-a-url')).to.be.rejectedWith('Invalid URL');
    await expect(assertPublicUrl('http://localhost/status')).to.be.rejectedWith(
      'Requests to local addresses are not allowed',
    );
    await expect(assertPublicUrl('http://app.localhost/status')).to.be.rejectedWith(
      'Requests to local addresses are not allowed',
    );
    await expect(assertPublicUrl('http://127.0.0.1/status')).to.be.rejectedWith(
      'Requests to private or local network addresses are not allowed',
    );
    await expect(assertPublicUrl('ftp://example.com')).to.be.rejectedWith('Only HTTP and HTTPS URLs are allowed');
    await expect(assertPublicUrl('http://user:pass@example.com')).to.be.rejectedWith(
      'URLs with credentials are not allowed',
    );
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

  it('should return plain text responses without HTML conversion', async () => {
    nock('http://pool.example.com')
      .get('/status.txt')
      .reply(200, '  open now  ', {
        'Content-Type': 'text/plain',
      });

    const text = await fetchWebPage({ url: 'http://pool.example.com/status.txt' });
    expect(text).to.equal('open now');
  });

  it('should return an empty string for empty responses', async () => {
    nock('http://pool.example.com')
      .get('/empty')
      .reply(200, '', { 'Content-Type': 'text/plain' });

    const text = await fetchWebPage({ url: 'http://pool.example.com/empty' });
    expect(text).to.equal('');
  });

  it('should truncate very long responses', async () => {
    nock('http://pool.example.com')
      .get('/long')
      .reply(200, 'x'.repeat(13_000), { 'Content-Type': 'text/plain' });

    const text = await fetchWebPage({ url: 'http://pool.example.com/long' });
    expect(text).to.include('... (truncated)');
    expect(text.length).to.be.below(13_000);
  });

  it('should follow redirects when the target remains public', async () => {
    nock('http://pool.example.com')
      .get('/old')
      .reply(302, undefined, { Location: '/new' });
    nock('http://pool.example.com')
      .get('/new')
      .reply(200, '<html><body><p>Redirected page</p></body></html>', { 'Content-Type': 'text/html' });

    const text = await fetchWebPage({ url: 'http://pool.example.com/old' });
    expect(text).to.equal('Redirected page');
  });

  it('should surface HTTP and redirect errors', async () => {
    nock('http://pool.example.com')
      .get('/missing')
      .reply(404, 'Not found');
    await expect(fetchWebPage({ url: 'http://pool.example.com/missing' })).to.be.rejectedWith('HTTP 404');

    nock('http://pool.example.com')
      .get('/redirect')
      .reply(302, undefined, {});
    await expect(fetchWebPage({ url: 'http://pool.example.com/redirect' })).to.be.rejectedWith(
      'Redirect response without Location header',
    );

    nock('http://pool.example.com')
      .get('/r1')
      .reply(302, undefined, { Location: '/r2' });
    nock('http://pool.example.com')
      .get('/r2')
      .reply(302, undefined, { Location: '/r3' });
    nock('http://pool.example.com')
      .get('/r3')
      .reply(302, undefined, { Location: '/r4' });
    nock('http://pool.example.com')
      .get('/r4')
      .reply(302, undefined, { Location: '/r5' });
    await expect(fetchWebPage({ url: 'http://pool.example.com/r1' })).to.be.rejectedWith('Too many redirects');
  });

  it('should surface axios network errors', async () => {
    const getStub = stub(axios, 'get');
    getStub.onCall(0).rejects({ code: 'ECONNABORTED' });
    getStub.onCall(1).rejects(new Error('maxContentLength size of 1 exceeded'));
    getStub.onCall(2).rejects(new Error('network down'));

    try {
      await expect(fetchWebPage({ url: 'http://pool.example.com/timeout' })).to.be.rejectedWith(
        'Request timed out after',
      );
      await expect(fetchWebPage({ url: 'http://pool.example.com/large' })).to.be.rejectedWith('Response too large');
      await expect(fetchWebPage({ url: 'http://pool.example.com/down' })).to.be.rejectedWith('network down');
    } finally {
      getStub.restore();
    }
  });
});
