const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// get json data for camera
const homes = require('../../data/homeData.json');

// netatmo mock
const Netatmo = require('../netatmo.mock');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {
  netatmo: Netatmo,
});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
describe('netatmoManager new value camera', () => {
  it('should add one camera NACamera', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    await netatmoManager.newValueCamera(homes.body.homes[0].cameras[0]);
  });
  it('should add one camera NOC', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    await netatmoManager.newValueCamera(homes.body.homes[0].cameras[1]);
  });
});
