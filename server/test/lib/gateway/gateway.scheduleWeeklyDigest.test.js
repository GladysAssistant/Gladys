const { expect } = require('chai');
const { fake, assert, stub, useFakeTimers } = require('sinon');

const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const {
  scheduleWeeklyDigest,
  getWeeklyDigestRandomDelayMs,
  WEEKLY_DIGEST_MAX_RANDOM_DELAY_MS,
} = require('../../../lib/gateway/gateway.scheduleWeeklyDigest');

describe('gateway.scheduleWeeklyDigest', () => {
  let gateway;
  let cancel;
  let clock;
  let randomStub;

  beforeEach(() => {
    cancel = fake();
    clock = useFakeTimers();
    randomStub = stub(Math, 'random').returns(0);
    gateway = {
      weeklyDigestSchedule: null,
      variable: {
        getValue: fake(async (name) => {
          if (name === SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_ENABLED) {
            return '1';
          }
          if (name === SYSTEM_VARIABLE_NAMES.TIMEZONE) {
            return 'Europe/Paris';
          }
          if (name === SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_DAY) {
            return '0';
          }
          if (name === SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_HOUR) {
            return '18';
          }
          return null;
        }),
      },
      scheduler: {
        scheduleJob: fake.returns({ cancel: fake() }),
      },
      sendWeeklyDigest: fake.resolves({ sent: 0 }),
    };
  });

  afterEach(() => {
    randomStub.restore();
    clock.restore();
  });

  it('should cancel existing schedule when disabled', async () => {
    gateway.weeklyDigestSchedule = { cancel };
    gateway.variable.getValue = fake(async (name) => {
      if (name === SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_ENABLED) {
        return '0';
      }
      return null;
    });

    const result = await scheduleWeeklyDigest.call(gateway);

    expect(result).to.equal(null);
    assert.calledOnce(cancel);
    assert.notCalled(gateway.scheduler.scheduleJob);
  });

  it('should schedule weekly digest when enabled', async () => {
    const result = await scheduleWeeklyDigest.call(gateway);

    expect(result).to.equal(null);
    assert.calledOnce(gateway.scheduler.scheduleJob);
    assert.calledWith(gateway.scheduler.scheduleJob, {
      tz: 'Europe/Paris',
      dayOfWeek: 0,
      hour: 18,
      minute: 0,
      second: 0,
    });

    const scheduledCallback = gateway.scheduler.scheduleJob.firstCall.args[1];
    await scheduledCallback();
    assert.calledOnce(gateway.sendWeeklyDigest);
  });

  it('should catch errors from sendWeeklyDigest in scheduled callback', async () => {
    gateway.sendWeeklyDigest = fake.rejects(new Error('boom'));

    await scheduleWeeklyDigest.call(gateway);

    const scheduledCallback = gateway.scheduler.scheduleJob.firstCall.args[1];
    await scheduledCallback();

    assert.calledOnce(gateway.sendWeeklyDigest);
  });

  it('should not throw when scheduling fails', async () => {
    gateway.variable.getValue = fake.rejects(new Error('db unavailable'));

    const result = await scheduleWeeklyDigest.call(gateway);

    expect(result).to.equal(null);
    assert.notCalled(gateway.scheduler.scheduleJob);
  });

  it('should cancel previous schedule before creating a new one', async () => {
    gateway.weeklyDigestSchedule = { cancel };

    await scheduleWeeklyDigest.call(gateway);

    assert.calledOnce(cancel);
    assert.calledOnce(gateway.scheduler.scheduleJob);
  });

  it('should wait a random delay before sending the weekly digest', async () => {
    randomStub.returns(0.5);

    await scheduleWeeklyDigest.call(gateway);

    const scheduledCallback = gateway.scheduler.scheduleJob.firstCall.args[1];
    const callbackPromise = scheduledCallback();

    assert.notCalled(gateway.sendWeeklyDigest);

    await clock.tickAsync(30500);
    await callbackPromise;

    assert.calledOnce(gateway.sendWeeklyDigest);
  });
});

describe('getWeeklyDigestRandomDelayMs', () => {
  it('should return a value between 0 and 60 seconds', () => {
    for (let i = 0; i < 100; i += 1) {
      const delayMs = getWeeklyDigestRandomDelayMs();
      expect(delayMs).to.be.at.least(0);
      expect(delayMs).to.be.at.most(WEEKLY_DIGEST_MAX_RANDOM_DELAY_MS);
    }
  });
});
