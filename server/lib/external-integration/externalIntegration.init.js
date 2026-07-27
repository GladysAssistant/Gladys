const Promise = require('bluebird');

const db = require('../../models');
const logger = require('../../utils/logger');
const { generateJwtSecret } = require('../../utils/jwtSecret');
const { SERVICE_TYPES } = require('../../utils/constants');
const {
  EXTERNAL_INTEGRATION_LABEL,
  CHECK_HEALTH_INTERVAL_MS,
  INTEGRATION_JWT_SECRET_VARIABLE,
} = require('./constants');
const { STORE_INDEX_TTL_MS } = require('./store/store.constants');

/**
 * @description Initialize the external integration supervisor. Called before
 * service.startAll() so the proxy services are registered in the
 * stateManager and external integrations start through the same path as
 * internal ones (including the "STOPPED = ignored at boot" rule).
 * Reconciles containers by label (backup restore case: container_id is
 * obsolete after a restore).
 * @returns {Promise} Resolve when init is done.
 * @example
 * await gladys.externalIntegration.init();
 */
async function init() {
  // integration JWTs must survive Gladys restarts: without a JWT_SECRET
  // env var the process-level secret is regenerated at every boot, and the
  // tokens baked in the container envs became invalid ("authentication
  // refused (close code 4000)" loops). The supervisor signs with its own
  // secret, generated once and persisted in a variable — it also survives
  // a backup restore, together with the containers it validates.
  const persistedJwtSecret = await this.variable.getValue(INTEGRATION_JWT_SECRET_VARIABLE);
  if (persistedJwtSecret) {
    this.jwtSecret = persistedJwtSecret;
  } else {
    this.jwtSecret = generateJwtSecret();
    await this.variable.setValue(INTEGRATION_JWT_SECRET_VARIABLE, this.jwtSecret);
  }
  const services = await db.Service.findAll({
    where: {
      type: SERVICE_TYPES.EXTERNAL,
      pod_id: null,
    },
  });
  const plainServices = services.map((service) => service.get({ plain: true }));
  plainServices.forEach((service) => this.registerProxyService(service));

  // store index: periodic refresh every 12h; the first fetch is lazy (first
  // catalog access, see getIndex) so the boot never depends on the network.
  // Works even without Docker: the catalog stays browsable.
  this.storeRefreshInterval = setInterval(() => {
    this.refreshIndex().catch((e) => logger.debug('Unable to refresh the integration store index', e));
  }, STORE_INDEX_TTL_MS);
  if (this.storeRefreshInterval.unref) {
    this.storeRefreshInterval.unref();
  }

  this.available = Boolean(this.system.dockerode);
  if (!this.available) {
    logger.info('External integrations are not available: Gladys has no access to a Docker socket');
    return;
  }
  try {
    await this.ensureNetwork();
  } catch (e) {
    this.available = false;
    logger.warn('External integrations disabled: unable to create the integrations network', e);
    return;
  }
  // reconcile containers by label (restore of a backup: container ids change)
  try {
    const containers = await this.system.getContainers({
      all: true,
      filters: { label: [EXTERNAL_INTEGRATION_LABEL] },
    });
    await Promise.each(plainServices, async (service) => {
      const containerName = `gladys-${service.selector}`;
      const container = containers.find((c) => c.name === `/${containerName}` || c.name === containerName);
      if (container && container.id !== service.container_id) {
        await db.Service.update({ container_id: container.id }, { where: { id: service.id } });
      } else if (!container && service.container_id) {
        await db.Service.update({ container_id: null }, { where: { id: service.id } });
      }
    });
    // orphans (crash mid-operation): containers and private networks labeled
    // with a selector that is not installed anymore are destroyed — no ghost
    // container possible, sub-containers included (same label)
    const installedSelectors = new Set(plainServices.map((service) => service.selector));
    const orphanContainers = containers.filter(
      (container) =>
        container.labels &&
        container.labels[EXTERNAL_INTEGRATION_LABEL] &&
        !installedSelectors.has(container.labels[EXTERNAL_INTEGRATION_LABEL]),
    );
    await Promise.each(orphanContainers, (orphan) => this.system.removeContainer(orphan.id, { force: true }));
    const networks = await this.system.getNetworks({ filters: { label: [EXTERNAL_INTEGRATION_LABEL] } });
    const orphanNetworks = networks.filter(
      (network) =>
        network.Labels &&
        network.Labels[EXTERNAL_INTEGRATION_LABEL] &&
        !installedSelectors.has(network.Labels[EXTERNAL_INTEGRATION_LABEL]),
    );
    await Promise.each(orphanNetworks, (network) => this.system.removeNetwork(network.Name));
  } catch (e) {
    logger.warn('Unable to reconcile external integration containers', e);
  }
  // supervised health check every 30s
  this.checkHealthInterval = setInterval(() => {
    this.checkHealth().catch((e) => logger.warn('External integration health check failed', e));
  }, CHECK_HEALTH_INTERVAL_MS);
  if (this.checkHealthInterval.unref) {
    this.checkHealthInterval.unref();
  }
}

module.exports = {
  init,
};
