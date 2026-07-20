const Promise = require('bluebird');

/**
 * @description Make sure the desired sub-containers of an integration are
 * up, before the main container starts: `start: "auto"` entries (and the
 * ones started through the API and not stopped since) are created and
 * started; `"manual"` entries wait for POST /container/:name/start.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise} Resolve when the desired sub-containers are started.
 * @example
 * await gladys.externalIntegration.ensureSubContainers(service);
 */
async function ensureSubContainers(service) {
  const containers = this.getManifestContainers(service);
  if (containers.length === 0) {
    return;
  }
  await this.ensurePrivateNetwork(service);
  const desired = await this.getDesiredContainers(service);
  await Promise.each(
    containers.filter((entry) => desired[entry.name] === 'running'),
    (entry) => this.startSubContainer(service, entry),
  );
}

module.exports = {
  ensureSubContainers,
};
