const { expect } = require('chai');
const sinon = require('sinon');
const EventEmitter = require('events');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

/**
 * Build a fake log stream that emits the given log text via 'data' then 'end'.
 * @description Creates an EventEmitter that asynchronously emits a 'data' event with the
 * provided text followed by an 'end' event, simulating a Docker container log stream.
 * The events are deferred with setImmediate so callers can attach listeners before they fire.
 * @param {string} text - Log content to emit.
 * @returns {EventEmitter} Fake stream.
 * @example
 * const stream = buildLogStream('Zigbee2mqtt started');
 * stream.on('data', (chunk) => console.log(chunk)); // 'Zigbee2mqtt started'
 * stream.on('end', () => console.log('done'));
 */
function buildLogStream(text) {
  const stream = new EventEmitter();
  stream.destroy = sinon.fake();
  // Prepend Docker stream prefix byte (\x01 = stdout) to each line, matching real Docker output
  const prefixed = text
    .split('\n')
    .map((line) => `\x01${line}`)
    .join('\n');
  // Emit data + end asynchronously so listeners are attached first
  setImmediate(() => {
    stream.emit('data', prefixed);
    stream.emit('end');
  });
  return stream;
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
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should detect EZSP protocol version error and set z2mContainerError', async () => {
    const ezspLog = 'Adapter EZSP protocol version 13 is not supported by Host. Supported: 8, 9, 10, 11, 12';
    const stream = buildLogStream(ezspLog);
    gladys.system.getContainerLogs = fake.resolves(stream);

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code: 'EZSP_PROTOCOL_VERSION', message: null });
    assert.calledOnceWithExactly(gladys.system.getContainerLogs, 'container-abc', { follow: true });
    assert.calledOnce(stream.destroy);
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
    assert.calledOnce(gladys.event.emit);
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

  it('should require both EZSP substrings to trigger the error', async () => {
    // Only the first part of the EZSP error message, not the second
    const partialLog = 'Adapter EZSP protocol version 13 detected';
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(partialLog));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
  });

  it('should resolve via timeout when stream never emits end or error', async () => {
    const clock = sinon.useFakeTimers();
    try {
      const stream = new EventEmitter();
      gladys.system.getContainerLogs = fake.resolves(stream);

      const promise = zigbee2mqttManager.readZ2mContainerLogs('container-abc');

      // Let the awaited getContainerLogs promise settle and listeners attach,
      // then fire the 30-second timeout by advancing the fake clock.
      await clock.tickAsync(30001);

      await promise;

      expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
      assert.calledOnce(gladys.event.emit);
    } finally {
      clock.restore();
    }
  });

  it('should set unknown error when log contains error: line but no known pattern', async () => {
    const unknownLog = 'Something went wrong\nerror: Failed to connect to serial port /dev/ttyUSB0\nDone';
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(unknownLog));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({
      code: null,
      message: 'error: Failed to connect to serial port /dev/ttyUSB0',
    });
  });

  it('should remove the first character of each line (Docker stream prefix byte)', async () => {
    // buildLogStream prepends \x01 per line; without removal the match would fail
    const log = 'error: Docker prefix byte must be stripped';
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(log));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({
      code: null,
      message: 'error: Docker prefix byte must be stripped',
    });
  });

  it('should strip ANSI color codes from log lines', async () => {
    const log = '\x1B[31merror\x1B[39m: Failed to open serial port';
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(log));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({
      code: null,
      message: 'error: Failed to open serial port',
    });
  });

  it('should match error: case-insensitively', async () => {
    const log = 'Error: Something bad happened';
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(log));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({
      code: null,
      message: 'Error: Something bad happened',
    });
  });

  it('should keep the last raw error line when multiple error: lines are present', async () => {
    const log = 'error: First error\nSome info\nERROR: Last error';
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(log));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({
      code: null,
      message: 'ERROR: Last error',
    });
  });

  it('should prefer known error code over raw error lines', async () => {
    const log =
      'error: some random error\nAdapter EZSP protocol version 13 is not supported by Host\nerror: another error';
    const stream = buildLogStream(log);
    gladys.system.getContainerLogs = fake.resolves(stream);

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.deep.equal({ code: 'EZSP_PROTOCOL_VERSION', message: null });
    assert.calledOnce(stream.destroy);
  });
});
