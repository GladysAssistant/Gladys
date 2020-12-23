const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
describe('netatmoManager getHomeStatusData', () => {
  it('should get all devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.getHomeStatusData = fake.returns(null);
    await netatmoManager.getHomeStatusData();
  });
});
