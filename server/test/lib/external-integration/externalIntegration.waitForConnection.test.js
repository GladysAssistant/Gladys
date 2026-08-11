const EventEmitter = require('events');
const { expect } = require('chai');
const WebSocket = require('ws');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { buildSupervisor, seedExternalService, TEST_COMMUNICATION_MANIFEST } = require('./testUtils.test');
const { CONTACT_VARIABLE } = require('../../../lib/external-integration/constants');

// John, seeded by the test database
const JOHN_USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

const buildFakeWs = () => {
  const ws = new EventEmitter();
  ws.readyState = WebSocket.OPEN;
  ws.send = fake.returns(null);
  ws.ping = fake.returns(null);
  ws.terminate = fake.returns(null);
  return ws;
};

const seedCommunicationService = (overrides = {}) =>
  seedExternalService({ manifest: TEST_COMMUNICATION_MANIFEST, has_message_feature: true, ...overrides });

// simulates what start() does: the container is started, the integration
// has not authenticated on the WebSocket yet
const openStartupWindow = (externalIntegration, service) => {
  const timer = setTimeout(() => {}, 60 * 1000);
  externalIntegration.startupTimers.set(service.id, timer);
  return timer;
};

describe('externalIntegration.waitForConnection', () => {
  it('should return true immediately when the integration is connected', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedExternalService();
    externalIntegration.connections.set(service.id, buildFakeWs());
    expect(await externalIntegration.waitForConnection(service, 50)).to.equal(true);
  });

  it('should return false immediately outside the startup window', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedExternalService();
    // a stopped, degraded or broken integration is not "about to connect":
    // no reason to delay the failure
    expect(await externalIntegration.waitForConnection(service, 60 * 1000)).to.equal(false);
    expect(externalIntegration.connectionWaiters.size).to.equal(0);
  });

  it('should resolve as soon as the integration connects during the startup window', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedExternalService();
    const timer = openStartupWindow(externalIntegration, service);
    const waiting = externalIntegration.waitForConnection(service, 5 * 1000);
    const ws = buildFakeWs();
    await externalIntegration.integrationConnected(service, ws);
    expect(await waiting).to.equal(true);
    expect(externalIntegration.connectionWaiters.size).to.equal(0);
    clearTimeout(timer);
    externalIntegration.clearTimers(service.id);
    clearInterval(ws.integrationPingInterval);
  });

  it('should give up after the timeout, cleaning its waiter', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedExternalService();
    const timer = openStartupWindow(externalIntegration, service);
    expect(await externalIntegration.waitForConnection(service, 1)).to.equal(false);
    expect(externalIntegration.connectionWaiters.size).to.equal(0);
    clearTimeout(timer);
    externalIntegration.clearTimers(service.id);
  });

  it('should release every message waiting for the same integration', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedExternalService();
    const timer = openStartupWindow(externalIntegration, service);
    const waitings = [
      externalIntegration.waitForConnection(service, 5 * 1000),
      externalIntegration.waitForConnection(service, 5 * 1000),
    ];
    const ws = buildFakeWs();
    await externalIntegration.integrationConnected(service, ws);
    expect(await Promise.all(waitings)).to.deep.equal([true, true]);
    clearTimeout(timer);
    externalIntegration.clearTimers(service.id);
    clearInterval(ws.integrationPingInterval);
  });
});

describe('externalIntegration message relay at boot', () => {
  it('should send the message once the integration has authenticated', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const service = await seedCommunicationService();
    externalIntegration.registerProxyService(service);
    const proxyService = stateManager.get('service', service.name);
    const timer = openStartupWindow(externalIntegration, service);
    externalIntegration.sendCommand = fake.resolves({ success: true });
    // the contact lookup is stubbed so the relay reaches waitForConnection in
    // one microtask: the test deterministically exercises the wait path, not
    // the already-connected fast path
    externalIntegration.getContactForUser = fake.resolves({ contact_id: 'signal-12345' });
    // the "Gladys just upgraded" notification, forwarded while the
    // container is still booting
    const sending = proxyService.message.sendToUser({ id: JOHN_USER_ID }, { text: 'Gladys just upgraded' });
    await Promise.resolve();
    // the message is genuinely waiting: one registered waiter, nothing sent
    expect(externalIntegration.connectionWaiters.get(service.id).size).to.equal(1);
    assert.notCalled(externalIntegration.sendCommand);
    const ws = buildFakeWs();
    await externalIntegration.integrationConnected(service, ws);
    await sending;
    assert.calledWith(
      externalIntegration.sendCommand,
      service,
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MESSAGE_SEND,
      { contact: { id: 'signal-12345' }, message: { text: 'Gladys just upgraded', file: null } },
    );
    clearTimeout(timer);
    externalIntegration.clearTimers(service.id);
    clearInterval(ws.integrationPingInterval);
  });

  it('should still fail when the integration is not connected and not starting', async () => {
    const { externalIntegration, stateManager, variable } = buildSupervisor();
    const service = await seedCommunicationService();
    await variable.setValue(CONTACT_VARIABLE, JSON.stringify({ contact_id: 'signal-12345' }), service.id, JOHN_USER_ID);
    externalIntegration.registerProxyService(service);
    const proxyService = stateManager.get('service', service.name);
    await expect(proxyService.message.sendToUser({ id: JOHN_USER_ID }, { text: 'hello' })).to.be.rejectedWith(
      ExternalIntegrationUnavailableError,
    );
  });
});
