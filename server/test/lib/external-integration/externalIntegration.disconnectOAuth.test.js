const EventEmitter = require('events');
const { expect } = require('chai');
const WebSocket = require('ws');
const { assert: sinonAssert, fake } = require('sinon');

const db = require('../../../models');
const { BadParameters } = require('../../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('./testUtils.test');

// manifest of a cloud integration with an oauth2 config field: the linked
// account, plus the ordinary settings of the generated form
const TEST_OAUTH_MANIFEST = {
  ...TEST_MANIFEST,
  config_schema: [
    ...TEST_MANIFEST.config_schema,
    {
      key: 'netatmo_account',
      type: 'oauth2',
      label: { en: 'Netatmo account', fr: 'Compte Netatmo' },
    },
  ],
};

const seedOAuthService = (overrides = {}) => seedExternalService({ manifest: TEST_OAUTH_MANIFEST, ...overrides });

const buildFakeWs = () => {
  const ws = new EventEmitter();
  ws.readyState = WebSocket.OPEN;
  ws.send = fake.returns(null);
  return ws;
};

/**
 * @description Read back the raw variable names stored for a service.
 * @param {string} serviceId - The service id.
 * @returns {Promise<Array>} The variable names, sorted.
 * @example
 * const names = await storedVariableNames(service.id);
 */
async function storedVariableNames(serviceId) {
  const variables = await db.Variable.findAll({ where: { service_id: serviceId, user_id: null } });
  return variables.map((variable) => variable.name).sort();
}

describe('externalIntegration.disconnectOAuth', () => {
  it('should forget the off-schema credentials and keep the settings', async () => {
    const service = await seedOAuthService();
    const { externalIntegration, variable } = buildSupervisor();
    externalIntegration.getBySelector = fake.resolves(service);
    // what the integration stored by itself (the tokens live off-schema)
    await variable.setValue('SESSION_PASS_TOKEN', JSON.stringify('pass-token'), service.id);
    await variable.setValue('SESSION_USER_ID', JSON.stringify('12345'), service.id);
    // what the user filled in the generated form, and a reserved preference
    await variable.setValue('LATITUDE', JSON.stringify(48.85), service.id);
    await variable.setValue('GLADYS_PREFER_LOCAL', JSON.stringify(false), service.id);

    const result = await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });

    expect(result).to.deep.equal({ success: true });
    expect(await storedVariableNames(service.id)).to.deep.equal(['GLADYS_PREFER_LOCAL', 'LATITUDE']);
  });

  it('should push the emptied config to the integration', async () => {
    const service = await seedOAuthService();
    const { externalIntegration, variable } = buildSupervisor();
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    externalIntegration.getBySelector = fake.resolves(service);
    await variable.setValue('SESSION_PASS_TOKEN', JSON.stringify('pass-token'), service.id);
    await variable.setValue('LATITUDE', JSON.stringify(48.85), service.id);

    await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });

    sinonAssert.calledOnce(ws.send);
    const sentMessage = JSON.parse(ws.send.firstCall.args[0]);
    expect(sentMessage.type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CONFIG_UPDATED);
    // the integration reloads a config without any credential left
    expect(sentMessage.payload.config).to.not.have.property('session_pass_token');
    expect(sentMessage.payload.config).to.have.property('latitude', 48.85);
  });

  it('should report the integration as disconnected right away', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.getBySelector = fake.resolves(service);

    await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });

    expect(externalIntegration.getConnectionStatus(service.id)).to.deep.equal({ connected: false, message: null });
  });

  it('should work when the integration is disconnected', async () => {
    const service = await seedOAuthService();
    const { externalIntegration, variable } = buildSupervisor();
    externalIntegration.getBySelector = fake.resolves(service);
    await variable.setValue('SESSION_PASS_TOKEN', JSON.stringify('pass-token'), service.id);

    // no WebSocket connection: the push is simply lost, the credentials still go
    const result = await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });

    expect(result).to.deep.equal({ success: true });
    expect(await storedVariableNames(service.id)).to.deep.equal([]);
  });

  it('should reject an empty key', async () => {
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.disconnectOAuth('ext-dev-demo', { key: '' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal('key: must be a non-empty string');
    }
  });

  it('should reject a missing params object', async () => {
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.disconnectOAuth('ext-dev-demo');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal('key: must be a non-empty string');
    }
  });

  it('should reject a key that is not an oauth2 field', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.getBySelector = fake.resolves(service);
    try {
      await externalIntegration.disconnectOAuth(service.selector, { key: 'latitude' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal('config.latitude: not an oauth2 field');
    }
  });

  it('should reject an unknown key', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.getBySelector = fake.resolves(service);
    try {
      await externalIntegration.disconnectOAuth(service.selector, { key: 'nope' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal('config.nope: not an oauth2 field');
    }
  });

  it('should reject when the manifest has no config_schema at all', async () => {
    const manifestWithoutSchema = { ...TEST_MANIFEST };
    delete manifestWithoutSchema.config_schema;
    const service = await seedOAuthService({ manifest: manifestWithoutSchema });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.getBySelector = fake.resolves(service);
    try {
      await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal('config.netatmo_account: not an oauth2 field');
    }
  });
});
