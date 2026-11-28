const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const loadMatter = () => ({});
const MatterBridgeMock = sinon.stub();
MatterBridgeMock.prototype.start = sinon.stub().resolves();
MatterBridgeMock.prototype.stop = sinon.stub().resolves();
MatterBridgeMock.prototype.backup = sinon.stub().resolves();
MatterBridgeMock.prototype.isEnabled = sinon.stub().resolves(true);

const MatterBridgeService = proxyquire('../../../services/matter-bridge/index', {
  './lib/MatterBridge': MatterBridgeMock,
  './lib/loadMatter': { loadMatter },
});

describe('MatterBridgeService', () => {
  const scheduledJob = { cancel: sinon.stub() };
  const gladys = {
    // Like the Gladys job wrapper: runs the function, reports a failure by rejecting.
    job: { wrapper: sinon.stub().callsFake((type, func) => sinon.spy((...args) => func(...args, 'job-id'))) },
    scheduler: { scheduleJob: sinon.stub().returns(scheduledJob) },
  };
  const service = MatterBridgeService(gladys, 'service-id');
  const [backupJobType] = gladys.job.wrapper.firstCall.args;
  const backupJob = gladys.job.wrapper.firstCall.returnValue;
  let scheduled;

  afterEach(() => {
    sinon.resetHistory();
  });

  it('should hand the bridge a loader of the matter.js modules, not the modules', () => {
    sinon.assert.calledOnceWithExactly(MatterBridgeMock, gladys, 'service-id', loadMatter);
    expect(service.controllers).to.have.property('get /api/v1/service/matter-bridge/status');
  });

  it('should start the bridge and schedule its nightly backup once', async () => {
    await service.start();
    await service.start();
    sinon.assert.calledTwice(service.bridge.start);
    sinon.assert.calledOnceWithExactly(gladys.scheduler.scheduleJob, '0 20 4 * * *', sinon.match.func);
    expect(backupJobType).to.equal('service-matter-bridge-backup');
    [, scheduled] = gladys.scheduler.scheduleJob.firstCall.args;
  });

  it('should back up the bridge from the scheduled job, and log a failed backup', async () => {
    await scheduled();
    sinon.assert.calledOnce(service.bridge.backup);
    service.bridge.backup.rejects(new Error('disk full'));
    await scheduled();
    sinon.assert.calledTwice(service.bridge.backup);
    service.bridge.backup.resolves();
  });

  it('should not run the backup job, which records itself, while the bridge is off', async () => {
    service.bridge.isEnabled.resolves(false);
    await scheduled();
    // The job wrapper is what records the job.
    sinon.assert.notCalled(backupJob);
    sinon.assert.notCalled(service.bridge.backup);
    service.bridge.isEnabled.resolves(true);
  });

  it('should stop the bridge and cancel its backup', async () => {
    await service.stop();
    sinon.assert.calledOnce(service.bridge.stop);
    sinon.assert.calledOnce(scheduledJob.cancel);
    await service.stop();
    sinon.assert.calledOnce(scheduledJob.cancel);
  });
});
