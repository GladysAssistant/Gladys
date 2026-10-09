const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert: sinonAssert, fake } = sinon;

const db = require('../../../models');
const { BadParameters } = require('../../../utils/coreErrors');
const { SERVICE_STATUS } = require('../../../utils/constants');
const { CORE_SERVICE_VARIABLES } = require('../../../lib/external-integration/constants');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('./testUtils.test');

// manifest of a cloud integration with an account field: the linked account
// declares the off-schema keys holding its credentials, next to the ordinary
// settings of the generated form
const TEST_ACCOUNT_MANIFEST = {
  ...TEST_MANIFEST,
  config_schema: [
    ...TEST_MANIFEST.config_schema,
    {
      key: 'netatmo_account',
      type: 'oauth2',
      label: { en: 'Netatmo account', fr: 'Compte Netatmo' },
      credential_keys: ['session_pass_token', 'session_user_id'],
    },
  ],
};

// John, seeded by the test database
const JOHN_USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

const seedAccountService = (overrides = {}) =>
  seedExternalService({ manifest: TEST_ACCOUNT_MANIFEST, status: SERVICE_STATUS.STOPPED, ...overrides });

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

/**
 * @description Build a supervisor whose lifecycle actions are fakes.
 * @param {object} service - The service returned by getBySelector.
 * @returns {object} The supervisor and its variable manager.
 * @example
 * const { externalIntegration } = buildDisconnectSupervisor(service);
 */
function buildDisconnectSupervisor(service) {
  const supervisor = buildSupervisor();
  supervisor.externalIntegration.getBySelector = fake.resolves(service);
  supervisor.externalIntegration.stop = fake.resolves(null);
  supervisor.externalIntegration.start = fake.resolves(null);
  return supervisor;
}

describe('externalIntegration.disconnectOAuth', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should delete the declared credential keys and nothing else', async () => {
    const service = await seedAccountService();
    const { externalIntegration, variable } = buildDisconnectSupervisor(service);
    // the credentials declared by the account field
    await variable.setValue('SESSION_PASS_TOKEN', JSON.stringify('pass-token'), service.id);
    await variable.setValue('SESSION_USER_ID', JSON.stringify('12345'), service.id);
    // other off-schema state of the integration, a user setting and a
    // reserved preference: none of them is a credential
    await variable.setValue('SESSION_DEVICE_ID', JSON.stringify('stable-device'), service.id);
    await variable.setValue('LATITUDE', JSON.stringify(48.85), service.id);
    await variable.setValue('GLADYS_PREFER_LOCAL', JSON.stringify(false), service.id);
    await Promise.all(CORE_SERVICE_VARIABLES.map((name) => variable.setValue(name, JSON.stringify({}), service.id)));

    const result = await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });

    expect(result).to.deep.equal({ success: true });
    expect(await storedVariableNames(service.id)).to.deep.equal(
      ['GLADYS_PREFER_LOCAL', 'LATITUDE', 'SESSION_DEVICE_ID', ...CORE_SERVICE_VARIABLES].sort(),
    );
  });

  it('should keep the per-user variables', async () => {
    const service = await seedAccountService();
    const { externalIntegration, variable } = buildDisconnectSupervisor(service);
    await variable.setValue('SESSION_PASS_TOKEN', JSON.stringify('per-user'), service.id, JOHN_USER_ID);

    await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });

    const perUser = await db.Variable.findAll({ where: { service_id: service.id, user_id: JOHN_USER_ID } });
    expect(perUser.map((perUserVariable) => perUserVariable.name)).to.deep.equal(['SESSION_PASS_TOKEN']);
  });

  it('should disconnect an account_link field the same way', async () => {
    const service = await seedAccountService({
      manifest: {
        ...TEST_MANIFEST,
        config_schema: [
          { key: 'xiaomi_account', type: 'account_link', label: { en: 'Xiaomi account' }, credential_keys: ['token'] },
        ],
      },
    });
    const { externalIntegration, variable } = buildDisconnectSupervisor(service);
    await variable.setValue('TOKEN', JSON.stringify('token'), service.id);

    await externalIntegration.disconnectOAuth(service.selector, { key: 'xiaomi_account' });

    expect(await storedVariableNames(service.id)).to.deep.equal([]);
  });

  it('should report the integration as disconnected right away', async () => {
    const service = await seedAccountService();
    const { externalIntegration } = buildDisconnectSupervisor(service);

    await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });

    expect(externalIntegration.getConnectionStatus(service.id)).to.deep.equal({ connected: false, message: null });
  });

  it('should stop a running integration before the deletion and start it again after', async () => {
    const service = await seedAccountService({ status: SERVICE_STATUS.RUNNING });
    const { externalIntegration, variable } = buildDisconnectSupervisor(service);
    await variable.setValue('SESSION_PASS_TOKEN', JSON.stringify('pass-token'), service.id);
    // what each lifecycle step sees: the session it holds in memory must not
    // outlive the deletion, and nothing may write the tokens back in between
    const seenByStop = [];
    const seenByStart = [];
    externalIntegration.stop = fake(async () => seenByStop.push(...(await storedVariableNames(service.id))));
    externalIntegration.start = fake(async () => seenByStart.push(...(await storedVariableNames(service.id))));

    await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });

    sinonAssert.calledOnceWithExactly(externalIntegration.stop, service.selector);
    sinonAssert.calledOnceWithExactly(externalIntegration.start, service.selector);
    expect(seenByStop).to.deep.equal(['SESSION_PASS_TOKEN']);
    expect(seenByStart).to.deep.equal([]);
  });

  it('should leave a stopped integration stopped', async () => {
    const service = await seedAccountService();
    const { externalIntegration, variable } = buildDisconnectSupervisor(service);
    await variable.setValue('SESSION_PASS_TOKEN', JSON.stringify('pass-token'), service.id);

    const result = await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });

    expect(result).to.deep.equal({ success: true });
    sinonAssert.notCalled(externalIntegration.stop);
    sinonAssert.notCalled(externalIntegration.start);
    expect(await storedVariableNames(service.id)).to.deep.equal([]);
  });

  it('should succeed when the integration fails to start again', async () => {
    const service = await seedAccountService({ status: SERVICE_STATUS.RUNNING });
    const { externalIntegration, variable } = buildDisconnectSupervisor(service);
    externalIntegration.start = fake.rejects(new Error('docker unavailable'));
    await variable.setValue('SESSION_PASS_TOKEN', JSON.stringify('pass-token'), service.id);

    // the account is disconnected all the same: the failed start belongs to
    // the supervision screen, not to this request
    const result = await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });

    expect(result).to.deep.equal({ success: true });
    expect(await storedVariableNames(service.id)).to.deep.equal([]);
  });

  it('should refuse an account field that declares no credential_keys', async () => {
    const service = await seedAccountService({
      manifest: {
        ...TEST_MANIFEST,
        config_schema: [{ key: 'netatmo_account', type: 'oauth2', label: { en: 'Netatmo account' } }],
      },
    });
    const { externalIntegration, variable } = buildDisconnectSupervisor(service);
    await variable.setValue('SESSION_PASS_TOKEN', JSON.stringify('pass-token'), service.id);
    try {
      await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal('config.netatmo_account: declares no credential_keys, it cannot be disconnected');
    }
    // nothing is guessed: the storage of the integration is left untouched
    expect(await storedVariableNames(service.id)).to.deep.equal(['SESSION_PASS_TOKEN']);
    sinonAssert.notCalled(externalIntegration.stop);
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

  it('should reject a key that is not an account field', async () => {
    const service = await seedAccountService();
    const { externalIntegration } = buildDisconnectSupervisor(service);
    try {
      await externalIntegration.disconnectOAuth(service.selector, { key: 'latitude' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal('config.latitude: not an oauth2 or account_link field');
    }
  });

  it('should reject an unknown key', async () => {
    const service = await seedAccountService();
    const { externalIntegration } = buildDisconnectSupervisor(service);
    try {
      await externalIntegration.disconnectOAuth(service.selector, { key: 'nope' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal('config.nope: not an oauth2 or account_link field');
    }
  });

  it('should reject when the manifest has no config_schema at all', async () => {
    const manifestWithoutSchema = { ...TEST_MANIFEST };
    delete manifestWithoutSchema.config_schema;
    const service = await seedAccountService({ manifest: manifestWithoutSchema });
    const { externalIntegration } = buildDisconnectSupervisor(service);
    try {
      await externalIntegration.disconnectOAuth(service.selector, { key: 'netatmo_account' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.equal('config.netatmo_account: not an oauth2 or account_link field');
    }
  });
});
