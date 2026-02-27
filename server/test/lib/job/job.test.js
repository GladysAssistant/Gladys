const { expect } = require('chai');
const chaiAssert = require('chai').assert;
const sinon = require('sinon');
const db = require('../../../models');
const logger = require('../../../utils/logger');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES, JOB_TYPES, JOB_STATUS, JOB_ERROR_TYPES } = require('../../../utils/constants');

const Job = require('../../../lib/job');

const event = {
  emit: fake.returns(null),
  on: fake.returns(null),
};

describe('Job', () => {
  let sandbox;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    await db.Job.destroy({ where: {}, truncate: true, cascade: true });
  });

  afterEach(async () => {
    sandbox.restore();
    await db.Job.destroy({ where: {}, truncate: true, cascade: true });
  });

  describe('job.create', () => {
    const job = new Job(event);
    it('should create a job', async () => {
      const newJob = await job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP);
      expect(newJob).to.have.property('type', JOB_TYPES.GLADYS_GATEWAY_BACKUP);
      expect(newJob).to.have.property('status', JOB_STATUS.IN_PROGRESS);
      assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.JOB.NEW,
        payload: newJob,
      });
    });
    it('should not create a job, invalid type', async () => {
      const promise = job.start('THIS_JOB_TYPES_DOESNT_EXIST');
      return chaiAssert.isRejected(promise, 'Validation error: Validation isIn on type failed');
    });
    it('should not create a job, invalid data', async () => {
      const promise = job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP, []);
      return chaiAssert.isRejected(promise, 'Validation error: "value" must be of type object');
    });
  });
  describe('job.finish', () => {
    const job = new Job(event);
    it('should finish a job', async () => {
      const newJob = await job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP);
      const updatedJob = await job.finish(newJob.id, JOB_STATUS.SUCCESS, {});
      assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.JOB.UPDATED,
        payload: updatedJob,
      });
    });
    it('should not finish job, job doesnt exist', async () => {
      const promise = job.finish('JOB_DOESNT_EXIST', JOB_STATUS.SUCCESS, {});
      return chaiAssert.isRejected(promise, 'Job not found');
    });
    it('should merge data when finishing a job', async () => {
      const newJob = await job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP, { scope: 'all' });
      const updatedJob = await job.finish(newJob.id, JOB_STATUS.FAILED, {
        error_type: JOB_ERROR_TYPES.UNKNOWN_ERROR,
        current_date: null,
      });
      expect(updatedJob.data.scope).to.equal('all');
      expect(updatedJob.data.error_type).to.equal(JOB_ERROR_TYPES.UNKNOWN_ERROR);
      expect(updatedJob.data.current_date).to.equal(undefined);
    });
  });
  describe('job.wrapper', () => {
    const job = new Job(event);

    it('should log warning if buildJobData throws', async () => {
      const warnStub = sandbox.stub(logger, 'warn');
      const startStub = sandbox
        .stub(job, 'start')
        .resolves({ id: 'job-id', status: JOB_STATUS.IN_PROGRESS, type: JOB_TYPES.GLADYS_GATEWAY_BACKUP });
      const finishStub = sandbox.stub(job, 'finish').resolves({});

      const failingBuild = sinon.stub().throws(new Error('boom'));
      const wrapped = job.wrapper(JOB_TYPES.GLADYS_GATEWAY_BACKUP, fake.resolves('ok'), {
        buildJobData: failingBuild,
      });

      await wrapped();
      expect(warnStub.calledOnce).to.equal(true);
      startStub.restore();
      finishStub.restore();
      warnStub.restore();
    });

    it('should start a job with buildJobData and finish it', async () => {
      const startStub = sandbox
        .stub(job, 'start')
        .callsFake(async (type, data) => ({ id: 'job-id', type, status: JOB_STATUS.IN_PROGRESS, data }));
      const finishStub = sandbox.stub(job, 'finish').resolves({});
      const wrapped = job.wrapper(JOB_TYPES.GLADYS_GATEWAY_BACKUP, fake.resolves('ok'), {
        buildJobData: fake.returns({ scope: 'all', period: { start_date: '2025-01-01', end_date: null } }),
      });

      const result = await wrapped();
      expect(result).to.equal('ok');

      sinon.assert.calledWith(startStub, JOB_TYPES.GLADYS_GATEWAY_BACKUP, {
        scope: 'all',
        period: { start_date: '2025-01-01', end_date: null },
      });
      sinon.assert.calledWith(finishStub, 'job-id', JOB_STATUS.SUCCESS);
    });
  });
  describe('job.updateProgress', () => {
    const job = new Job(event);
    it('should update the progress a job', async () => {
      const newJob = await job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP);
      const updatedJob = await job.updateProgress(newJob.id, 50);
      assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.JOB.UPDATED,
        payload: updatedJob,
      });
    });
    it('should not update the progress a job, invalid progress', async () => {
      const newJob = await job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP);
      const promise = job.updateProgress(newJob.id, 101);
      return chaiAssert.isRejected(promise, 'Validation error: Validation max on progress failed');
    });
    it('should not update the progress a job, invalid progress', async () => {
      const newJob = await job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP);
      const promise = job.updateProgress(newJob.id, -1);
      return chaiAssert.isRejected(promise, 'Validation error: Validation min on progress failed');
    });
    it('should update progress and merge data patch', async () => {
      const newJob = await job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP, { scope: 'all' });
      const withDate = await job.updateProgress(newJob.id, 10, { current_date: '2025-01-01' });
      expect(withDate.data.current_date).to.equal('2025-01-01');
      const cleared = await job.updateProgress(newJob.id, 20, { current_date: null });
      expect(cleared.data.current_date).to.equal(undefined);
    });
    it('should throw when job not found', async () => {
      const promise = job.updateProgress('00000000-0000-0000-0000-000000000000', 5);
      await chaiAssert.isRejected(promise, 'Job not found');
    });
  });
  describe('job.get', () => {
    const job = new Job(event);
    it('should get all job', async () => {
      await job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP);
      const jobs = await job.get();
      expect(jobs).to.be.instanceOf(Array);
      jobs.forEach((oneJob) => {
        expect(oneJob).to.have.property('type');
      });
    });
    it('should get gateway backup job only', async () => {
      await job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP);
      await job.start(JOB_TYPES.VACUUM);
      const jobs = await job.get({ type: JOB_TYPES.GLADYS_GATEWAY_BACKUP });
      expect(jobs).to.be.instanceOf(Array);
      jobs.forEach((oneJob) => {
        expect(oneJob).to.have.property('type', JOB_TYPES.GLADYS_GATEWAY_BACKUP);
      });
    });
    it('should get 0 job', async () => {
      await job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP);
      const jobs = await job.get({
        take: 0,
      });
      expect(jobs).to.be.instanceOf(Array);
      expect(jobs).to.have.lengthOf(0);
    });
  });
  describe('job.init', () => {
    const job = new Job(event);
    it('should init jobs and mark unfinished jobs as failed', async () => {
      const jobCreated = await job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP);
      await job.init();
      const jobs = await job.get();
      expect(jobs).to.be.instanceOf(Array);
      const jobsFiltered = jobs
        .filter((oneJob) => oneJob.id === jobCreated.id)
        .map((oneJob) => ({ type: oneJob.type, status: oneJob.status, data: oneJob.data }));
      expect(jobsFiltered).to.deep.equal([
        {
          type: 'gladys-gateway-backup',
          status: 'failed',
          data: { error_type: 'purged-when-restarted' },
        },
      ]);
    });
  });
  describe('job.purge', () => {
    const job = new Job(event);
    it('should purge old jobs', async () => {
      await job.start(JOB_TYPES.GLADYS_GATEWAY_BACKUP);
      const dateInThePast = new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000);
      await db.Job.update({ created_at: dateInThePast }, { where: {} });
      await job.purge();
      const jobs = await job.get();
      expect(jobs).to.deep.equal([]);
    });
  });
  describe('job.wrapper', () => {
    const job = new Job(event);
    it('should test wrapper', async () => {
      const wrapped = job.wrapper(JOB_TYPES.GLADYS_GATEWAY_BACKUP, () => {});
      await wrapped();
      const jobs = await job.get();
      expect(jobs).to.be.instanceOf(Array);
      const lastJob = jobs[0];
      expect(lastJob).to.have.property('status', JOB_STATUS.SUCCESS);
    });
    it('should test wrapper with failed job', async () => {
      const wrapped = job.wrapper(JOB_TYPES.GLADYS_GATEWAY_BACKUP, () => {
        throw new Error('failed');
      });
      try {
        await wrapped();
      } catch (e) {
        // normal
      }

      const jobs = await job.get();
      expect(jobs).to.be.instanceOf(Array);
      const lastJob = jobs[0];
      expect(lastJob).to.have.property('status', JOB_STATUS.FAILED);
    });
  });
  describe('job.wrapperDetached', () => {
    const job = new Job(event);
    const sleep = (ms) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    const waitForStatus = async (jobId, status, attempts = 0) => {
      const jobs = await job.get();
      const current = jobs.find((oneJob) => oneJob.id === jobId);
      if (current && current.status === status) {
        return current;
      }
      if (attempts >= 40) {
        throw new Error(`Timeout waiting for job ${jobId} to reach status ${status}`);
      }
      await sleep(10);
      return waitForStatus(jobId, status, attempts + 1);
    };

    it('should run wrapperDetached', async () => {
      const wrapped = job.wrapperDetached(JOB_TYPES.GLADYS_GATEWAY_BACKUP, () => {});
      const startedJob = await wrapped();
      expect(startedJob).to.have.property('id');

      const finishedJob = await waitForStatus(startedJob.id, JOB_STATUS.SUCCESS);
      expect(finishedJob).to.have.property('status', JOB_STATUS.SUCCESS);
    });

    it('should run wrapperDetached with failed job', async () => {
      const wrapped = job.wrapperDetached(JOB_TYPES.GLADYS_GATEWAY_BACKUP, () => {
        throw new Error('failed');
      });
      const startedJob = await wrapped();
      expect(startedJob).to.have.property('id');

      const finishedJob = await waitForStatus(startedJob.id, JOB_STATUS.FAILED);
      expect(finishedJob).to.have.property('status', JOB_STATUS.FAILED);
      expect(finishedJob.data.error).to.include('failed');
    });

    it('should run wrapperDetached with custom buildJobData', async () => {
      const wrapped = job.wrapperDetached(JOB_TYPES.GLADYS_GATEWAY_BACKUP, () => {}, {
        buildJobData: async () => ({ scope: 'custom' }),
      });
      const startedJob = await wrapped();
      const finishedJob = await waitForStatus(startedJob.id, JOB_STATUS.SUCCESS);
      expect(finishedJob.data).to.deep.include({ scope: 'custom' });
    });

    it('should ignore buildJobData error in wrapperDetached', async () => {
      const wrapped = job.wrapperDetached(JOB_TYPES.GLADYS_GATEWAY_BACKUP, () => {}, {
        buildJobData: async () => {
          throw new Error('bd-fail');
        },
      });
      const startedJob = await wrapped();
      const finishedJob = await waitForStatus(startedJob.id, JOB_STATUS.SUCCESS);
      expect(finishedJob.status).to.equal(JOB_STATUS.SUCCESS);
    });

    it('should log finish error when job.finish fails in wrapperDetached', async () => {
      const finishStub = sandbox.stub(job, 'finish').rejects(new Error('finish-fail'));
      const wrapped = job.wrapperDetached(JOB_TYPES.GLADYS_GATEWAY_BACKUP, () => {
        throw new Error('boom');
      });
      const startedJob = await wrapped();
      // Even if finish fails, we should still get a job object back
      expect(startedJob).to.have.property('id');
      finishStub.restore();
    });
  });
});
