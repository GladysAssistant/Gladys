const EnedisService = require('../../../services/enedis');

describe('EnedisService', () => {
  it('should start service', async () => {
    const enedisService = EnedisService({}, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await enedisService.start();
  });
  it('should stop service', async () => {
    const enedisService = EnedisService({}, '35deac79-f295-4adf-8512-f2f48e1ea0f8');
    await enedisService.stop();
  });
});
