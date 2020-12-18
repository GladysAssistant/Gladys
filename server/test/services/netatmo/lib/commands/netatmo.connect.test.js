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
};

describe('should say netatmo is not configured', () => {
  it('should failed to connect to netatmo', async () => {
    gladys.variable = {
      getValue: fake.resolves(undefined),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    await netatmoManager.connect();
  });

  it('should throw an error to netatmo', async () => {
    gladys.variable = {
      getValue: fake.resolves('true'),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    await netatmoManager.connect();
    netatmoManager.api.emit('error');
    // assert.calledOnce(gladys.event.emit);
  });

  it('should connect to netatmo', async () => {
    gladys.variable = {
      getValue: fake.resolves('true'),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    await netatmoManager.connect();
    // assert.called(netatmoManager.getDevices());
  });
});
