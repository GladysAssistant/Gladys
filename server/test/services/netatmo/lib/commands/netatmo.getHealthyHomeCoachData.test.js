const nock = require('nock');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const jsonHomeCoachData = require('../../data/gethomecoachsdata.json');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  variable: {
    getValue: fake.resolves('true'),
  },
};

describe('netatmoManager getHealthyHomeCoachData', () => {
  it('should get all getHealthyHomeCoachData devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/gethomecoachsdata?access_token=${netatmoManager.token}`)
      .reply(200, jsonHomeCoachData);
    await netatmoManager.getHealthyHomeCoachData();
  });
});
