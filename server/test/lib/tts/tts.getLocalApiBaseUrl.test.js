const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const os = require('os');

const { fake } = sinon;

const logger = require('../../../utils/logger');
const { buildTts } = require('./testUtils.test');

describe('tts.getLocalApiBaseUrl', () => {
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

  it('should build the URL from the LAN IPv4 and SERVER_PORT', async () => {
    const { tts } = buildTts();
    process.env.SERVER_PORT = '8080';
    sinon.stub(os, 'networkInterfaces').returns({
      lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
      eth0: [
        { family: 'IPv6', internal: false, address: 'fe80::1' },
        { family: 'IPv4', internal: false, address: '192.168.1.42' },
      ],
    });
    expect(await tts.getLocalApiBaseUrl()).to.equal('http://192.168.1.42:8080');
  });

  it('should accept the numeric IPv4 family some Node versions report', async () => {
    const { tts } = buildTts();
    delete process.env.SERVER_PORT;
    sinon.stub(os, 'networkInterfaces').returns({
      lo: [{ family: 4, internal: true, address: '127.0.0.1' }],
      wlan0: [{ family: 4, internal: false, address: '192.168.1.51' }],
    });
    expect(await tts.getLocalApiBaseUrl()).to.equal('http://192.168.1.51:1443');
  });

  it('should prefer the physical NIC over tunnels and Docker bridges on a multi-homed host', async () => {
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
    expect(await tts.getLocalApiBaseUrl()).to.equal('http://10.0.0.8:1443');
  });

  it('should warn when Gladys runs behind a Docker bridge, and still mint the URL', async () => {
    const { tts } = buildTts({ system: { isOnHostNetwork: fake.resolves(false) } });
    delete process.env.SERVER_PORT;
    const warn = sinon.stub(logger, 'warn');
    sinon.stub(os, 'networkInterfaces').returns({
      eth0: [{ family: 'IPv4', internal: false, address: '172.17.0.2', mac: '02:42:ac:11:00:02' }],
    });
    expect(await tts.getLocalApiBaseUrl()).to.equal('http://172.17.0.2:1443');
    sinon.assert.calledOnce(warn);
    sinon.assert.calledWithMatch(warn, /Docker bridge/);
  });

  it('should fall back to localhost and the default port without any LAN IPv4', async () => {
    const { tts } = buildTts();
    delete process.env.SERVER_PORT;
    sinon.stub(os, 'networkInterfaces').returns({
      lo: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }],
      docker0: [{ family: 'IPv4', internal: false, address: '172.17.0.1' }],
    });
    expect(await tts.getLocalApiBaseUrl()).to.equal('http://localhost:1443');
  });
});
