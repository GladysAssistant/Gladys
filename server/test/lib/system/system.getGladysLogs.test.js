const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const DockerodeMock = require('./DockerodeMock.test');

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
});
const Job = require('../../../lib/job');

const { demuxDockerLogs, MAX_LOG_LINES } = require('../../../lib/system/system.getGladysLogs');

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.resolves(null),
};

const job = new Job(event);

const config = {
  tempFolder: '/tmp/gladys',
};

/**
 * @description Build a Docker multiplexed log frame.
 * @param {number} streamType - 1 = stdout, 2 = stderr.
 * @param {string} payload - Payload string.
 * @returns {Buffer} Buffer.
 * @example
 * buildFrame(1, 'hello\n');
 */
function buildFrame(streamType, payload) {
  const payloadBuffer = Buffer.from(payload, 'utf8');
  const header = Buffer.alloc(8);
  header[0] = streamType;
  header.writeUInt32BE(payloadBuffer.length, 4);
  return Buffer.concat([header, payloadBuffer]);
}

describe('system.getGladysLogs', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('demuxDockerLogs should demultiplex multiplexed Docker frames', () => {
    const buffer = Buffer.concat([buildFrame(1, 'hello\n'), buildFrame(2, 'world\n')]);
    const result = demuxDockerLogs(buffer);
    expect(result.toString('utf8')).to.equal('hello\nworld\n');
  });

  it('demuxDockerLogs should return raw buffer when not multiplexed (TTY)', () => {
    const buffer = Buffer.from('plain logs\n', 'utf8');
    const result = demuxDockerLogs(buffer);
    expect(result.toString('utf8')).to.equal('plain logs\n');
  });

  it('demuxDockerLogs should handle empty buffer', () => {
    const result = demuxDockerLogs(Buffer.alloc(0));
    expect(result.length).to.equal(0);
  });

  it('demuxDockerLogs should stop on truncated frame', () => {
    const buffer = Buffer.concat([buildFrame(1, 'ok'), Buffer.from([1, 0, 0, 0, 0, 0, 0, 100])]);
    const result = demuxDockerLogs(buffer);
    expect(result.toString('utf8')).to.equal('ok');
  });

  it('should throw PlatformNotCompatible when not running in Docker', async () => {
    system.dockerode = undefined;
    try {
      await system.getGladysLogs({ offset: 0, limit: 1024, refresh: true });
      assert.fail('should have failed');
    } catch (e) {
      expect(e).to.be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should fetch logs, cache them and return the requested chunk', async () => {
    const logsBuffer = Buffer.concat([buildFrame(1, 'line1\n'), buildFrame(1, 'line2\n')]);
    system.getGladysContainerId = fake.resolves('abc123');
    system.getContainerLogs = fake.resolves(logsBuffer);

    const first = await system.getGladysLogs({ offset: 0, limit: 6, refresh: true });
    expect(first.size).to.equal(12);
    expect(first.length).to.equal(6);
    expect(first.encoding).to.equal('base64');
    expect(Buffer.from(first.content_base64, 'base64').toString('utf8')).to.equal('line1\n');

    // Cached: getContainerLogs not called again
    system.getContainerLogs = fake.resolves(Buffer.alloc(0));
    const second = await system.getGladysLogs({ offset: 6, limit: 6 });
    expect(second.size).to.equal(12);
    expect(Buffer.from(second.content_base64, 'base64').toString('utf8')).to.equal('line2\n');
    assert.notCalled(system.getContainerLogs);
  });

  it('should refresh cache when refresh=true', async () => {
    const logsBuffer = Buffer.concat([buildFrame(1, 'oldlog')]);
    system.getGladysContainerId = fake.resolves('abc123');
    system.getContainerLogs = fake.resolves(logsBuffer);
    await system.getGladysLogs({ offset: 0, limit: 1024, refresh: true });

    const newLogs = Buffer.concat([buildFrame(1, 'newlog')]);
    system.getContainerLogs = fake.resolves(newLogs);
    const result = await system.getGladysLogs({ offset: 0, limit: 1024, refresh: true });
    expect(Buffer.from(result.content_base64, 'base64').toString('utf8')).to.equal('newlog');
  });

  it('should return empty chunk when offset is beyond size', async () => {
    const logsBuffer = Buffer.concat([buildFrame(1, 'abc')]);
    system.getGladysContainerId = fake.resolves('abc123');
    system.getContainerLogs = fake.resolves(logsBuffer);
    const result = await system.getGladysLogs({ offset: 999, limit: 1024, refresh: true });
    expect(result.size).to.equal(3);
    expect(result.length).to.equal(0);
    expect(result.content_base64).to.equal('');
  });

  it('should convert non-buffer container logs to a buffer', async () => {
    system.getGladysContainerId = fake.resolves('abc123');
    system.getContainerLogs = fake.resolves('plain logs\n');
    const result = await system.getGladysLogs({ offset: 0, limit: 1024, refresh: true });
    expect(Buffer.from(result.content_base64, 'base64').toString('utf8')).to.equal('plain logs\n');
  });

  it('should call getContainerLogs with a bounded tail line count', async () => {
    const logsBuffer = Buffer.concat([buildFrame(1, 'abc')]);
    system.getGladysContainerId = fake.resolves('abc123');
    system.getContainerLogs = fake.resolves(logsBuffer);
    await system.getGladysLogs({ offset: 0, limit: 1024, refresh: true });
    assert.calledWith(system.getContainerLogs, 'abc123', {
      follow: false,
      tail: MAX_LOG_LINES,
      timestamps: true,
    });
  });
});
