const { NotFoundError, BadParameters } = require('../../utils/coreErrors');

const ACTIONS = ['start', 'stop', 'restart'];

/**
 * @description Drive the lifecycle of one declared sub-container, on behalf
 * of the integration (/container host API): start (creates the container if
 * needed, recreates it first if the provided env differs), stop (the
 * supervisor will not restart it) or restart (typical after rewriting a
 * config file through /data). Only the entries declared in the manifest of
 * THIS integration exist; none of these voluntary gestures increments
 * failure_count.
 * @param {object} service - The external integration service (plain object).
 * @param {string} name - The sub-container name.
 * @param {string} action - 'start', 'stop' or 'restart'.
 * @param {object} [options] - Options.
 * @param {object} [options.env] - Runtime env (start only), merged over the
 * manifest env; GLADYS_* keys are forbidden.
 * @returns {Promise} Resolve when the action is done.
 * @example
 * await gladys.externalIntegration.controlSubContainer(service, 'mqtt', 'start', { env: { KEY: 'value' } });
 */
async function controlSubContainer(service, name, action, { env } = {}) {
  if (!ACTIONS.includes(action)) {
    throw new BadParameters(`action: must be one of ${ACTIONS.join(', ')}`);
  }
  const entry = this.getManifestContainers(service).find((declared) => declared.name === name);
  if (!entry) {
    throw new NotFoundError('SUB_CONTAINER_NOT_FOUND');
  }
  if (env !== undefined) {
    if (env === null || typeof env !== 'object' || Array.isArray(env)) {
      throw new BadParameters('env: must be an object mapping keys to strings');
    }
    Object.keys(env).forEach((key) => {
      if (key.toUpperCase().startsWith('GLADYS_')) {
        throw new BadParameters(`env.${key}: GLADYS_* keys are reserved`);
      }
      if (typeof env[key] !== 'string') {
        throw new BadParameters(`env.${key}: must be a string`);
      }
    });
  }
  if (action === 'stop') {
    const container = await this.findSubContainer(service, name);
    if (container) {
      await this.system.stopContainer(container.id);
    }
    await this.setDesiredContainer(service, name, 'stopped');
    return;
  }
  // start and restart both end up with a running container in the desired
  // state; start is the one accepting a runtime env
  await this.startSubContainer(service, entry, action === 'start' && env !== undefined ? { env } : {});
  await this.setDesiredContainer(service, name, 'running');
}

module.exports = {
  controlSubContainer,
};
