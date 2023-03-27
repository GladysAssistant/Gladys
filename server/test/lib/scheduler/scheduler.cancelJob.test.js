const EventEmitter = require('events');
const sinon = require('sinon');

const { fake, assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const nodeScheduleMock = {
  cancelJob: fake.returns(true),
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

  it('should cancel job', async () => {
    scheduler.cancelJob('my-job');
    assert.calledOnceWithExactly(nodeScheduleMock.cancelJob, 'my-job');
  });
});
