const db = require('../../models');
const logger = require('../../utils/logger');
const { BadParameters } = require('../../utils/coreErrors');
const { SUPERVISED_STATUSES } = require('./constants');
const { getAccountField } = require('./externalIntegration.getAccountField');

/**
 * @description Disconnect an account field (oauth2 or account_link): delete
 * the off-schema keys the field declares as its credentials
 * (`credential_keys` in the manifest) and nothing else — the settings of the
 * form, the other off-schema state of the integration (a stable device id,
 * pairing state, caches) and the reserved GLADYS_* keys are kept.
 *
 * A live integration (LOADING, RUNNING or DEGRADED: its container is up, the
 * health check supervises it) holds its session in memory and would write
 * its tokens back on its next refresh: it is stopped before the deletion and
 * started again after it, so it comes back without credentials. Stopping
 * first also closes the window where a POST /config would land between the
 * read and the delete. A stopped integration is left stopped: it reads the
 * remaining config on its next start anyway.
 * @param {string} selector - The selector of the external integration.
 * @param {object} params - The request parameters.
 * @param {string} params.key - The config_schema key of the account field.
 * @returns {Promise<object>} Resolve with { success: true }.
 * @example
 * await gladys.externalIntegration.disconnectOAuth('ext-dev-xiaomi-home', { key: 'xiaomi_account' });
 */
async function disconnectOAuth(selector, { key } = {}) {
  if (typeof key !== 'string' || key.length === 0) {
    throw new BadParameters('key: must be a non-empty string');
  }
  const service = await this.getBySelector(selector);
  const field = getAccountField(service, key);
  if (!Array.isArray(field.credential_keys) || field.credential_keys.length === 0) {
    // without a declared list the core cannot tell a credential from any
    // other state the integration keeps off-schema: nothing is deleted
    throw new BadParameters(`config.${key}: declares no credential_keys, it cannot be disconnected`);
  }

  // DEGRADED counts too: a silent WebSocket does not mean a stopped process,
  // and the last connection status it published may still say connected
  const wasRunning = SUPERVISED_STATUSES.includes(service.status);
  if (wasRunning) {
    await this.stop(selector);
  }

  // config keys are stored uppercase in t_variable (see getIntegrationConfig)
  await db.Variable.destroy({
    where: {
      service_id: service.id,
      user_id: null,
      name: field.credential_keys.map((credentialKey) => credentialKey.toUpperCase()),
    },
  });

  // do not wait for the integration to report it: the user clicked disconnect
  this.setConnectionStatus(service, { connected: false });

  if (wasRunning) {
    try {
      await this.start(selector);
    } catch (e) {
      // the account is disconnected all the same: the failed start shows on
      // the supervision screen, like any other start failure
      logger.warn(`Unable to start integration ${selector} again after the disconnect`, e);
    }
  }

  return { success: true };
}

module.exports = {
  disconnectOAuth,
};
