const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const logger = require('../../../../utils/logger');
const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const config = {
  mqttUrl: 'mqtt://localhost:1884',
  mqttUsername: 'gladys',
  mqttPassword: 'gladys-password',
  z2mMqttUsername: 'z2m',
  z2mMqttPassword: 'z2m-password',
};

// Answers of the broker to an attempt, emitted like the MQTT client does
const accepted = (client) => client.emit('connect');
const refusedConnection = (client) => {
  // Without message, as since Node 20 for localhost: both its IPv4 and IPv6 addresses are tried
  const error = new Error();
  error.code = 'ECONNREFUSED';
  client.emit('error', error);
  client.emit('close');
};
const refusedCredentials = (returnCode) => (client) => {
  const error = new Error('Connection refused: Not authorized');
  error.code = returnCode;
  client.emit('error', error);
  client.emit('close');
};
const closedWithoutAnswer = (client) => client.emit('close');

describe('zigbee2mqtt waitForBroker', () => {
  let zigbee2mqttManager;
  let mqttLibrary;
  let clients;
  let clock;

  // Each call of connect returns a new client, answering once connect returned, or after the given delay
  const answerWith = (answer, delayInMs) => () => {
    const client = new EventEmitter();
    client.end = fake();
    clients.push(client);
    if (delayInMs) {
      setTimeout(() => answer(client), delayInMs);
    } else {
      // Not a timer: the fake clock delays by 1 ms the timers of 0 ms set while it ticks
      process.nextTick(() => answer(client));
    }
    return client;
  };

  // Settled or not, without waiting for it
  const follow = (promise) => {
    const followed = { settled: false, error: null };
    (async () => {
      try {
        await promise;
      } catch (e) {
        followed.error = e;
      }
      followed.settled = true;
    })();
    return followed;
  };

  const expectClientsClosed = () => {
    clients.forEach((client) => {
      assert.calledOnceWithExactly(client.end, true);
      expect(client.eventNames()).to.deep.equal([]);
    });
  };

  beforeEach(() => {
    const gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
    };
    clients = [];
    mqttLibrary = { connect: sinon.stub().callsFake(answerWith(accepted)) };
    zigbee2mqttManager = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);
    sinon.stub(logger, 'info');
    sinon.stub(logger, 'warn');
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it('should end as soon as the broker accepts the connection of Gladys', async () => {
    // EXECUTE
    await zigbee2mqttManager.waitForBroker(config);
    // ASSERT
    assert.calledOnceWithExactly(mqttLibrary.connect, 'mqtt://localhost:1884', {
      username: 'gladys',
      password: 'gladys-password',
      reconnectPeriod: 0,
      connectTimeout: 2000,
      clientId: sinon.match(/^gladys-broker-probe-\d+$/),
    });
    expectClientsClosed();
    assert.calledOnceWithExactly(logger.info, 'MQTT broker ready in 0.0 s');
    assert.notCalled(logger.warn);
  });

  it('should try again while the broker does not listen yet', async () => {
    // PREPARE
    mqttLibrary.connect.callsFake(answerWith(refusedConnection));
    mqttLibrary.connect.onCall(4).callsFake(answerWith(accepted));
    // EXECUTE
    const wait = follow(zigbee2mqttManager.waitForBroker(config));
    await clock.tickAsync(999);
    expect(wait.settled).to.equal(false);
    await clock.tickAsync(1);
    // ASSERT
    expect(wait).to.deep.equal({ settled: true, error: null });
    assert.callCount(mqttLibrary.connect, 5);
    expectClientsClosed();
    assert.calledOnceWithExactly(logger.info, 'MQTT broker ready in 1.0 s');
  });

  it('should try again when the connection closes without an answer', async () => {
    // PREPARE
    // As when the connect timeout is over
    mqttLibrary.connect.onCall(0).callsFake(answerWith(closedWithoutAnswer, 2000));
    // EXECUTE
    const wait = follow(zigbee2mqttManager.waitForBroker(config));
    await clock.tickAsync(2250);
    // ASSERT
    expect(wait).to.deep.equal({ settled: true, error: null });
    assert.calledTwice(mqttLibrary.connect);
    expectClientsClosed();
    assert.calledOnceWithExactly(logger.info, 'MQTT broker ready in 2.3 s');
  });

  [4, 5, 134, 135].forEach((returnCode) => {
    it(`should end when the broker refuses the credentials (return code ${returnCode})`, async () => {
      // PREPARE
      mqttLibrary.connect.callsFake(answerWith(refusedCredentials(returnCode)));
      // EXECUTE
      await zigbee2mqttManager.waitForBroker(config);
      // ASSERT
      // The broker runs: connect tells the user about the credentials
      assert.calledOnce(mqttLibrary.connect);
      expectClientsClosed();
      assert.calledOnceWithExactly(logger.info, 'MQTT broker ready in 0.0 s');
    });
  });

  it('should warn and go on when the broker does not answer within 30 seconds', async () => {
    // PREPARE
    mqttLibrary.connect.callsFake(answerWith(refusedConnection));
    // EXECUTE
    const wait = follow(zigbee2mqttManager.waitForBroker(config));
    await clock.tickAsync(29999);
    expect(wait.settled).to.equal(false);
    await clock.tickAsync(1);
    // ASSERT
    // Not a failure: the client of Gladys reconnects until the broker answers
    expect(wait).to.deep.equal({ settled: true, error: null });
    assert.callCount(mqttLibrary.connect, 121);
    expectClientsClosed();
    assert.calledOnceWithExactly(
      logger.warn,
      'MQTT broker did not answer within 30.0 s, going on anyway: ECONNREFUSED',
    );
    assert.notCalled(logger.info);
  });

  it('should warn and go on when the connections are never answered', async () => {
    // PREPARE
    mqttLibrary.connect.callsFake(answerWith(closedWithoutAnswer, 2000));
    // EXECUTE
    const wait = follow(zigbee2mqttManager.waitForBroker(config));
    // The last attempt starts before 30 s, and lasts its connect timeout
    await clock.tickAsync(31249);
    expect(wait.settled).to.equal(false);
    await clock.tickAsync(1);
    // ASSERT
    expect(wait).to.deep.equal({ settled: true, error: null });
    assert.callCount(mqttLibrary.connect, 14);
    expectClientsClosed();
    assert.calledOnceWithExactly(
      logger.warn,
      'MQTT broker did not answer within 30.0 s, going on anyway: Connection closed without an answer',
    );
  });
});
