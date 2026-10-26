const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
const EnedisService = require('../../../services/enedis');

const gladys = {
  scheduler: {
    scheduleJob: fake.returns(null),
  },
  job: {
    wrapper: (type, func) => func,
  },
};

describe('EnedisService', () => {
  it('should start service', async () => {
    const enedisService = EnedisService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await enedisService.start();
    assert.calledOnce(gladys.scheduler.scheduleJob);
  });
  it('should skip the scheduled sync while the Gladys Plus subscription is not paid', async () => {
    const scheduleJob = fake.returns(null);
    const gladysLocked = {
      scheduler: { scheduleJob },
      job: { wrapper: (type, func) => func },
      gateway: { subscriptionActive: false },
    };
    const enedisService = EnedisService(gladysLocked, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    enedisService.device.sync = fake.resolves(null);
    await enedisService.start();
    const scheduledCallback = scheduleJob.firstCall.args[1];

    await scheduledCallback();
    assert.notCalled(enedisService.device.sync);

    gladysLocked.gateway.subscriptionActive = true;
    await scheduledCallback();
    assert.calledOnceWithExactly(enedisService.device.sync, false);
  });
  it('should stop service', async () => {
    const enedisService = EnedisService(
      { job: { wrapper: (type, func) => func } },
      '35deac79-f295-4adf-8512-f2f48e1ea0f8',
    );
    await enedisService.stop();
  });
});
