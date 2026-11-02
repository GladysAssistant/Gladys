const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { SUB_CONTAINER_PULL_PROGRESS_INTERVAL_MS, SUB_CONTAINER_ERRORS } = require('./constants');

// Docker progress statuses that describe one layer of the image (the other
// events — "Pulling from …", "Digest: …", "Status: …" — describe the pull)
const LAYER_STATUSES = [
  'Pulling fs layer',
  'Waiting',
  'Downloading',
  'Verifying Checksum',
  'Download complete',
  'Extracting',
  'Pull complete',
  'Already exists',
];
const DOWNLOADED_STATUSES = ['Verifying Checksum', 'Download complete', 'Extracting', 'Pull complete'];
const DONE_STATUSES = ['Pull complete', 'Already exists'];

/**
 * @description Fold one Docker pull progress event into the per-layer state.
 * @param {Map} layers - Layer id -> { current, total, done }.
 * @param {object} progressEvent - Event of the Docker progress stream.
 * @returns {boolean} True if the event described a layer.
 * @example
 * trackLayer(layers, { id: 'a1b2', status: 'Downloading', progressDetail: { current: 10, total: 100 } });
 */
function trackLayer(layers, progressEvent) {
  if (!progressEvent || typeof progressEvent.id !== 'string' || !LAYER_STATUSES.includes(progressEvent.status)) {
    return false;
  }
  const layer = layers.get(progressEvent.id) || { current: 0, total: null, done: false };
  const { status, progressDetail } = progressEvent;
  if (status === 'Downloading' && progressDetail && progressDetail.total > 0) {
    layer.total = progressDetail.total;
    layer.current = Math.min(progressDetail.current || 0, progressDetail.total);
  }
  if (DOWNLOADED_STATUSES.includes(status) && layer.total !== null) {
    layer.current = layer.total;
  }
  if (DONE_STATUSES.includes(status)) {
    layer.done = true;
  }
  layers.set(progressEvent.id, layer);
  return true;
}

/**
 * @description Summarize the per-layer state into the `pull` object of
 * GET /container: bytes downloaded over bytes announced, across the layers
 * whose size Docker has announced (null until the first one), and a layer
 * count.
 * @param {Map} layers - Layer id -> { current, total, done }.
 * @returns {object} The progress (0-100 or null) and the layer summary.
 * @example
 * const { progress, detail } = summarizePullProgress(layers);
 */
function summarizePullProgress(layers) {
  let current = 0;
  let total = 0;
  let done = 0;
  layers.forEach((layer) => {
    if (layer.total !== null) {
      current += layer.current;
      total += layer.total;
    }
    if (layer.done) {
      done += 1;
    }
  });
  return {
    progress: total > 0 ? Math.floor((current / total) * 100) : null,
    detail: `${done}/${layers.size} layers`,
  };
}

/**
 * @description Push the state of one sub-container to the frontend
 * (supervision block), as GET /container reports it.
 * @param {object} service - The external integration service (plain object).
 * @param {string} name - The sub-container name.
 * @param {string} [status] - The Docker status to report when no download runs.
 * @example
 * gladys.externalIntegration.emitSubContainerUpdate(service, 'frigate', 'running');
 */
function emitSubContainerUpdate(service, name, status = 'stopped') {
  const key = `${service.id}:${name}`;
  const pull = this.subContainerPulls.get(key);
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CONTAINER_UPDATED,
    payload: {
      selector: service.selector,
      name,
      status: pull ? 'pulling' : status,
      pull: pull ? { progress: pull.progress, detail: pull.detail } : null,
      last_error: this.subContainerErrors.get(key) || null,
    },
  });
}

/**
 * @description Remove the container a download started after losing the
 * ownership of its key (stop, uninstall, update or ERROR while the container
 * was being created or started): the gesture that cancelled it wins, so
 * nothing it stopped or removed may be left running. The forced removal
 * stops it first; the next start recreates it, the image is there.
 * @param {object} service - The external integration service (plain object).
 * @param {string} name - The sub-container name.
 * @param {string} containerId - The container the cancelled start created.
 * @returns {Promise} Resolve when the container is gone; never rejects.
 * @example
 * await gladys.externalIntegration.discardSubContainer(service, 'frigate', container.id);
 */
async function discardSubContainer(service, name, containerId) {
  try {
    await this.system.removeContainer(containerId, { force: true });
  } catch (e) {
    logger.warn(
      `Unable to remove sub-container ${name} of integration ${service.selector} after its cancelled start`,
      e,
    );
  }
}

/**
 * @description Download the image of a declared sub-container in the
 * background, then create and start it and put it in the "running" desired
 * state — what POST /container/:name/start does synchronously when the image
 * is already there. Used by the first start of a `manual` entry, whose image
 * install no longer pulls (B.2: gigabytes for Frigate). The entry reads
 * `pulling` with its progress in GET /container meanwhile. A failure leaves
 * the container absent with a `last_error` and never touches failure_count:
 * a deliberate start that could not download is not a crash. A second call
 * while the download runs joins it (its env, if any, replaces the previous one).
 * The entry of `subContainerPulls` is the source of truth of the ownership:
 * a stop, an uninstall or an update removes it (cancelSubContainerPull) and
 * a newer download may take the key, so it is checked before AND after the
 * start — a container created by a download that lost it is removed, the
 * desired state is never set to `running` on its behalf, and a cancelled
 * download never records an error.
 * @param {object} service - The external integration service (plain object).
 * @param {object} entry - The sub-container declaration from the manifest.
 * @param {object} [options] - Options of startSubContainer ({ env }).
 * @returns {Promise} Resolve when the download and the start are over; never rejects.
 * @example
 * gladys.externalIntegration.pullAndStartSubContainer(service, entry, { env });
 */
function pullAndStartSubContainer(service, entry, options = {}) {
  const key = `${service.id}:${entry.name}`;
  const inFlight = this.subContainerPulls.get(key);
  if (inFlight) {
    // a later start joins the download; only an explicit env replaces the
    // one the container will be created with
    if (options.env !== undefined) {
      inFlight.options = options;
    }
    return inFlight.promise;
  }
  const abortController = new AbortController();
  const pull = { progress: null, detail: null, options, abortController, emittedAt: 0 };
  this.subContainerPulls.set(key, pull);
  this.subContainerErrors.delete(key);
  this.emitSubContainerUpdate(service, entry.name);
  const layers = new Map();
  const onProgress = (progressEvent) => {
    if (!trackLayer(layers, progressEvent)) {
      return;
    }
    Object.assign(pull, summarizePullProgress(layers));
    const now = Date.now();
    if (now - pull.emittedAt >= SUB_CONTAINER_PULL_PROGRESS_INTERVAL_MS) {
      pull.emittedAt = now;
      this.emitSubContainerUpdate(service, entry.name);
    }
  };
  const owned = () => this.subContainerPulls.get(key) === pull;
  const run = async () => {
    try {
      await this.ensureImage(entry.docker_image, {
        allowLocal: !service.store_slug,
        onProgress,
        abortSignal: abortController.signal,
      });
    } catch (e) {
      if (owned()) {
        this.subContainerErrors.set(key, SUB_CONTAINER_ERRORS.PULL_FAILED);
      }
      return 'stopped';
    }
    // stopped while the last bytes arrived: the stop wins
    if (!owned()) {
      return 'stopped';
    }
    try {
      const container = await this.startSubContainer(service, entry, pull.options);
      if (!owned()) {
        // stopped or removed while the container was being created or
        // started: it must not outlive that gesture
        await this.discardSubContainer(service, entry.name, container.id);
        return 'stopped';
      }
      await this.setDesiredContainer(service, entry.name, 'running');
      return 'running';
    } catch (e) {
      // a start that failed after a stop is not an error to report: the
      // canceller deals with whatever container is left (not running)
      if (owned()) {
        logger.warn(`Unable to start sub-container ${entry.name} of integration ${service.selector}`, e);
        this.subContainerErrors.set(key, SUB_CONTAINER_ERRORS.START_FAILED);
      }
      return 'stopped';
    }
  };
  const runAndClear = async () => {
    const status = await run();
    // a stop (cancelSubContainerPull) already cleared and pushed this
    // download; a newer one may even have taken the key since
    if (owned()) {
      this.subContainerPulls.delete(key);
      this.emitSubContainerUpdate(service, entry.name, status);
    }
  };
  pull.promise = runAndClear();
  return pull.promise;
}

/**
 * @description Abort the image download of a sub-container, if one runs
 * (POST /container/:name/stop, stop of the whole integration, update,
 * uninstall, ERROR), and wait until it has settled: when this resolves, the
 * download no longer creates nor starts anything, and a container it had
 * already created is gone — the caller can inspect or remove the containers.
 * @param {object} service - The external integration service (plain object).
 * @param {string} name - The sub-container name.
 * @returns {Promise<boolean>} Resolve with true if a download was aborted.
 * @example
 * await gladys.externalIntegration.cancelSubContainerPull(service, 'frigate');
 */
async function cancelSubContainerPull(service, name) {
  const key = `${service.id}:${name}`;
  const pull = this.subContainerPulls.get(key);
  if (!pull) {
    return false;
  }
  logger.info(`Download of the image of sub-container ${name} of integration ${service.selector} aborted`);
  this.subContainerPulls.delete(key);
  pull.abortController.abort();
  this.emitSubContainerUpdate(service, name);
  // a start arriving meanwhile waits for it (controlSubContainer): the
  // cancelled download must not remove or reuse the container it creates
  this.cancelledSubContainerPulls.set(key, pull.promise);
  // never rejects (runAndClear); no newer download can take the key before
  // it settles, since the starts wait for it
  await pull.promise;
  this.cancelledSubContainerPulls.delete(key);
  return true;
}

module.exports = {
  trackLayer,
  summarizePullProgress,
  emitSubContainerUpdate,
  discardSubContainer,
  pullAndStartSubContainer,
  cancelSubContainerPull,
};
