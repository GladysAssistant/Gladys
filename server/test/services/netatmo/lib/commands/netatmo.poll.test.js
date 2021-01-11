const { fake } = require('sinon');
const nock = require('nock');
const proxyquire = require('proxyquire').noCallThru();
const axios = require('axios');
const jsonstationdata = require('../../data/getstationsdata.json');
const jsonGetThermostatsData = require('../../data/getThermostatsData.json');
const jsonGetHomeData = require('../../data/getHomeData.json');
const jsonGetHomeStatus = require('../../data/getHomeStatus.json');
const jsonHomeCoachData = require('../../data/gethomecoachsdata.json');
const jsonHomeData = require('../../data/getHomeData');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
describe('netatmoManager pollManual', () => {
  it('should get all devices update', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/gethomecoachsdata?access_token=${netatmoManager.token}`)
      .reply(200, jsonHomeCoachData);
    nock(`${netatmoManager.baseUrl}`)
      .post('/api/gethomedata')
      .reply(200, jsonHomeData);
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homesdata`)
      .reply(200, jsonGetHomeData);
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/homestatus`)
      .reply(200, jsonGetHomeStatus);
    nock(`${netatmoManager.baseUrl}`)
      .post('/api/getstationsdata')
      .reply(200, jsonstationdata);
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/getthermostatsdata?access_token=${this.token}`)
      .reply(200, jsonGetThermostatsData);
    const response = await axios.get('https://upload.wikimedia.org/wikipedia/commons/3/3f/JPEG_example_flower.jpg', { responseType: 'arraybuffer' });
    nock('https://test.com')
      .get('/live/snapshot_720.jpg')
      .reply(200, response);
    await netatmoManager.pollManual();
  });
});
