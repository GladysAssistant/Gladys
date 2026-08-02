const { expect } = require('chai');
const sinon = require('sinon');
const os = require('os');

const { buildTts } = require('./testUtils.test');

describe('tts.getLocalApiBaseUrl', () => {
  // Use a dedicated sandbox for the os.networkInterfaces stub: calling
  // sinon.restore() on the DEFAULT sandbox would untrack the fakes that other
  // test files create at load time, so their sinon.reset() cleanup would stop
  // clearing call history and every suite running after this file would leak
  // call counts between tests (same pattern as test/models/index.test.js).
  const sandbox = sinon.createSandbox();
  let previousServerPort;

  beforeEach(() => {
    previousServerPort = process.env.SERVER_PORT;
  });

  afterEach(() => {
    if (previousServerPort === undefined) {
      delete process.env.SERVER_PORT;
    } else {
      process.env.SERVER_PORT = previousServerPort;
    }
    sandbox.restore();
  });

  it('should build the URL from the first non-internal IPv4 and SERVER_PORT', () => {
    const { tts } = buildTts();
    process.env.SERVER_PORT = '8080';
    sandbox.stub(os, 'networkInterfaces').returns({
      lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
      eth0: [
        { family: 'IPv6', internal: false, address: 'fe80::1' },
        { family: 'IPv4', internal: false, address: '192.168.1.42' },
      ],
    });
    expect(tts.getLocalApiBaseUrl()).to.equal('http://192.168.1.42:8080');
  });

  it('should prefer an RFC1918 address on a multi-homed host', () => {
    const { tts } = buildTts();
    delete process.env.SERVER_PORT;
    sandbox.stub(os, 'networkInterfaces').returns({
      // a VPN tunnel with a public address enumerates first: the home-LAN
      // RFC1918 address is still the one handed to speakers
      tun0: [{ family: 'IPv4', internal: false, address: '203.0.113.7' }],
      wg0: [{ family: 'IPv4', internal: false, address: '172.22.0.3' }],
      eth0: [{ family: 'IPv4', internal: false, address: '10.0.0.8' }],
    });
    expect(tts.getLocalApiBaseUrl()).to.equal('http://172.22.0.3:1443');
  });

  it('should fall back to the first non-internal IPv4 without any RFC1918 address', () => {
    const { tts } = buildTts();
    delete process.env.SERVER_PORT;
    sandbox.stub(os, 'networkInterfaces').returns({
      eth0: [{ family: 'IPv4', internal: false, address: '203.0.113.7' }],
    });
    expect(tts.getLocalApiBaseUrl()).to.equal('http://203.0.113.7:1443');
  });

  it('should fall back to localhost and the default port without an external IPv4', () => {
    const { tts } = buildTts();
    delete process.env.SERVER_PORT;
    sandbox.stub(os, 'networkInterfaces').returns({
      lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
      empty: undefined,
    });
    expect(tts.getLocalApiBaseUrl()).to.equal('http://localhost:1443');
  });
});
