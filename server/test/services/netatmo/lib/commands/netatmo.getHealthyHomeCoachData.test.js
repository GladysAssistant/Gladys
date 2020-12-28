const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const Netatmo = require('../netatmo.mock');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {
  netatmo: Netatmo,
});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  variable: {
    getValue: fake.resolves('true'),
  },
};
describe('netatmoManager getHealthyHomeCoachData', () => {
  it('should get all devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    await netatmoManager.connect();
    await netatmoManager.getHealthyHomeCoachData();
  });
});
