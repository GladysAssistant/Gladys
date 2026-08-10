const logger = require('../../utils/logger');
const { MANIFEST_IMAGE_LABEL, RECENTLY_PULLED_PROTECTION_MS } = require('./constants');

/**
 * @description Scheduled sweep of the integration images left behind: the ones
 * an update superseded before this cleanup existed, and the ones an
 * integration removed from the store — or a Gladys crash mid-install — never
 * got to delete. Targeted deletion at update/uninstall keeps a fresh install
 * clean; this is what gives an already-bloated install its disk back.
 *
 * The sweep is deliberately narrow: it only ever considers images carrying the
 * `io.gladysassistant.manifest` label, i.e. images built as Gladys
 * integrations. A blind `docker image prune -a` would be both ineffective —
 * integration images carry an explicit version tag, so an old one is never
 * *dangling* — and dangerous, since Gladys usually shares its Docker daemon
 * with the rest of the user's containers. Nothing outside Gladys' own images
 * is ever a candidate. Sub-container images (a Mosquitto broker, a Frigate)
 * carry no such label and are only removed by reference, at update and
 * uninstall time, where the manifest tells us they were ours.
 * @returns {Promise<Array<string>>} Resolve with the image references removed.
 * @example
 * await gladys.externalIntegration.cleanImages();
 */
async function cleanImages() {
  if (!this.available) {
    return [];
  }
  let images;
  try {
    images = await this.system.listImages({ filters: { label: [MANIFEST_IMAGE_LABEL] } });
  } catch (e) {
    logger.warn('Unable to list the Docker images, skipping the external integration image cleanup', e);
    return [];
  }
  // An image with several tags is a candidate through each of them: removing
  // one reference only untags it, and a tag still in use keeps the image
  // alive. An untagged one (a rebuilt `:dev` install) can only be named by id.
  const candidates = images.reduce(
    (references, image) => references.concat(image.tags.length > 0 ? image.tags : [image.id]),
    [],
  );
  // install and update pull their images *before* writing the t_service row
  // that declares them. A sweep landing in that window would see a brand new
  // image as an orphan and delete it under the operation that just fetched it
  // — and Docker's own 409 is no help there, the container does not exist yet.
  const now = Date.now();
  const notJustPulled = candidates.filter((reference) => {
    const pulledAt = this.system.getImagePullTime(reference);
    return pulledAt === undefined || now - pulledAt >= RECENTLY_PULLED_PROTECTION_MS;
  });
  const removed = await this.removeImages(notJustPulled);
  if (removed.length > 0) {
    logger.info(`External integration image cleanup: removed ${removed.length} unused image(s)`);
  }
  return removed;
}

module.exports = {
  cleanImages,
};
