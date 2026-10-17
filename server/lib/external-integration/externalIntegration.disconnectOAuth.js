const get = require('get-value');

const db = require('../../models');
const logger = require('../../utils/logger');
const { BadParameters, ConflictError } = require('../../utils/coreErrors');
const { SERVICE_STATUS } = require('../../utils/constants');
const { SUPERVISED_STATUSES } = require('./constants');
const { getAccountField } = require('./externalIntegration.getAccountField');

/**
 * @description Tell if the main container of an integration is still running.
 * A container Docker no longer knows is not running; any other inspection
 * failure is rethrown: the caller cannot tell, so it must not assume.
 * @param {object} system - The system manager.
 * @param {string} containerId - The container id, if any.
 * @returns {Promise<boolean>} True when the container is running.
 * @example
 * const running = await isContainerRunning(this.system, service.container_id);
 */
async function isContainerRunning(system, containerId) {
  if (!containerId) {
    return false;
  }
  try {
    const containerInspect = await system.inspectContainer(containerId);
    return get(containerInspect, 'State.Running') === true;
  } catch (e) {
    if (e.statusCode === 404) {
      return false;
    }
    throw e;
  }
}

/**
 * @description Disconnect an account field (oauth2 or account_link): delete
 * the off-schema keys the field declares as its credentials
 * (`credential_keys` in the manifest) and nothing else — the settings of the
 * form, the other off-schema state of the integration (a stable device id,
 * pairing state, caches) and the reserved GLADYS_* keys are kept.
 *
 * A live integration (RUNNING or DEGRADED: its container is up, the health
 * check supervises it) holds its session in memory and would write its tokens
 * back on its next refresh: it is stopped before the deletion and started
 * again after it, so it comes back without credentials. Stopping first also
 * closes the window where a POST /config would land between the read and the
 * delete. The stop() action logs a container it failed to stop and carries on, so the
 * container is checked before anything is deleted. Any other status is
 * checked against Docker: a container still up (an ERROR left by a failed
 * start) is stopped too and left stopped. A stopped integration is left
 * stopped: it reads the remaining config on its next start anyway.
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
  if (service.status === SERVICE_STATUS.LOADING) {
    // a start() is still in flight: stopping and starting on top of it would
    // race with its container recreation. The user retries once it is up.
    throw new ConflictError('EXTERNAL_INTEGRATION_STARTING');
  }

  // DEGRADED counts too: a silent WebSocket does not mean a stopped process,
  // and the last connection status it published may still say connected
  const supervised = SUPERVISED_STATUSES.includes(service.status);
  let live = supervised;
  if (!live) {
    // the status is what the core last saved, not what Docker runs: an
    // integration left in ERROR by a failed start may still have its
    // container up, holding the session in memory
    try {
      live = await isContainerRunning(this.system, service.container_id);
    } catch (e) {
      logger.debug(`Unable to inspect the container of integration ${selector}, trusting its status`, e);
    }
  }
  if (live) {
    let stillRunning;
    try {
      await this.stop(selector);
      stillRunning = await isContainerRunning(this.system, service.container_id);
    } catch (e) {
      logger.warn(`Unable to check that integration ${selector} stopped before the disconnect`, e);
      stillRunning = true;
    }
    if (stillRunning) {
      // deleting now would let the live process write its tokens back: keep
      // everything, put the integration back as it was and report the failure
      if (supervised) {
        await this.start(selector).catch((e) => logger.warn(`Unable to start integration ${selector} again`, e));
      }
      throw new Error(`EXTERNAL_INTEGRATION_STOP_FAILED: ${selector} is still running, nothing was disconnected`);
    }
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

  // only a supervised integration is started again: one found running in
  // ERROR is left stopped, leaving that state still takes an admin start
  if (supervised) {
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
