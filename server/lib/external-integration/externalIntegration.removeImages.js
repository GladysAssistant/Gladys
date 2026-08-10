const Promise = require('bluebird');

const logger = require('../../utils/logger');
const { RECENTLY_PULLED_PROTECTION_MS } = require('./constants');

/**
 * @description Remove Docker images Gladys pulled and no longer needs. Two
 * guards stand between a candidate and its deletion: the images still
 * referenced by an installed integration are filtered out here (a shared
 * third-party image must survive the uninstall of one of its users), and
 * Docker itself refuses to delete an image a container still references
 * (`system.removeImage` never forces). Best-effort throughout: a cleanup
 * failure is logged, never raised — the update or uninstall that called it has
 * already succeeded and must not be reported as failed over reclaimed disk.
 * @param {Array<string>} images - The image references to remove.
 * @param {object} [options] - Options.
 * @param {boolean} [options.skipRecentlyPulled] - Spare the images pulled less
 * than RECENTLY_PULLED_PROTECTION_MS ago. For the nightly sweep, whose
 * candidates are guesses about what nobody needs; never for update/uninstall,
 * which name images they know are theirs to drop — two updates within the hour
 * would otherwise leave the first one's image behind.
 * @returns {Promise<Array<string>>} Resolve with the references actually removed.
 * @example
 * await gladys.externalIntegration.removeImages(['ghcr.io/john/demo:1.2.0']);
 */
async function removeImages(images, { skipRecentlyPulled = false } = {}) {
  if (!this.available) {
    return [];
  }
  const candidates = [...new Set((images || []).filter(Boolean))];
  if (candidates.length === 0) {
    return [];
  }
  let inUse;
  try {
    inUse = await this.getImagesInUse();
  } catch (e) {
    logger.warn('Unable to list the Docker images in use, skipping the image cleanup', e);
    return [];
  }
  const removed = [];
  await Promise.each(
    candidates.filter((image) => !inUse.has(image)),
    async (image) => {
      // read at the last moment, never once up front: removals are sequential,
      // so an install starting while the earlier images are being removed
      // would otherwise get its brand new image deleted from under it. This
      // also covers `inUse` going stale during the loop — that install writes
      // its t_service row after the pull this check sees.
      if (skipRecentlyPulled) {
        const pulledAt = this.system.getImagePullTime(image);
        if (pulledAt !== undefined && Date.now() - pulledAt < RECENTLY_PULLED_PROTECTION_MS) {
          logger.debug(`Sparing the Docker image ${image}, it was just pulled`);
          return;
        }
      }
      try {
        if (await this.system.removeImage(image)) {
          logger.info(`Removed unused Docker image ${image}`);
          removed.push(image);
        } else {
          logger.debug(`Docker declined to remove the image ${image}, it is still in use`);
        }
      } catch (e) {
        logger.warn(`Unable to remove the Docker image ${image}`, e);
      }
    },
  );
  return removed;
}

module.exports = {
  removeImages,
};
