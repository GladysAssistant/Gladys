const { fake, assert } = require('sinon');
const EnedisService = require('../../../services/enedis');

const gladys = {
  scheduler: {
    scheduleJob: fake.returns(null),
  },
};

describe('EnedisService', () => {
  it('should start service', async () => {
    const enedisService = EnedisService(gladys, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await enedisService.start();
    assert.calledOnce(gladys.scheduler.scheduleJob);
  });
  it('should stop service', async () => {
    const enedisService = EnedisService({}, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await enedisService.stop();
  });
});
