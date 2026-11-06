const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

// Logged by Zigbee2mqtt 2.14.2 when the ember driver refuses a firmware older than EmberZNet 7.4
const OLD_FIRMWARE_LOG =
  '[2026-11-06 10:00:00] error: z2m: Adapter EZSP protocol version (12) is not supported by Host [13-19].';

/**
 * @description Read logs of Zigbee2mqtt 2.14.2 captured in a container, for a startup failure.
 * @param {string} name - File name in the logs folder.
 * @returns {string} Log content.
 * @example
 * const log = readLogFixture('zstack-no-response.log');
 */
function readLogFixture(name) {
  return fs.readFileSync(path.join(__dirname, 'logs', name), 'utf8');
}

/**
 * @description Prepend the Docker stream prefix byte (\x01 = stdout) to each line, matching real Docker output.
 * @param {string} text - Log content.
 * @returns {string} Log content as sent by Docker.
 * @example
 * const chunk = withDockerPrefix('Zigbee2mqtt started');
 */
function withDockerPrefix(text) {
  return text
    .split('\n')
    .map((line) => `\x01${line}`)
    .join('\n');
}

/**
 * Build a fake log stream that emits the given chunks via 'data' then 'end'.
 * @description Creates an EventEmitter that asynchronously emits a 'data' event per given chunk, as is,
 * followed by an 'end' event, simulating a Docker container log stream.
 * The events are deferred with setImmediate so callers can attach listeners before they fire.
 * @param {...string} chunks - Data to emit, one 'data' event per chunk.
 * @returns {EventEmitter} Fake stream.
 * @example
 * const stream = buildRawLogStream('\x01Zigbee2mqtt started');
 * stream.on('data', (chunk) => console.log(chunk)); // '\x01Zigbee2mqtt started'
 * stream.on('end', () => console.log('done'));
 */
function buildRawLogStream(...chunks) {
  const stream = new EventEmitter();
  stream.destroy = sinon.fake();
  // Emit data + end asynchronously so listeners are attached first
  setImmediate(() => {
    chunks.forEach((chunk) => stream.emit('data', chunk));
    stream.emit('end');
  });
  return stream;
}

/**
 * Build a fake log stream that emits the given log texts, each one starting a line.
 * @description Same as buildRawLogStream, with the Docker stream prefix byte on each line.
 * @param {...string} texts - Log content to emit, one 'data' event per text.
 * @returns {EventEmitter} Fake stream.
 * @example
 * const stream = buildLogStream('Zigbee2mqtt started');
 */
function buildLogStream(...texts) {
  return buildRawLogStream(...texts.map(withDockerPrefix));
}

/**
 * Build a fake log stream that emits an error event.
 * @description Creates an EventEmitter that asynchronously emits an 'error' event,
 * simulating a Docker container log stream that fails mid-read.
 * The event is deferred with setImmediate so callers can attach listeners before it fires.
 * @returns {EventEmitter} Fake stream.
 * @example
 * const stream = buildErrorStream();
 * stream.on('error', (err) => console.error(err.message)); // 'stream error'
 */
function buildErrorStream() {
  const stream = new EventEmitter();
  setImmediate(() => {
    stream.emit('error', new Error('stream error'));
  });
  return stream;
}

describe('zigbee2mqtt readZ2mContainerLogs', () => {
  let zigbee2mqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => async () => func(),
      },
      event: {
        emit: fake.resolves(null),
      },
      system: {
        getContainerLogs: fake.resolves(null),
      },
    };

    zigbee2mqttManager = new Zigbee2mqttManager(gladys, {}, serviceId);
    zigbee2mqttManager.fallbackToEzsp = fake.resolves(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should detect EZSP protocol version error, set z2mContainerError and fall back on ezsp', async () => {
    const stream = buildLogStream(OLD_FIRMWARE_LOG);
    gladys.system.getContainerLogs = fake.resolves(stream);

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc', 1700000000);

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code: 'EZSP_PROTOCOL_VERSION', message: null });
    // Only the logs of the current run: those of a previous run would explain a failure that no longer happens
    assert.calledOnceWithExactly(gladys.system.getContainerLogs, 'container-abc', {
      follow: true,
      since: 1700000000,
      tail: 'all',
    });
    assert.calledOnce(stream.destroy);
    assert.calledOnceWithExactly(zigbee2mqttManager.fallbackToEzsp);
    assert.calledOnce(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: sinon.match.object,
    });
  });

  it('should set z2mContainerError to null when no error is found in logs', async () => {
    const normalLog = 'Zigbee2mqtt started successfully';
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(normalLog));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
    assert.notCalled(zigbee2mqttManager.fallbackToEzsp);
    assert.calledOnce(gladys.event.emit);
  });

  it('should show a firmware too recent for the ember driver as a raw error, without falling back on ezsp', async () => {
    // The ezsp driver refuses it too
    const error = 'z2m: Adapter EZSP protocol version (20) is not supported by Host [13-19].';
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(`[2026-11-06 10:00:00] error: ${error}`));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code: null, message: error });
    assert.notCalled(zigbee2mqttManager.fallbackToEzsp);
  });

  it('should set z2mContainerError to null on stream error and still emit status', async () => {
    gladys.system.getContainerLogs = fake.resolves(buildErrorStream());

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
    assert.calledOnce(gladys.event.emit);
  });

  it('should set z2mContainerError to null when getContainerLogs throws and still emit status', async () => {
    gladys.system.getContainerLogs = fake.rejects(new Error('Docker not available'));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
    assert.calledOnce(gladys.event.emit);
  });

  it('should not detect the EZSP error without the protocol versions', async () => {
    const partialLog = 'Adapter EZSP protocol version 13 detected';
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(partialLog));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
  });

  it('should resolve via timeout when stream never emits end or error', async () => {
    const clock = sinon.useFakeTimers();
    try {
      const stream = new EventEmitter();
      stream.destroy = sinon.fake();
      gladys.system.getContainerLogs = fake.resolves(stream);

      const promise = zigbee2mqttManager.readZ2mContainerLogs('container-abc');

      // Let the awaited getContainerLogs promise settle and listeners attach: still reading after 4 minutes, as
      // Zigbee2mqtt can be slow to start on a modest machine
      await clock.tickAsync(4 * 60 * 1000);
      stream.emit('data', withDockerPrefix('[2026-11-06 18:53:24] info: \tz2m: Starting zigbee-herdsman (10.10.0)\n'));
      assert.notCalled(stream.destroy);
      assert.notCalled(gladys.event.emit);

      // Then stops after 5 minutes
      await clock.tickAsync(60 * 1000);
      await promise;

      expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
      assert.calledOnce(stream.destroy);
      assert.calledOnce(gladys.event.emit);
    } finally {
      clock.restore();
    }
  });

  [
    // A model other than the selected one: the driver gets no answer it understands
    { fixture: 'zstack-no-response.log', code: 'ADAPTER_NO_RESPONSE' },
    { fixture: 'ember-no-response.log', code: 'ADAPTER_NO_RESPONSE' },
    { fixture: 'ezsp-no-response.log', code: 'ADAPTER_NO_RESPONSE' },
    { fixture: 'deconz-no-response.log', code: 'ADAPTER_NO_RESPONSE' },
    // A network coordinator out of reach: told before the driver gives up (HOST_FATAL_ERROR for ember...)
    { fixture: 'zstack-connection-refused.log', code: 'ADAPTER_UNREACHABLE' },
    { fixture: 'ember-unknown-host.log', code: 'ADAPTER_UNREACHABLE' },
    { fixture: 'ezsp-connection-refused.log', code: 'ADAPTER_UNREACHABLE' },
    { fixture: 'deconz-connection-refused.log', code: 'ADAPTER_UNREACHABLE' },
  ].forEach(({ fixture, code }) => {
    it(`should detect ${code} in real logs (${fixture})`, async () => {
      const stream = buildLogStream(readLogFixture(fixture));
      gladys.system.getContainerLogs = fake.resolves(stream);

      await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

      expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code, message: null });
      assert.calledOnce(stream.destroy);
    });
  });

  it('should detect an invalid configuration with the settings refused by Zigbee2mqtt', async () => {
    const stream = buildLogStream(readLogFixture('invalid-configuration.log'));
    gladys.system.getContainerLogs = fake.resolves(stream);

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({
      code: 'INVALID_CONFIGURATION',
      message: 'serial/adapter must be equal to one of the allowed values',
    });
    // Zigbee2mqtt waits on its failure page without exiting: the end of the list is enough
    assert.calledOnce(stream.destroy);
  });

  it('should keep every setting refused by Zigbee2mqtt, even when the logs end before the end of the list', async () => {
    const log = [
      'Refusing to start because configuration is not valid, found the following errors:',
      '- serial/adapter must be equal to one of the allowed values',
      '- mqtt/server must be string',
    ].join('\n');
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(log));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({
      code: 'INVALID_CONFIGURATION',
      message: 'serial/adapter must be equal to one of the allowed values; mqtt/server must be string',
    });
  });

  it('should stop reading once Zigbee2mqtt is started, ignoring the errors logged before', async () => {
    const log = [
      '[2026-11-06 18:53:24] info: \tz2m: Starting zigbee-herdsman (10.10.0)',
      '[2026-11-06 18:53:30] error: \tz2m: Failed to configure device 0x00158d0001',
      '[2026-11-06 18:53:31] info: \tz2m: Zigbee2MQTT started!',
      '',
    ].join('\n');
    const stream = buildLogStream(log, `${OLD_FIRMWARE_LOG}\n`);
    gladys.system.getContainerLogs = fake.resolves(stream);

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
    assert.calledOnce(stream.destroy);
    assert.calledOnce(gladys.event.emit);
  });

  it('should ignore the logs sent once the cause is found', async () => {
    const stream = buildLogStream(
      readLogFixture('zstack-no-response.log'),
      '[2026-11-06 18:53:42] error: \tz2m: Error: something else\n',
    );
    gladys.system.getContainerLogs = fake.resolves(stream);

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code: 'ADAPTER_NO_RESPONSE', message: null });
  });

  it('should detect an error split across two chunks', async () => {
    const stream = buildRawLogStream(
      withDockerPrefix('[2026-11-06 18:53:42] error: \tz2m: Error: Failed to connect to the ad'),
      // The second chunk continues the line, without Docker stream prefix byte
      'apter (Error: SRSP - SYS - ping after 6000ms)\n',
    );
    gladys.system.getContainerLogs = fake.resolves(stream);

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code: 'ADAPTER_NO_RESPONSE', message: null });
  });

  it('should detect an error on the last line of the logs, without line break', async () => {
    const log = '[2026-11-06 18:53:42] error: \tz2m: Error: Failure to connect';
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(log));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code: 'ADAPTER_NO_RESPONSE', message: null });
  });

  it('should not blame the coordinator when Zigbee2mqtt cannot reach the broker', async () => {
    const log = [
      '[2026-11-06 18:53:42] info: \tz2m: Connecting to MQTT server at mqtt://localhost:1884',
      '[2026-11-06 18:53:42] error: \tz2m: MQTT error: connect ECONNREFUSED 127.0.0.1:1884',
      '[2026-11-06 18:53:42] error: \tz2m: MQTT failed to connect, exiting...',
    ].join('\n');
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(log));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({
      code: null,
      message: 'z2m: MQTT failed to connect, exiting...',
    });
  });

  it('should keep the last error logged by Zigbee2mqtt when no known pattern matches', async () => {
    // Zigbee2mqtt logs why it exits after "Exiting...", followed by a noisy dump that is not a logged error
    const log = [
      '[2026-11-06 18:53:40] error: \tz2m: Error while starting zigbee-herdsman',
      '[2026-11-06 18:53:40] error: \tz2m: Exiting...',
      '[2026-11-06 18:53:40] error: \tz2m: Error: Unexpected adapter answer',
      '    at Znp.request (/app/node_modules/zigbee-herdsman/dist/adapter/z-stack/znp/znp.js:300:19)',
      'NodeError: write after end',
      'Some info',
    ].join('\n');
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(log));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({
      code: null,
      message: 'z2m: Error: Unexpected adapter answer',
    });
  });

  it('should strip ANSI color codes and the Docker stream prefix byte from log lines', async () => {
    const log = '[2026-11-06 18:53:40] \x1B[31merror\x1B[39m: \tz2m: Error: Unexpected adapter answer';
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(log));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({
      code: null,
      message: 'z2m: Error: Unexpected adapter answer',
    });
  });

  it('should ignore a known error found at the end of the logs when Zigbee2mqtt is online', async () => {
    // Zigbee2mqtt answers: whatever was logged did not prevent it from running
    zigbee2mqttManager.zigbee2mqttConnected = true;
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(OLD_FIRMWARE_LOG));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
    assert.notCalled(zigbee2mqttManager.fallbackToEzsp);
  });

  it('should ignore a known error found while reading when Zigbee2mqtt is online', async () => {
    zigbee2mqttManager.zigbee2mqttConnected = true;
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(`${OLD_FIRMWARE_LOG}\nmore logs\n`));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
  });

  it('should ignore a logged error when Zigbee2mqtt is online', async () => {
    // A device failing to answer during the startup is logged as an error, without stopping Zigbee2mqtt
    zigbee2mqttManager.zigbee2mqttConnected = true;
    const log = '[2026-11-06 18:53:30] error: \tz2m: Failed to configure device 0x00158d0001';
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(log));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
  });

  it('should prefer known error code over raw error lines', async () => {
    const log = [
      '[2026-11-06 18:53:40] error: \tz2m: some random error',
      OLD_FIRMWARE_LOG,
      '[2026-11-06 18:53:40] error: \tz2m: another error',
    ].join('\n');
    const stream = buildLogStream(log);
    gladys.system.getContainerLogs = fake.resolves(stream);

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code: 'EZSP_PROTOCOL_VERSION', message: null });
    assert.calledOnce(stream.destroy);
  });
});
