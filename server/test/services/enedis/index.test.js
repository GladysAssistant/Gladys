const { fake, assert } = require('sinon');
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
  it('should stop service', async () => {
    const enedisService = EnedisService(
      { job: { wrapper: (type, func) => func } },
      '35deac79-f295-4adf-8512-f2f48e1ea0f8',
    );
    await enedisService.stop();
  });
});
