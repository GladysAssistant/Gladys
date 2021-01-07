const { fake } = require('sinon');
const nock = require('nock');
const proxyquire = require('proxyquire').noCallThru();

const jsonHomeData = require('../../data/getHomeData');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
describe('netatmoManager getHomeData', () => {
  it('should get all devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .post('/api/gethomedata')
      .reply(200, jsonHomeData);
    await netatmoManager.getHomeData();
  });
});
