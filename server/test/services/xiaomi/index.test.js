const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

class XiaomiManager {}

XiaomiManager.prototype.listen = fake.returns(null);

const XiaomiService = proxyquire('../../../services/xiaomi', {
  './lib': XiaomiManager,
});

describe('xiaomiService', () => {
  const xiaomiService = XiaomiService({}, '3ac129d9-a610-42f8-924f-3fe708001b3d');
  it('should start service', async () => {
    await xiaomiService.start();
  });
  it('should stop service', async () => {
    await xiaomiService.stop();
  });
});
