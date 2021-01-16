const { fake } = require('sinon');

const NetatmoManager = require('../../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  device: {
    getBySelector: fake.resolves(null),
  },
};

describe('netatmoManager pollManual', () => {
  it('should get all devices update and have .id', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.getThermostatsData = fake.resolves(null);
    netatmoManager.getHomeStatusData = fake.resolves(null);
    netatmoManager.getHomeData = fake.resolves(null);
    netatmoManager.getHealthyHomeCoachData = fake.resolves(null);
    netatmoManager.getStationsData = fake.resolves(null);
    netatmoManager.devices = {
      '10': {
        id: '10',
      },
    };
    await netatmoManager.pollManual();
  });

  it('should get all devices update and have ._id', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.getThermostatsData = fake.resolves(null);
    netatmoManager.getHomeStatusData = fake.resolves(null);
    netatmoManager.getHomeData = fake.resolves(null);
    netatmoManager.getHealthyHomeCoachData = fake.resolves(null);
    netatmoManager.getStationsData = fake.resolves(null);
    netatmoManager.devices = {
      '10': {
        _id: '10',
      },
    };
    await netatmoManager.pollManual();
  });

  // it('should get all devices parsing the updates files', async () => {
  //   const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
  //   nock(`${netatmoManager.baseUrl}`)
  //     .persist()
  //     .get(`/api/gethomecoachsdata?access_token=${netatmoManager.token}`)
  //     .reply(200, jsonHomeCoachData);
  //   nock(`${netatmoManager.baseUrl}`)
  //     .persist()
  //     .post('/api/gethomedata')
  //     .reply(200, jsonHomeData);
  //   nock(`${netatmoManager.baseUrl}`)
  //     .persist()
  //     .post(`/api/homesdata`)
  //     .reply(200, jsonGetHomeData);
  //   nock(`${netatmoManager.baseUrl}`)
  //     .persist()
  //     .post(`/api/homestatus`)
  //     .reply(200, jsonGetHomeStatus);
  //   nock(`${netatmoManager.baseUrl}`)
  //     .persist()
  //     .post('/api/getstationsdata')
  //     .reply(200, jsonstationdata);
  //   nock(`${netatmoManager.baseUrl}`)
  //     .persist()
  //     .get(`/api/getthermostatsdata?access_token=${this.token}`)
  //     .reply(200, jsonGetThermostatsData);
  //   const response = await axios.get('https://upload.wikimedia.org/wikipedia/commons/3/3f/JPEG_example_flower.jpg', {
  //     responseType: 'arraybuffer',
  //   });
  //   nock('https://test.com')
  //     .get('/live/snapshot_720.jpg')
  //     .reply(200, response);
  //   await netatmoManager.pollManual();
  // });
});
