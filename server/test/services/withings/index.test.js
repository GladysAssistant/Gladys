const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

class WithingsHandler {}

WithingsHandler.prototype.listen = fake.returns(null);

const WithingsService = proxyquire('../../../services/withings', {
  './lib': WithingsHandler,
});

describe('withingsService', () => {
  const withingsService = WithingsService({}, '3ac129d9-a610-42f8-924f-3fe708001b3d');
  it('should start service', async () => {
    await withingsService.start();
  });
  it('should stop service', async () => {
    await withingsService.stop();
  });
});
