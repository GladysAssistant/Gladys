const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon');
const WebSocket = require('ws');
const { assert: sinonAssert, fake } = require('sinon');

const db = require('../../../models');
const { ExternalIntegrationUnavailableError, BadParameters } = require('../../../utils/coreErrors');
const { SERVICE_STATUS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

const buildFakeWs = () => {
  const ws = new EventEmitter();
  ws.readyState = WebSocket.OPEN;
  ws.send = fake.returns(null);
  ws.ping = fake.returns(null);
  ws.terminate = fake.returns(null);
  return ws;
};

describe('externalIntegration.integrationConnected', () => {
  it('should register the connection and transition to RUNNING', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.LOADING });
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    await externalIntegration.integrationConnected(service, ws);
    expect(externalIntegration.connections.get(service.id)).to.equal(ws);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.RUNNING);
    expect(serviceInDb.last_heartbeat).to.not.equal(null);
    externalIntegration.clearTimers(service.id);
    clearInterval(ws.integrationPingInterval);
  });

  it('should not stack ping loops when the same socket re-authenticates', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    await externalIntegration.integrationConnected(service, ws);
    const firstPingInterval = ws.integrationPingInterval;
    await externalIntegration.integrationConnected(service, ws);
    expect(ws.integrationPingInterval).to.not.equal(firstPingInterval);
    sinonAssert.notCalled(ws.terminate);
    externalIntegration.clearTimers(service.id);
    clearInterval(ws.integrationPingInterval);
  });

  it('should replace a previous connection that cannot be terminated', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const firstWs = buildFakeWs();
    firstWs.terminate = () => {
      throw new Error('CANNOT_TERMINATE');
    };
    const secondWs = buildFakeWs();
    externalIntegration.connections.set(service.id, firstWs);
    await externalIntegration.integrationConnected(service, secondWs);
    expect(externalIntegration.connections.get(service.id)).to.equal(secondWs);
    externalIntegration.clearTimers(service.id);
    clearInterval(secondWs.integrationPingInterval);
  });

  it('should replace the previous connection on reconnection', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const firstWs = buildFakeWs();
    const secondWs = buildFakeWs();
    await externalIntegration.integrationConnected(service, firstWs);
    await externalIntegration.integrationConnected(service, secondWs);
    sinonAssert.calledOnce(firstWs.terminate);
    expect(externalIntegration.connections.get(service.id)).to.equal(secondWs);
    externalIntegration.clearTimers(service.id);
    clearInterval(firstWs.integrationPingInterval);
    clearInterval(secondWs.integrationPingInterval);
  });

  it('should set DEGRADED after 2 missed pongs', async () => {
    const clock = sinon.useFakeTimers();
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    await externalIntegration.integrationConnected(service, ws);
    // first ping: alive (auth counts), then no pong ever answered
    await clock.tickAsync(20 * 1000);
    await clock.tickAsync(20 * 1000);
    await clock.tickAsync(20 * 1000);
    clock.restore();
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    sinonAssert.called(ws.terminate);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.DEGRADED);
    externalIntegration.clearTimers(service.id);
  });

  it('should stop pinging a replaced connection', async () => {
    const clock = sinon.useFakeTimers();
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const firstWs = buildFakeWs();
    await externalIntegration.integrationConnected(service, firstWs);
    const secondWs = buildFakeWs();
    await externalIntegration.integrationConnected(service, secondWs);
    // the first connection interval fires and clears itself
    await clock.tickAsync(20 * 1000);
    clock.restore();
    sinonAssert.notCalled(firstWs.ping);
    externalIntegration.clearTimers(service.id);
    clearInterval(firstWs.integrationPingInterval);
    clearInterval(secondWs.integrationPingInterval);
  });

  it('should degrade even when the silent socket cannot be terminated', async () => {
    const clock = sinon.useFakeTimers();
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    ws.terminate = () => {
      throw new Error('CANNOT_TERMINATE');
    };
    await externalIntegration.integrationConnected(service, ws);
    await clock.tickAsync(60 * 1000);
    clock.restore();
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.DEGRADED);
    externalIntegration.clearTimers(service.id);
  });

  it('should survive a failing protocol ping', async () => {
    const clock = sinon.useFakeTimers();
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    ws.ping = () => {
      throw new Error('CANNOT_PING');
    };
    await externalIntegration.integrationConnected(service, ws);
    await clock.tickAsync(20 * 1000);
    clock.restore();
    expect(externalIntegration.connections.get(service.id)).to.equal(ws);
    externalIntegration.clearTimers(service.id);
    clearInterval(ws.integrationPingInterval);
  });

  it('should stay RUNNING while pongs are answered', async () => {
    const clock = sinon.useFakeTimers();
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    ws.ping = fake(() => {
      // the integration answers the protocol ping
      ws.emit('pong');
    });
    await externalIntegration.integrationConnected(service, ws);
    await clock.tickAsync(120 * 1000);
    clock.restore();
    sinonAssert.notCalled(ws.terminate);
    externalIntegration.clearTimers(service.id);
    clearInterval(ws.integrationPingInterval);
  });
});

describe('externalIntegration.integrationDisconnected', () => {
  it('should set a RUNNING integration DEGRADED when its socket closes', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.RUNNING });
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    ws.integrationPingInterval = setInterval(() => {}, 100000);
    externalIntegration.connections.set(service.id, ws);
    await externalIntegration.integrationDisconnected(service, ws);
    expect(externalIntegration.connections.has(service.id)).to.equal(false);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.DEGRADED);
  });

  it('should ignore the close of a replaced connection', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.RUNNING });
    const { externalIntegration } = buildSupervisor();
    const oldWs = buildFakeWs();
    const currentWs = buildFakeWs();
    externalIntegration.connections.set(service.id, currentWs);
    await externalIntegration.integrationDisconnected(service, oldWs);
    expect(externalIntegration.connections.get(service.id)).to.equal(currentWs);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.RUNNING);
  });

  it('should not degrade a STOPPED integration', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.STOPPED });
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    await externalIntegration.integrationDisconnected(service, ws);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.STOPPED);
  });
});

describe('externalIntegration.sendCommand', () => {
  it('should resolve when the integration acks the command', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    const commandPromise = externalIntegration.sendCommand(
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_SET_VALUE,
      { value: 1 },
    );
    sinonAssert.calledOnce(ws.send);
    const sentMessage = JSON.parse(ws.send.firstCall.args[0]);
    expect(sentMessage.type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_SET_VALUE);
    expect(sentMessage.payload).to.have.property('message_id');
    expect(sentMessage.payload).to.have.property('value', 1);
    externalIntegration.handleCommandResult(service, { message_id: sentMessage.payload.message_id, success: true });
    const result = await commandPromise;
    expect(result).to.have.property('success', true);
  });

  it('should reject when the integration acks with success false', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    const commandPromise = externalIntegration.sendCommand(
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_SET_VALUE,
      { value: 1 },
    );
    const sentMessage = JSON.parse(ws.send.firstCall.args[0]);
    externalIntegration.handleCommandResult(service, {
      message_id: sentMessage.payload.message_id,
      success: false,
      error: 'device unreachable',
    });
    try {
      await commandPromise;
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
      expect(e.message).to.equal('device unreachable');
    }
  });

  it('should reject after the 5s ack timeout', async () => {
    const clock = sinon.useFakeTimers();
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    const commandPromise = externalIntegration.sendCommand(
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_SET_VALUE,
      { value: 1 },
    );
    const assertionPromise = commandPromise.then(
      () => {
        throw new Error('should have thrown');
      },
      (e) => {
        expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
        expect(e.message).to.equal('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT');
      },
    );
    await clock.tickAsync(5001);
    clock.restore();
    await assertionPromise;
    expect(externalIntegration.pendingCommands.size).to.equal(0);
  });

  it('should throw immediately when the integration is disconnected', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.sendCommand(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_POLL, {});
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
      expect(e.message).to.equal('EXTERNAL_INTEGRATION_NOT_CONNECTED');
    }
  });
});

describe('externalIntegration.handleCommandResult', () => {
  it('should ignore unknown or malformed results', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.handleCommandResult(service, null);
    externalIntegration.handleCommandResult(service, { message_id: 'unknown', success: true });
  });
});

describe('externalIntegration.sendMessage', () => {
  it('should send when connected, return false otherwise', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    expect(externalIntegration.sendMessage(service, 'type', {})).to.equal(false);
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    expect(externalIntegration.sendMessage(service, 'type', {})).to.equal(true);
    sinonAssert.calledOnce(ws.send);
  });
});

describe('externalIntegration.requestScan', () => {
  it('should relay a scan-request to the integration', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    await externalIntegration.requestScan(service.selector);
    const sentMessage = JSON.parse(ws.send.firstCall.args[0]);
    expect(sentMessage.type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.SCAN_REQUEST);
  });

  it('should throw when the integration is disconnected', async () => {
    const service = await seedExternalService();
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.requestScan(service.selector);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
    }
  });
});

describe('externalIntegration.handleHeartbeat', () => {
  it('should ignore a heartbeat of a destroyed integration', async () => {
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.handleHeartbeat({ id: '4756151c-369e-4fbd-8794-1c4a55b4c8f9', selector: 'ext-gone' });
  });

  it('should update last_heartbeat and recover from DEGRADED', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.DEGRADED });
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.handleHeartbeat(service);
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.RUNNING);
    expect(serviceInDb.last_heartbeat).to.not.equal(null);
    externalIntegration.clearTimers(service.id);
  });

  it('should not touch the status of a RUNNING integration', async () => {
    const service = await seedExternalService({ status: SERVICE_STATUS.RUNNING });
    const { externalIntegration, event } = buildSupervisor();
    await externalIntegration.handleHeartbeat(service);
    sinonAssert.notCalled(event.emit);
    externalIntegration.clearTimers(service.id);
  });
});

describe('externalIntegration.setRunning', () => {
  it('should survive a failing failure_count reset', async () => {
    const clock = sinon.useFakeTimers();
    const service = await seedExternalService({ failure_count: 3, status: SERVICE_STATUS.DEGRADED });
    const { externalIntegration } = buildSupervisor();
    const updateStub = sinon.stub(db.Service, 'update');
    updateStub.onFirstCall().resolves([1]);
    updateStub.rejects(new Error('CANNOT_UPDATE'));
    try {
      await externalIntegration.setRunning(service);
      await clock.tickAsync(61 * 1000);
    } finally {
      clock.restore();
      updateStub.restore();
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(externalIntegration.stableRunningTimers.has(service.id)).to.equal(false);
  });

  it('should reset failure_count after 60s of stable RUNNING', async () => {
    const clock = sinon.useFakeTimers();
    const service = await seedExternalService({ failure_count: 3, status: SERVICE_STATUS.DEGRADED });
    const { externalIntegration } = buildSupervisor();
    await externalIntegration.setRunning(service);
    let serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.status).to.equal(SERVICE_STATUS.RUNNING);
    expect(serviceInDb.failure_count).to.equal(3);
    await clock.tickAsync(61 * 1000);
    clock.restore();
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
    serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    expect(serviceInDb.failure_count).to.equal(0);
    expect(externalIntegration.stableRunningTimers.has(service.id)).to.equal(false);
  });
});
