const { expect } = require('chai');
const sinon = require('sinon');
const os = require('os');

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
