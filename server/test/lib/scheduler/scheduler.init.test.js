const sinon = require('sinon');

const { fake, assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const nodeScheduleMock = {};

const jobs = require('../../../config/scheduler-jobs');

const Scheduler = proxyquire('../../../lib/scheduler', {
  'node-schedule': nodeScheduleMock,
});

describe('Scheduler init', () => {
  let scheduler;
  let event;

  beforeEach(() => {
    nodeScheduleMock.scheduleJob = fake.returns(true);
    event = {
      emit: fake.returns(true),
    };
    scheduler = new Scheduler(event);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should init scheduler', async () => {
    scheduler.init();

    // Check that all jobs are registered
    assert.callCount(nodeScheduleMock.scheduleJob, jobs.length);

    jobs.forEach((job, index) => {
      // Check that each job well registered
      assert.calledWithMatch(nodeScheduleMock.scheduleJob, job.rule, sinon.match.func);
      // Force method call
      nodeScheduleMock.scheduleJob.getCall(index).callback();
      // Check that method is well sending the right event
      assert.calledWithExactly(event.emit, job.event);
    });

    // Check that all jobs are executed
    assert.callCount(event.emit, jobs.length);
  });
});
