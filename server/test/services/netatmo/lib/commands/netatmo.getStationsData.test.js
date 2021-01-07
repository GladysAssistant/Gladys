const { fake } = require('sinon');
const nock = require('nock');
const proxyquire = require('proxyquire').noCallThru();

const jsonstationdata = require('../../data/getstationsdata.json');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
describe('netatmoManager getStationsData', () => {
  it('should get all devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .post('/api/getstationsdata')
      .reply(200, jsonstationdata);
    await netatmoManager.getStationsData();
  });
});
