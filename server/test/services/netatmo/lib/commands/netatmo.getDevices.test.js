const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

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
    netatmoManager.getHomeStatusData = fake.resolves(null);
    netatmoManager.getHomeData = fake.resolves(null);
    netatmoManager.getStationsData = fake.resolves(null);
    netatmoManager.getHealthyHomeCoachData = fake.resolves(null);
    netatmoManager.getThermostatsData = fake.resolves(null);
    await netatmoManager.getDevices();
  });
});
