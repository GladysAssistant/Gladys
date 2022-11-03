const EventEmitter = require('events');
const sinon = require('sinon');

const { fake, assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const nodeScheduleMock = {
  scheduleJob: fake.returns(true),
  RecurrenceRule: fake.returns({ reccurent: true }),
};

const Scheduler = proxyquire('../../../lib/scheduler', {
  'node-schedule': nodeScheduleMock,
});

const event = new EventEmitter();

describe('Scheduler cancelJob', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = new Scheduler(event);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should schedule cron rules job', async () => {
    const jobName = 'my-job';
    const rule = '*/5 * * * * *';
    const jobMethod = fake.returns(true);

    scheduler.scheduleJob(jobName, rule, jobMethod);

    assert.notCalled(nodeScheduleMock.RecurrenceRule);
    assert.calledOnceWithExactly(nodeScheduleMock.scheduleJob, jobName, rule, jobMethod);
  });

  it('should schedule object ruled job', async () => {
    const jobName = 'my-job';
    const rule = { hour: 2 };
    const jobMethod = fake.returns(true);

    scheduler.scheduleJob(jobName, rule, jobMethod);

    assert.calledWithNew(nodeScheduleMock.RecurrenceRule);
    assert.calledOnceWithExactly(nodeScheduleMock.scheduleJob, jobName, { reccurent: true, hour: 2 }, jobMethod);
  });
});
