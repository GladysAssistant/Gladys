const { EventEmitter } = require('events');
const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire');

const { EVENTS } = require('../../../../utils/constants');
const { getLocalDpsFromCode } = require('../../../../services/tuya/lib/device/tuya.localMapping');

// Isolated sandbox so this file never touches the global sinon state other test files rely on.
const sandbox = sinon.createSandbox();

const tuyapiInstances = [];
const newgenInstances = [];

class FakeTuyapi extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.connect = sandbox.stub().resolves();
    this.disconnect = sandbox.stub();
    tuyapiInstances.push(this);
  }
}

class FakeTuyapiNewGen extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.connect = sandbox.stub().resolves();
    this.disconnect = sandbox.stub();
    newgenInstances.push(this);
  }
}

const persistentConnection = proxyquire('../../../../services/tuya/lib/tuya.persistentConnection', {
  tuyapi: FakeTuyapi,
  '@demirdeniz/tuyapi-newgen': FakeTuyapiNewGen,
});

const buildDevice = (protocolVersion = '3.3') => ({
  external_id: 'tuya:testid',
  device_type: 'smart-socket',
  params: [
    { name: 'IP_ADDRESS', value: '10.0.0.5' },
    { name: 'LOCAL_KEY', value: 'local-key' },
    { name: 'PROTOCOL_VERSION', value: protocolVersion },
    { name: 'LOCAL_OVERRIDE', value: true },
  ],
  features: [
    {
      external_id: 'tuya:testid:switch_1',
      selector: 'tuya-testid-switch-1',
      category: 'switch',
      type: 'binary',
      last_value: 0,
    },
    {
      external_id: 'tuya:testid:switch_2',
      selector: 'tuya-testid-switch-2',
      category: 'switch',
      type: 'binary',
      last_value: 0,
    },
  ],
});

const buildSelf = () => {
  const self = {
    gladys: {
      event: { emit: sandbox.stub() },
      stateManager: { get: () => undefined },
      variable: { getValue: sandbox.stub().resolves(null) },
      device: { get: sandbox.stub().resolves([]) },
    },
    serviceId: 'service-id',
    degradedDevices: {},
    persistentConnections: {},
    persistentPushEnabled: true,
  };
  Object.assign(self, persistentConnection);
  return self;
};

const lastTuyapi = () => tuyapiInstances[tuyapiInstances.length - 1];

describe('Tuya persistent connection', () => {
  beforeEach(() => {
    tuyapiInstances.length = 0;
    newgenInstances.length = 0;
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should open a connection and mark it healthy on connected', () => {
    const self = buildSelf();
    self.startPersistentConnectionForDevice(buildDevice());

    const instance = lastTuyapi();
    expect(instance).to.not.equal(undefined);
    expect(instance.connect.calledOnce).to.equal(true);

    instance.emit('connected');

    expect(self.persistentConnections.testid.status).to.equal('connected');
    expect(self.isPersistentConnectionHealthy('testid')).to.equal(true);
  });

  it('should emit a Gladys state on a pushed data event', () => {
    const self = buildSelf();
    const device = buildDevice();
    self.startPersistentConnectionForDevice(device);
    const instance = lastTuyapi();
    instance.emit('connected');

    const dpsKey = getLocalDpsFromCode('switch_1', device);
    instance.emit('data', { dps: { [dpsKey]: true } });

    sinon.assert.calledWith(self.gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tuya:testid:switch_1',
      state: 1,
    });
  });

  it('should only emit the pushed feature on a partial dp-refresh', () => {
    const self = buildSelf();
    const device = buildDevice();
    self.startPersistentConnectionForDevice(device);
    const instance = lastTuyapi();
    instance.emit('connected');

    const dpsKey = getLocalDpsFromCode('switch_2', device);
    instance.emit('dp-refresh', { dps: { [dpsKey]: true } });

    const newStateCalls = self.gladys.event.emit.getCalls().filter((call) => call.args[0] === EVENTS.DEVICE.NEW_STATE);
    expect(newStateCalls).to.have.lengthOf(1);
    expect(newStateCalls[0].args[1].device_feature_external_id).to.equal('tuya:testid:switch_2');
  });

  it('should retry on disconnect and give up as failed after the max retries', async () => {
    const clock = sandbox.useFakeTimers();
    const self = buildSelf();
    const device = buildDevice();
    self.startPersistentConnectionForDevice(device);

    // 3 bounded retries (3s, 10s, 30s) then the 4th drop marks it failed.
    lastTuyapi().emit('disconnected');
    await clock.tickAsync(3000);
    lastTuyapi().emit('disconnected');
    await clock.tickAsync(10000);
    lastTuyapi().emit('disconnected');
    await clock.tickAsync(30000);
    lastTuyapi().emit('disconnected');

    expect(self.persistentConnections.testid.status).to.equal('failed');
    expect(self.isPersistentConnectionHealthy('testid')).to.equal(false);
  });

  it('should route protocol 3.5 devices to the new-gen library', () => {
    const self = buildSelf();
    self.startPersistentConnectionForDevice(buildDevice('3.5'));

    expect(newgenInstances).to.have.lengthOf(1);
    expect(tuyapiInstances).to.have.lengthOf(0);
  });

  it('should open nothing when the kill-switch is disabled', async () => {
    const self = buildSelf();
    self.gladys.variable.getValue = sandbox.stub().resolves('0');
    self.gladys.device.get = sandbox.stub().resolves([buildDevice()]);

    await self.startPersistentConnections();

    expect(self.persistentPushEnabled).to.equal(false);
    expect(Object.keys(self.persistentConnections)).to.have.lengthOf(0);
    expect(tuyapiInstances).to.have.lengthOf(0);
  });

  it('should start a connection per local device via startPersistentConnections', async () => {
    const self = buildSelf();
    self.gladys.device.get = sandbox.stub().resolves([buildDevice()]);

    await self.startPersistentConnections();

    expect(self.persistentConnections.testid).to.not.equal(undefined);
    expect(tuyapiInstances).to.have.lengthOf(1);
  });

  it('should recycle a stale connection by tearing it down and scheduling a reconnect', () => {
    const clock = sandbox.useFakeTimers();
    const self = buildSelf();
    self.startPersistentConnectionForDevice(buildDevice());
    const instance = lastTuyapi();
    instance.emit('connected');

    self.recyclePersistentConnection('testid');

    expect(instance.disconnect.calledOnce).to.equal(true);
    expect(self.persistentConnections.testid.status).to.equal('reconnecting');
    clock.restore();
  });

  it('should tear down connections and clear state on stop', () => {
    const self = buildSelf();
    self.startPersistentConnectionForDevice(buildDevice());
    const instance = lastTuyapi();

    self.stopPersistentConnections();

    expect(instance.disconnect.calledOnce).to.equal(true);
    expect(self.persistentConnections).to.deep.equal({});
  });

  it('should send a command over the open persistent connection', async () => {
    const self = buildSelf();
    self.startPersistentConnectionForDevice(buildDevice());
    const instance = lastTuyapi();
    instance.set = sandbox.stub().resolves();
    instance.emit('connected');

    const sent = await self.sendCommandViaPersistentConnection('testid', 1, true);

    expect(sent).to.equal(true);
    sinon.assert.calledWith(instance.set, { dps: 1, set: true });
  });

  it('should not send a command when no persistent connection is connected', async () => {
    const self = buildSelf();
    const sent = await self.sendCommandViaPersistentConnection('testid', 1, true);
    expect(sent).to.equal(false);
  });

  it('should become unhealthy after the max-silence window', () => {
    const clock = sandbox.useFakeTimers();
    const self = buildSelf();
    self.startPersistentConnectionForDevice(buildDevice());
    lastTuyapi().emit('connected');

    expect(self.isPersistentConnectionHealthy('testid')).to.equal(true);
    clock.tick(91 * 1000);
    expect(self.isPersistentConnectionHealthy('testid')).to.equal(false);
  });
});

describe('TuyaHandler.poll persistent coexistence gate', () => {
  const gateSandbox = sinon.createSandbox();

  const buildPollSelf = () => ({
    gladys: { event: { emit: gateSandbox.stub() }, stateManager: { get: () => undefined } },
    degradedDevices: {},
    connector: { request: gateSandbox.stub().resolves({ result: [] }) },
  });

  afterEach(() => gateSandbox.restore());

  it('should skip the local poll and cloud when the persistent connection is healthy', async () => {
    const localPoll = gateSandbox.stub().resolves({ dps: {} });
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
    });
    const self = buildPollSelf();
    self.isPersistentConnectionHealthy = gateSandbox.stub().returns(true);

    await poll.call(self, buildDevice());

    expect(localPoll.called).to.equal(false);
    expect(self.connector.request.called).to.equal(false);
    expect(self.isPersistentConnectionHealthy.calledWith('testid')).to.equal(true);
  });

  it('should run the normal local poll when the persistent connection is not healthy', async () => {
    const localPoll = gateSandbox.stub().resolves({ dps: {} });
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
    });
    const self = buildPollSelf();
    self.isPersistentConnectionHealthy = gateSandbox.stub().returns(false);

    await poll.call(self, buildDevice());

    expect(localPoll.calledOnce).to.equal(true);
  });

  it('should skip the local poll but refresh via cloud when the socket is connected but silent', async () => {
    const localPoll = gateSandbox.stub().resolves({ dps: {} });
    const { poll } = proxyquire('../../../../services/tuya/lib/tuya.poll', {
      './tuya.localPoll': { localPoll },
    });
    const self = buildPollSelf();
    self.isPersistentConnectionHealthy = gateSandbox.stub().returns(false);
    self.isPersistentConnectionConnected = gateSandbox.stub().returns(true);

    await poll.call(self, buildDevice());

    expect(localPoll.called).to.equal(false);
    expect(self.connector.request.called).to.equal(true);
  });
});
