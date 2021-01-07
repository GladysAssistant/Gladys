const nock = require('nock');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

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
    netatmoManager.getDevices = fake.resolves(null);
    netatmoManager.pollManual = fake.resolves(null);
    await netatmoManager.connect();
  });

  it('should connect to netatmo', async () => {
    gladys.variable = {
      getValue: fake.resolves('true'),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.getDevices = fake.resolves(null);
    netatmoManager.pollManual = fake.resolves(null);
    nock(`${netatmoManager.baseUrl}`)
      .post('/oauth2/token')
      .reply(200, { data: { access_token: 'XERTRXZEZREAR35346T4' } });
    await netatmoManager.connect();
  });

  it('should throw an error to netatmo', async () => {
    gladys.variable = {
      getValue: fake.resolves('true'),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.getDevices = fake.resolves(null);
    netatmoManager.pollManual = fake.resolves(null);
    nock(`${netatmoManager.baseUrl}`)
      .post('/oauth2/token')
      .reply(400, { data: 'Problem' });
    await netatmoManager.connect();
  });
});
