const { expect } = require('chai');
const chaiAssert = require('chai').assert;
const sinon = require('sinon');
const db = require('../../../models');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES, JOB_TYPES, JOB_STATUS } = require('../../../utils/constants');

const Job = require('../../../lib/job');

const event = {
  emit: fake.returns(null),
  on: fake.returns(null),
};

describe('Job', () => {
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
});
