const EventEmitter = require('events');
const { expect } = require('chai');
const WebSocket = require('ws');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const db = require('../../../models');
const { BadParameters, NotFoundError, ExternalIntegrationUnavailableError } = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { WEBSOCKET_MESSAGE_TYPES, SERVICE_STATUS } = require('../../../utils/constants');
const { MAX_PENDING_SCENE_ACTIONS } = require('../../../lib/external-integration/constants');
const { normalizeSceneActionOutputs } = require('../../../lib/external-integration/externalIntegration.runSceneAction');
const {
  buildSupervisor,
  seedExternalService,
  TEST_MANIFEST,
  TEST_WEATHER_MANIFEST,
  TEST_SCENE_MANIFEST,
} = require('./testUtils.test');

const seedSceneService = (overrides = {}) => seedExternalService({ manifest: TEST_SCENE_MANIFEST, ...overrides });

const buildFakeWs = () => {
  const ws = new EventEmitter();
  ws.readyState = WebSocket.OPEN;
  ws.send = fake.returns(null);
  ws.ping = fake.returns(null);
  ws.terminate = fake.returns(null);
  return ws;
};

// simulates what start() does: the container is started, the integration
// has not authenticated on the WebSocket yet
const openStartupWindow = (externalIntegration, service) => {
  const timer = setTimeout(() => {}, 60 * 1000);
  externalIntegration.startupTimers.set(service.id, timer);
  return timer;
};

// the camera device the scene references, created by the user (source: "devices")
const seedCamera = (service, externalId = `ext:${service.selector}:front`) =>
  db.Device.create({
    service_id: service.id,
    name: 'Front camera',
    selector: `${service.selector}-front`,
    external_id: externalId,
  });

const flushMicrotasks = async (ws) => {
  for (let i = 0; i < 20 && !ws.send.called; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
};

describe('externalIntegration.runSceneAction', () => {
  let externalIntegration;
  let service;
  // the render callback the scene engine builds from its scope
  const render = (value) => value.replace('{{triggerEvent.data.zone}}', 'driveway').replace('{{0.0.last_value}}', '15');

  beforeEach(async () => {
    service = await seedSceneService();
    await seedCamera(service);
    ({ externalIntegration } = buildSupervisor());
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should resolve the stored fields in order and relay them under the declared timeout', async () => {
    externalIntegration.sendCommand = fake.resolves({ success: true, data: { outputs: { clip_id: 'clip-1' } } });
    const outputs = await externalIntegration.runSceneAction(
      service,
      'create_snapshot',
      {
        camera: `ext:${service.selector}:front`,
        caption: 'Visitor in {{triggerEvent.data.zone}}',
        // a stale key of a field removed by an update, never rendered even
        // with a malformed template, never an error
        old_field: '{{#unclosed',
        // empty optionals omitted
        hd: null,
        format: '',
      },
      { render },
    );
    expect(outputs).to.deep.equal({ clip_id: 'clip-1' });
    sinonAssert.calledOnce(externalIntegration.sendCommand);
    const [sentService, type, payload, options] = externalIntegration.sendCommand.firstCall.args;
    expect(sentService).to.equal(service);
    expect(type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.SCENE_ACTION_RUN);
    expect(payload).to.deep.equal({
      key: 'create_snapshot',
      // rendered caption, applied default, stripped stale key, omitted empties
      fields: { camera: `ext:${service.selector}:front`, caption: 'Visitor in driveway', quality: 80 },
    });
    // the ack deadline is what remains of the declared 20s (no connection wait here)
    expect(options.timeoutMs).to.be.within(19000, 20000);
  });

  it('should only render the declared string fields', async () => {
    externalIntegration.sendCommand = fake.resolves({ success: true });
    const renderSpy = fake((value) => `rendered:${value}`);
    await externalIntegration.runSceneAction(
      service,
      'create_snapshot',
      // a select value holding braces is an enum member, not a template, and
      // a number is untouched
      { camera: `ext:${service.selector}:front`, caption: 'hello', format: '{{png}}', quality: 42, hd: true },
      { render: renderSpy },
    );
    sinonAssert.calledOnceWithExactly(renderSpy, 'hello');
    expect(externalIntegration.sendCommand.firstCall.args[2].fields).to.deep.equal({
      camera: `ext:${service.selector}:front`,
      caption: 'rendered:hello',
      format: '{{png}}',
      quality: 42,
      hd: true,
    });
  });

  it('should use the default timeout, a passthrough render and empty outputs on a bare action', async () => {
    externalIntegration.sendCommand = fake.resolves({ success: true, data: { message: 'done' } });
    const outputs = await externalIntegration.runSceneAction(service, 'echo');
    expect(outputs).to.deep.equal({});
    expect(externalIntegration.sendCommand.firstCall.args[2]).to.deep.equal({ key: 'echo', fields: {} });
    expect(externalIntegration.sendCommand.firstCall.args[3].timeoutMs).to.be.within(29000, 30000);
  });

  it('should fail on an undeclared key and on malformed stored fields', async () => {
    externalIntegration.sendCommand = fake.resolves({ success: true });
    await expect(externalIntegration.runSceneAction(service, 'removed_by_update', {})).to.be.rejectedWith(
      NotFoundError,
      'SCENE_ACTION_NOT_DECLARED',
    );
    await expect(externalIntegration.runSceneAction(service, 'echo', 'nope')).to.be.rejectedWith(
      BadParameters,
      'fields: must be an object',
    );
    sinonAssert.notCalled(externalIntegration.sendCommand);
  });

  it('should fail loudly on a required field missing without a default', async () => {
    externalIntegration.sendCommand = fake.resolves({ success: true });
    await expect(externalIntegration.runSceneAction(service, 'create_snapshot', { caption: 'x' })).to.be.rejectedWith(
      BadParameters,
      'fields.camera: required',
    );
    sinonAssert.notCalled(externalIntegration.sendCommand);
  });

  it('should validate the resolved values with the config engine, dynamic devices included', async () => {
    externalIntegration.sendCommand = fake.resolves({ success: true });
    // a device of another integration
    await expect(
      externalIntegration.runSceneAction(service, 'create_snapshot', { camera: 'ext:another:front' }),
    ).to.be.rejectedWith(Error422);
    // a number out of the declared bounds
    await expect(
      externalIntegration.runSceneAction(service, 'create_snapshot', {
        camera: `ext:${service.selector}:front`,
        quality: 150,
      }),
    ).to.be.rejectedWith(Error422);
    // a rendered caption that is not a string anymore
    await expect(
      externalIntegration.runSceneAction(
        service,
        'create_snapshot',
        { camera: `ext:${service.selector}:front`, caption: 'x' },
        { render: () => 12 },
      ),
    ).to.be.rejectedWith(Error422);
    sinonAssert.notCalled(externalIntegration.sendCommand);
  });

  it('should reserve an in-flight slot before the connection wait and release it on every outcome', async () => {
    const timer = openStartupWindow(externalIntegration, service);
    const waitForConnection = sinon.spy(externalIntegration, 'waitForConnection');
    // 10 actions waiting for a connection that never comes (20s deadline)
    const pending = Array.from({ length: MAX_PENDING_SCENE_ACTIONS }, () =>
      externalIntegration.runSceneAction(service, 'echo'),
    );
    for (let i = 0; i < 50 && waitForConnection.callCount < MAX_PENDING_SCENE_ACTIONS; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
    }
    expect(externalIntegration.pendingSceneActions.get(service.id)).to.equal(MAX_PENDING_SCENE_ACTIONS);
    expect(waitForConnection.callCount).to.equal(MAX_PENDING_SCENE_ACTIONS);
    // the 11th is rejected immediately, without entering the wait
    await expect(externalIntegration.runSceneAction(service, 'echo')).to.be.rejectedWith(
      ExternalIntegrationUnavailableError,
      'EXTERNAL_INTEGRATION_BUSY',
    );
    expect(waitForConnection.callCount).to.equal(MAX_PENDING_SCENE_ACTIONS);
    // the integration connects: the 10 commands are sent, then acked, refused
    // and timed out in turn — the count returns to 0 whatever the outcome
    const ws = buildFakeWs();
    await externalIntegration.integrationConnected(service, ws);
    await flushMicrotasks(ws);
    for (let i = 0; i < 20 && ws.send.callCount < MAX_PENDING_SCENE_ACTIONS; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.resolve();
    }
    expect(ws.send.callCount).to.equal(MAX_PENDING_SCENE_ACTIONS);
    const messageIds = ws.send.args.map(([raw]) => JSON.parse(raw).payload.message_id);
    messageIds.forEach((messageId, index) => {
      if (index % 2 === 0) {
        externalIntegration.handleCommandResult(service, { message_id: messageId, success: true });
      } else {
        externalIntegration.handleCommandResult(service, { message_id: messageId, success: false, error: 'busy' });
      }
    });
    const results = await Promise.allSettled(pending);
    expect(results.filter((result) => result.status === 'fulfilled')).to.have.lengthOf(5);
    expect(results.filter((result) => result.status === 'rejected')).to.have.lengthOf(5);
    expect(externalIntegration.pendingSceneActions.has(service.id)).to.equal(false);
    clearTimeout(timer);
    externalIntegration.clearTimers(service.id);
    clearInterval(ws.integrationPingInterval);
  });

  it('should hold one deadline over the connection wait and the ack', async () => {
    // only Date is faked: the wait itself is stubbed and moves the clock
    const clock = sinon.useFakeTimers({ toFake: ['Date'] });
    const shortService = await seedExternalService({
      name: 'ext-dev-short',
      selector: 'ext-dev-short',
      manifest: {
        ...TEST_SCENE_MANIFEST,
        scene_actions: [{ key: 'quick', label: { en: 'Quick' }, timeout_seconds: 5 }],
      },
    });
    // disconnected inside the startup window: the wait is bounded by the 5s
    // deadline, not by the 15s connection window, and the action is rejected
    // at the deadline without sending anything
    externalIntegration.waitForConnection = fake(async (waitedService, timeoutMs) => {
      clock.tick(timeoutMs);
      return false;
    });
    externalIntegration.sendCommand = fake.resolves({ success: true });
    await expect(externalIntegration.runSceneAction(shortService, 'quick')).to.be.rejectedWith(
      ExternalIntegrationUnavailableError,
      'EXTERNAL_INTEGRATION_COMMAND_TIMEOUT',
    );
    sinonAssert.calledOnceWithExactly(externalIntegration.waitForConnection, shortService, 5000);
    sinonAssert.notCalled(externalIntegration.sendCommand);
    expect(externalIntegration.pendingSceneActions.has(shortService.id)).to.equal(false);
    // connected after 2s: the ack gets what is left of the 5s
    externalIntegration.waitForConnection = fake(async () => {
      clock.tick(2000);
      return true;
    });
    await externalIntegration.runSceneAction(shortService, 'quick');
    expect(externalIntegration.sendCommand.firstCall.args[3]).to.deep.equal({ timeoutMs: 3000 });
    // a long action waits for the connection at most the connection window
    externalIntegration.waitForConnection = fake.resolves(true);
    await externalIntegration.runSceneAction(service, 'create_snapshot', { camera: `ext:${service.selector}:front` });
    expect(externalIntegration.waitForConnection.firstCall.args[1]).to.equal(15000);
  });

  it('should fail like any command outside the startup window when disconnected', async () => {
    await expect(externalIntegration.runSceneAction(service, 'echo')).to.be.rejectedWith(
      ExternalIntegrationUnavailableError,
      'EXTERNAL_INTEGRATION_NOT_CONNECTED',
    );
  });
});

describe('externalIntegration.normalizeSceneActionOutputs', () => {
  const declared = TEST_SCENE_MANIFEST.scene_actions[0].outputs;

  it('should whitelist and bound the outputs', () => {
    expect(
      normalizeSceneActionOutputs(
        { clip_id: 'x'.repeat(10001), count: 3, ok: false, undeclared: 'dropped', extra: { nested: true } },
        declared,
      ),
    ).to.deep.equal({ clip_id: 'x'.repeat(10000), count: 3, ok: false });
  });

  it('should coerce by the declared type and drop what cannot be coerced', () => {
    expect(normalizeSceneActionOutputs({ clip_id: { url: 'x' }, count: Infinity, ok: 'yes' }, declared)).to.deep.equal(
      {},
    );
    expect(normalizeSceneActionOutputs({ clip_id: 12, count: '3', ok: 'true' }, declared)).to.deep.equal({
      clip_id: '12',
      count: 3,
      ok: true,
    });
  });

  it('should return an empty object on a missing or non-object payload', () => {
    expect(normalizeSceneActionOutputs(undefined, declared)).to.deep.equal({});
    expect(normalizeSceneActionOutputs(null, declared)).to.deep.equal({});
    expect(normalizeSceneActionOutputs(['x'], declared)).to.deep.equal({});
    expect(normalizeSceneActionOutputs('x', declared)).to.deep.equal({});
  });
});

describe('externalIntegration scene proxy capability', () => {
  it('should expose scene.runAction on integrations declaring scene actions only', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const sceneService = await seedSceneService();
    const plainService = await seedExternalService({ name: 'ext-dev-plain', selector: 'ext-dev-plain' });
    const weatherService = await seedExternalService({
      name: 'ext-dev-weather',
      selector: 'ext-dev-weather',
      manifest: TEST_WEATHER_MANIFEST,
    });
    externalIntegration.registerProxyService(sceneService);
    externalIntegration.registerProxyService(plainService);
    externalIntegration.registerProxyService(weatherService);
    const sceneProxy = stateManager.get('service', sceneService.name);
    expect(sceneProxy.scene).to.have.property('runAction');
    expect(sceneProxy.device).to.have.property('setValue');
    expect(stateManager.get('service', plainService.name)).to.not.have.property('scene');
    const weatherProxy = stateManager.get('service', weatherService.name);
    expect(weatherProxy).to.not.have.property('scene');
    expect(weatherProxy.weather).to.have.property('get');
  });

  it('should relay scene.runAction to the supervisor with the service', async () => {
    const { externalIntegration, stateManager } = buildSupervisor();
    const sceneService = await seedSceneService();
    externalIntegration.registerProxyService(sceneService);
    externalIntegration.runSceneAction = fake.resolves({ clip_id: 'c' });
    const render = (value) => value;
    const outputs = await stateManager.get('service', sceneService.name).scene.runAction('echo', { a: 1 }, { render });
    expect(outputs).to.deep.equal({ clip_id: 'c' });
    sinonAssert.calledOnceWithExactly(externalIntegration.runSceneAction, sceneService, 'echo', { a: 1 }, { render });
  });
});

describe('externalIntegration.getSceneDeclarations', () => {
  it('should list the integrations declaring scene triggers or actions, in a reduced view', async () => {
    const { externalIntegration } = buildSupervisor();
    const sceneService = await seedSceneService({ status: SERVICE_STATUS.STOPPED });
    await seedExternalService({ name: 'ext-dev-plain', selector: 'ext-dev-plain', manifest: TEST_MANIFEST });
    await seedExternalService({ name: 'ext-dev-no-manifest', selector: 'ext-dev-no-manifest', manifest: null });
    const actionsOnly = await seedExternalService({
      name: 'ext-dev-actions-only',
      selector: 'ext-dev-actions-only',
      manifest: { ...TEST_MANIFEST, name: 'Actions only', scene_actions: TEST_SCENE_MANIFEST.scene_actions },
    });
    const integrations = await externalIntegration.getSceneDeclarations();
    expect(integrations).to.deep.equal([
      {
        selector: actionsOnly.selector,
        name: 'Actions only',
        status: SERVICE_STATUS.RUNNING,
        scene_triggers: [],
        scene_actions: TEST_SCENE_MANIFEST.scene_actions,
      },
      {
        selector: sceneService.selector,
        name: 'Frigate Demo',
        status: SERVICE_STATUS.STOPPED,
        scene_triggers: TEST_SCENE_MANIFEST.scene_triggers,
        scene_actions: TEST_SCENE_MANIFEST.scene_actions,
      },
    ]);
  });
});
