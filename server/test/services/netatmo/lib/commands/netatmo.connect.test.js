const nock = require('nock');
const { fake } = require('sinon');

const NetatmoManager = require('../../../../../services/netatmo/lib/index.js');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('test connect netatmo', () => {
  it('should failed to connect to netatmo', async () => {
    gladys.variable = {
      getValue: fake.resolves(undefined),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    await netatmoManager.connect();
  });

  it('should connect to netatmo', async () => {
    gladys.variable = {
      getValue: fake.resolves('true'),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.getDevices = fake.resolves(null);
    netatmoManager.pollManual = fake.resolves(null);
    const nockAuth = nock(`${netatmoManager.baseUrl}`)
      .persist()
      .post('/oauth2/token')
      .reply(201, { access_token: 'XERTRXZEZREAR35346T4' });
    await netatmoManager.connect();
    nockAuth.isDone();
  });

  it('should throw an error on the result', async () => {
    gladys.variable = {
      getValue: fake.resolves('true'),
    };
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    netatmoManager.getDevices = fake.resolves(null);
    netatmoManager.pollManual = fake.resolves(null);
    const nockAuth = nock(`${netatmoManager.baseUrl}`)
      .persist()
      .post('/oauth2/token')
      .reply(201);
    await netatmoManager.connect();
    nockAuth.isDone();
  });
});
