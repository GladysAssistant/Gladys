const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES, JOB_TYPES, JOB_STATUS } = require('../../../utils/constants');

const Job = require('../../../lib/job');

const event = {
  emit: fake.returns(null),
};

describe('Job', () => {
  describe('job.create', () => {
    const job = new Job(event);
    it('should create a job', async () => {
      const newJob = await job.start(JOB_TYPES.DAILY_DEVICE_STATE_AGGREGATE);
      expect(newJob).to.have.property('type', JOB_TYPES.DAILY_DEVICE_STATE_AGGREGATE);
      expect(newJob).to.have.property('status', JOB_STATUS.IN_PROGRESS);
      assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.JOB.NEW,
        payload: newJob,
      });
    });
  });
  describe('job.finish', () => {
    const job = new Job(event);
    it('should finish a job', async () => {
      const newJob = await job.start(JOB_TYPES.DAILY_DEVICE_STATE_AGGREGATE);
      const updatedJob = await job.finish(newJob.id, JOB_STATUS.SUCCESS, {});
      assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.JOB.UPDATED,
        payload: updatedJob,
      });
    });
  });
  describe('job.updateProgress', () => {
    const job = new Job(event);
    it('should update the progress a job', async () => {
      const newJob = await job.start(JOB_TYPES.DAILY_DEVICE_STATE_AGGREGATE);
      const updatedJob = await job.updateProgress(newJob.id, 50);
      assert.calledWith(event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.JOB.UPDATED,
        payload: updatedJob,
      });
    });
  });
  describe('job.get', () => {
    const job = new Job(event);
    it('should get all job', async () => {
      await job.start(JOB_TYPES.DAILY_DEVICE_STATE_AGGREGATE);
      const jobs = await job.get();
      expect(jobs).to.be.instanceOf(Array);
      jobs.forEach((oneJob) => {
        expect(oneJob).to.have.property('type');
      });
    });
    it('should get 0 job', async () => {
      await job.start(JOB_TYPES.DAILY_DEVICE_STATE_AGGREGATE);
      const jobs = await job.get({
        take: 0,
      });
      expect(jobs).to.be.instanceOf(Array);
      expect(jobs).to.have.lengthOf(0);
    });
  });
  describe('job.wrapper', () => {
    const job = new Job(event);
    it('should test wrapper', async () => {
      const wrapped = job.wrapper(JOB_TYPES.DAILY_DEVICE_STATE_AGGREGATE, () => {});
      await wrapped();
      const jobs = await job.get();
      expect(jobs).to.be.instanceOf(Array);
      const lastJob = jobs[0];
      expect(lastJob).to.have.property('status', JOB_STATUS.SUCCESS);
    });
    it('should test wrapper with failed job', async () => {
      const wrapped = job.wrapper(JOB_TYPES.DAILY_DEVICE_STATE_AGGREGATE, () => {
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
