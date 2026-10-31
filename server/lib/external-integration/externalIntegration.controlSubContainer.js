const logger = require('../../utils/logger');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');

const ACTIONS = ['start', 'stop', 'restart'];

/**
 * @description Drive the lifecycle of one declared sub-container, on behalf
 * of the integration (/container host API): start (creates the container if
 * needed, recreates it first if the provided env differs), stop (the
 * supervisor will not restart it) or restart (typical after rewriting a
 * config file through /data). Only the entries declared in the manifest of
 * THIS integration exist; none of these voluntary gestures increments
 * failure_count. A start or restart whose image is not on the disk (first
 * start of a `manual` entry, whose image install does not pull) does not
 * wait for the download: it starts it in the background and resolves with
 * `{ status: 'pulling' }` right away (202 on the host API, B.2).
 * @param {object} service - The external integration service (plain object).
 * @param {string} name - The sub-container name.
 * @param {string} action - 'start', 'stop' or 'restart'.
 * @param {object} [options] - Options.
 * @param {object} [options.env] - Runtime env (start only), merged over the
 * manifest env; GLADYS_* keys are forbidden.
 * @returns {Promise<object>} Resolve when the action is done —
 * with `{ status: 'pulling' }` when the image download runs in the
 * background, `{ status: 'running' }` after a synchronous start,
 * `{ status: 'stopped' }` after a stop.
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
  const key = `${service.id}:${name}`;
  if (action === 'stop') {
    // a stop also aborts the download a start left running, and clears
    // what that start may have failed on
    await this.cancelSubContainerPull(service, name);
    this.subContainerErrors.delete(key);
    const container = await this.findSubContainer(service, name);
    if (container) {
      await this.system.stopContainer(container.id);
    }
    await this.setDesiredContainer(service, name, 'stopped');
    return { status: 'stopped' };
  }
  // start and restart both end up with a running container in the desired
  // state; start is the one accepting a runtime env
  const options = action === 'start' && env !== undefined ? { env } : {};
  // a stop is cancelling a download of this entry: let it settle first, so
  // it cannot remove nor reuse the container this start creates
  await this.cancelledSubContainerPulls.get(key);
  if (this.subContainerPulls.has(key)) {
    // the download of a previous start is still running: join it
    this.pullAndStartSubContainer(service, entry, options);
    return { status: 'pulling' };
  }
  let imagePresent = true;
  try {
    imagePresent = await this.system.imageExists(entry.docker_image);
  } catch (e) {
    // the synchronous start below surfaces the real Docker error
    logger.debug(`Unable to check the local presence of the image ${entry.docker_image}`, e);
  }
  if (!imagePresent) {
    // a multi-GB download (Frigate) outlives any HTTP timeout: answered now,
    // followed through GET /container and the container-updated push
    this.pullAndStartSubContainer(service, entry, options);
    return { status: 'pulling' };
  }
  this.subContainerErrors.delete(key);
  await this.startSubContainer(service, entry, options);
  await this.setDesiredContainer(service, name, 'running');
  return { status: 'running' };
}

module.exports = {
  controlSubContainer,
};
