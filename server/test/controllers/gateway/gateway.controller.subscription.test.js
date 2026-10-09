const nock = require('nock');
const { expect } = require('chai');
const getConfig = require('../../../utils/getConfig');
const { authenticatedRequest } = require('../request.test');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

const config = getConfig();

describe('POST /api/v1/gateway/subscription/refresh', () => {
  const gatewayVariables = [
    'GLADYS_GATEWAY_REFRESH_TOKEN',
    'GLADYS_GATEWAY_RSA_PRIVATE_KEY',
    'GLADYS_GATEWAY_ECDSA_PRIVATE_KEY',
  ];

  beforeEach(async () => {
    // instance linked to Gladys Plus
    await Promise.all(gatewayVariables.map((name) => global.TEST_GLADYS_INSTANCE.variable.setValue(name, 'value')));
    global.TEST_GLADYS_INSTANCE.gateway.subscriptionActive = false;
    global.TEST_GLADYS_INSTANCE.gateway.subscriptionPaymentRequiredSince = '2026-09-01T00:00:00.000Z';
  });

  afterEach(async () => {
    await Promise.all(gatewayVariables.map((name) => global.TEST_GLADYS_INSTANCE.variable.destroy(name)));
    await global.TEST_GLADYS_INSTANCE.variable.destroy(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_PAYMENT_REQUIRED_SINCE);
    global.TEST_GLADYS_INSTANCE.gateway.subscriptionActive = true;
    global.TEST_GLADYS_INSTANCE.gateway.subscriptionPaymentRequiredSince = null;
    nock.cleanAll();
  });

  it('should stay locked when Gladys Plus still answers payment required', async () => {
    nock(config.gladysGatewayServerUrl)
      .get('/backups')
      .reply(402, { status: 402, error_code: 'PAYMENT_REQUIRED', error_message: 'Account is not active' });
    await authenticatedRequest
      .post('/api/v1/gateway/subscription/refresh')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          configured: true,
          connected: false,
          subscription_active: false,
          payment_required_since: '2026-09-01T00:00:00.000Z',
        });
      });
  });

  it('should unlock when Gladys Plus accepts the request again', async () => {
    nock(config.gladysGatewayServerUrl)
      .get('/backups')
      .reply(200, []);
    await authenticatedRequest
      .post('/api/v1/gateway/subscription/refresh')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          configured: true,
          connected: false,
          subscription_active: true,
          payment_required_since: null,
        });
      });
  });
});
