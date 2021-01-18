const nock = require('nock');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const jsonGetHomeData = require('../../data/homeData.json');
const jsonGetHomeStatus = require('../../data/getHomeStatus.json');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
describe('netatmoManager getHomeStatusData', () => {
  it('should get all getHomeStatusData devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homesdata`)
      .reply(200, jsonGetHomeData);
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homestatus`)
      .reply(200, jsonGetHomeStatus);
    await netatmoManager.getHomeStatusData();
  });

  it('should failed getHomeStatusData', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homesdata`)
      .reply(400, { data: { body: 'Problem' } });
    await netatmoManager.getHomeStatusData();
  });
});
