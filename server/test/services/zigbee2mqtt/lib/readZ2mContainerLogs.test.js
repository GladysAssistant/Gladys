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
  // Emit data + end asynchronously so listeners are attached first
  setImmediate(() => {
    stream.emit('data', text);
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
    gladys.system.getContainerLogs = fake.resolves(buildLogStream(ezspLog));

    await zigbee2mqttManager.readZ2mContainerLogs('container-abc');

    expect(zigbee2mqttManager.z2mContainerError).to.equal('EZSP_PROTOCOL_VERSION');
    assert.calledOnceWithExactly(gladys.system.getContainerLogs, 'container-abc');
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
      // then fire the 10-second timeout by advancing the fake clock.
      await clock.tickAsync(10001);

      await promise;

      expect(zigbee2mqttManager.z2mContainerError).to.equal(null);
      assert.calledOnce(gladys.event.emit);
    } finally {
      clock.restore();
    }
  });
});
