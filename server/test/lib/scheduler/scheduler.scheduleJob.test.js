const EventEmitter = require('events');
const sinon = require('sinon');

const { fake, assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const nodeScheduleMock = {
  scheduleJob: fake.returns(true),
};

const Scheduler = proxyquire('../../../lib/scheduler', {
  'node-schedule': nodeScheduleMock,
});

const event = new EventEmitter();

describe('Scheduler scheduleJob', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = new Scheduler(event);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should schedule cron rules job', async () => {
    const rule = '*/5 * * * * *';
    const jobMethod = fake.returns(true);

    scheduler.scheduleJob(rule, jobMethod);

    assert.calledOnceWithExactly(nodeScheduleMock.scheduleJob, rule, jobMethod);
  });

  it('should schedule object ruled job', async () => {
    const rule = { hour: 2 };
    const jobMethod = fake.returns(true);

    scheduler.scheduleJob(rule, jobMethod);

    assert.calledOnceWithExactly(nodeScheduleMock.scheduleJob, rule, jobMethod);
  });

  it('should schedule data ruled job', async () => {
    const rule = new Date();
    const jobMethod = fake.returns(true);

    scheduler.scheduleJob(rule, jobMethod);

    assert.calledOnceWithExactly(nodeScheduleMock.scheduleJob, rule, jobMethod);
  });
});
