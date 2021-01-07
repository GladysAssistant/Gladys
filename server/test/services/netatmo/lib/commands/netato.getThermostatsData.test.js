const nock = require('nock');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const jsonGetThermostatsData = require('../../data/getThermostatsData.json');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
describe('netatmoManager getThermostatsData', () => {
  it('should get all devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/getthermostatsdata?access_token=${this.token}`)
      .reply(200, jsonGetThermostatsData);
    await netatmoManager.getThermostatsData();
  });

  it('should failed getThermostatsData', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/getthermostatsdata?access_token=${this.token}`)
      .reply(400, { data: { body: 'Problem' } });
    await netatmoManager.getThermostatsData();
  });
});
