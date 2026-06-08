const { expect } = require('chai');
const { fake, assert } = require('sinon');

const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');
const { scheduleWeeklyDigest } = require('../../../lib/gateway/gateway.scheduleWeeklyDigest');

describe('gateway.scheduleWeeklyDigest', () => {
  let gateway;
  let cancel;

  beforeEach(() => {
    cancel = fake();
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
    scheduledCallback();
    assert.calledOnce(gateway.sendWeeklyDigest);
  });

  it('should cancel previous schedule before creating a new one', async () => {
    gateway.weeklyDigestSchedule = { cancel };

    await scheduleWeeklyDigest.call(gateway);

    assert.calledOnce(cancel);
    assert.calledOnce(gateway.scheduler.scheduleJob);
  });
});
