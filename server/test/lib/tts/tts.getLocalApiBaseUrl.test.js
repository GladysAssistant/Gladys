const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const os = require('os');

const { buildTts } = require('./testUtils.test');

describe('tts.getLocalApiBaseUrl', () => {
  // The os.networkInterfaces stub is restored after every test through this
  // file's own sandbox: restoring the DEFAULT sandbox would untrack the fakes
  // that other test files create at load time, so their cleanup would stop
  // clearing call history and every suite running after this file would leak
  // call counts between tests.
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
    sinon.restore();
  });

  it('should build the URL from the first non-internal IPv4 and SERVER_PORT', () => {
    const { tts } = buildTts();
    process.env.SERVER_PORT = '8080';
    sinon.stub(os, 'networkInterfaces').returns({
      lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
      eth0: [
        { family: 'IPv6', internal: false, address: 'fe80::1' },
        { family: 'IPv4', internal: false, address: '192.168.1.42' },
      ],
    });
    expect(tts.getLocalApiBaseUrl()).to.equal('http://192.168.1.42:8080');
  });

  it('should prefer the physical NIC over tunnels and Docker bridges on a multi-homed host', () => {
    const { tts } = buildTts();
    delete process.env.SERVER_PORT;
    sinon.stub(os, 'networkInterfaces').returns({
      // Docker bridges are never candidates: a speaker cannot fetch there
      docker0: [{ family: 'IPv4', internal: false, address: '172.17.0.1' }],
      'br-42ab': [{ family: 'IPv4', internal: false, address: '172.30.0.1' }],
      veth1a2b: [{ family: 'IPv4', internal: false, address: '172.18.0.1' }],
      // VPN tunnels enumerate first but only VPN peers can fetch there:
      // the home-LAN NIC is the address handed to speakers
      tun0: [{ family: 'IPv4', internal: false, address: '203.0.113.7' }],
      wg0: [{ family: 'IPv4', internal: false, address: '172.22.0.3' }],
      eth0: [{ family: 'IPv4', internal: false, address: '10.0.0.8' }],
    });
    expect(tts.getLocalApiBaseUrl()).to.equal('http://10.0.0.8:1443');
  });

  it('should fall back to a tunnel RFC1918 address when no physical NIC has one', () => {
    const { tts } = buildTts();
    delete process.env.SERVER_PORT;
    sinon.stub(os, 'networkInterfaces').returns({
      wg0: [{ family: 'IPv4', internal: false, address: '172.22.0.3' }],
      eth0: [{ family: 'IPv4', internal: false, address: '203.0.113.7' }],
    });
    expect(tts.getLocalApiBaseUrl()).to.equal('http://172.22.0.3:1443');
  });

  it('should fall back to the first non-internal IPv4 without any RFC1918 address', () => {
    const { tts } = buildTts();
    delete process.env.SERVER_PORT;
    sinon.stub(os, 'networkInterfaces').returns({
      // the Docker bridge stays excluded even as a last resort
      docker0: [{ family: 'IPv4', internal: false, address: '172.17.0.1' }],
      eth0: [{ family: 'IPv4', internal: false, address: '203.0.113.7' }],
    });
    expect(tts.getLocalApiBaseUrl()).to.equal('http://203.0.113.7:1443');
  });

  it('should fall back to localhost and the default port without an external IPv4', () => {
    const { tts } = buildTts();
    delete process.env.SERVER_PORT;
    sinon.stub(os, 'networkInterfaces').returns({
      lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
      empty: undefined,
    });
    expect(tts.getLocalApiBaseUrl()).to.equal('http://localhost:1443');
  });
});
