const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const Netatmo = require('../netatmo.mock');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {
  api: {
    netatmo: Netatmo,
  },
});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  variable: {
    getValue: fake.resolves(undefined),
  },
};
describe('netatmoManager GetDevices', () => {
  it('should get all devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.getHomeStatusData = fake.returns(null);
    netatmoManager.getHomeData = fake.returns(null);
    netatmoManager.getStationsData = fake.returns(null);
    netatmoManager.getHealthyHomeCoachData = fake.returns(null);
    await netatmoManager.getDevices();
  });
});
