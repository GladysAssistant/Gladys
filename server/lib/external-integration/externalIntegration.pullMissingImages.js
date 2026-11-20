const Promise = require('bluebird');

const db = require('../../models');
const logger = require('../../utils/logger');
const { SERVICE_STATUS, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Pull the missing images of an integration in the background,
 * then start it again. Called by `start` (not awaited) when `getMissingImages`
 * found something to pull — the backup-restored-on-a-new-machine case: a pull
 * can take minutes (a Frigate image on a Raspberry Pi), and `service.startAll`
 * starts the services one after the other, so an awaited pull would hold
 * Zigbee, MQTT and the scenes back for its whole duration. The integration
 * stays LOADING until the pull ends; the pull is aborted by `stop` and
 * `uninstall` (the AbortController in `imagePulls`), and the start that
 * follows a successful pull only happens when the integration is still
 * LOADING — a stop or an uninstall during the pull wins. A failed pull is
 * the explicit `UNABLE_TO_PULL_IMAGE` error of ensureImage (no local
 * fallback: there is nothing local) and leaves the integration in ERROR.
 * @param {object} service - The external integration service (plain object).
 * @param {Array<string>} images - The image references to pull.
 * @returns {Promise} Resolve when the pull and the start that follows are done.
 * @example
 * gladys.externalIntegration.pullMissingImages(service, ['ghcr.io/john/my-integration:1.0.0']);
 */
async function pullMissingImages(service, images) {
  if (this.imagePulls.has(service.id)) {
    // a start while the images are being pulled: the pull ends with a start
    return;
  }
  const controller = new AbortController();
  this.imagePulls.set(service.id, controller);
  logger.info(`Images of integration ${service.selector} missing on this machine, pulling them: ${images.join(', ')}`);
  try {
    await Promise.each(images, (image) => this.ensureImage(image, { abortSignal: controller.signal }));
  } catch (e) {
    this.imagePulls.delete(service.id);
    if (controller.signal.aborted) {
      logger.info(`Pull of the images of integration ${service.selector} aborted`);
      return;
    }
    logger.warn(`Unable to pull the images of integration ${service.selector}`, e);
    // ERROR only over LOADING, in one conditional write: a stop that landed
    // before the pull was registered (so had nothing to abort) wrote
    // STOPPED, and that must stay the status the user sees
    const [updatedCount] = await db.Service.update(
      { status: SERVICE_STATUS.ERROR },
      { where: { id: service.id, status: SERVICE_STATUS.LOADING } },
    );
    if (updatedCount > 0) {
      this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.STATUS_CHANGED,
        payload: { selector: service.selector, status: SERVICE_STATUS.ERROR },
      });
    }
    return;
  }
  this.imagePulls.delete(service.id);
  let current;
  try {
    current = await this.getBySelector(service.selector);
  } catch (e) {
    // uninstalled during the pull
    logger.debug(e);
    return;
  }
  if (current.status !== SERVICE_STATUS.LOADING) {
    // stopped during the pull
    logger.info(`Integration ${service.selector} is ${current.status} after the pull, not starting it`);
    return;
  }
  try {
    await this.start(service.selector, { resetFailureCount: false });
  } catch (e) {
    // start already persisted the ERROR status
    logger.warn(`Unable to start integration ${service.selector} after pulling its images`, e);
  }
}

/**
 * @description Abort the background pull of the images of an integration,
 * if one is in flight (stop and uninstall: a pull for an integration that
 * is no longer wanted running must not end with a start).
 * @param {string} serviceId - Id of the external integration service.
 * @example
 * gladys.externalIntegration.abortImagePull(service.id);
 */
function abortImagePull(serviceId) {
  const controller = this.imagePulls.get(serviceId);
  if (controller) {
    controller.abort();
  }
}

module.exports = {
  pullMissingImages,
  abortImagePull,
};
