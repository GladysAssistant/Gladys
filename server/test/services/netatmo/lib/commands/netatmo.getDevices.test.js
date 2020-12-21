const { assert, fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();

const Api = require('../netatmo.api.mock');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {
  this: {
    api: Api
  },
});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
describe('netatmoManager GetDevices', () => {
  it('should get all devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    await netatmoManager.getDevices('all');
  });
  // it('should get devices', async () => {
  //   const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
  //   netatmoManager.api = await netatmoClient
  //   await netatmoManager.getDevices();
  // });
});
