const { INSTALLATION_STATE, IMAGE_SIZE_IN_BYTES } = require('./constants');

/**
 * @description Update the progress of the running prefetch with the progress of the download of one of its images, each
 * image counting for its size. Without effect outside a prefetch, or for an image that it does not download.
 * @param {string} image - Image being downloaded.
 * @param {number} progress - Progress of its download in percent.
 * @example
 * this.updatePrefetchProgress('koenkk/zigbee2mqtt:2.14.2', 42);
 */
function updatePrefetchProgress(image, progress) {
  if (this.prefetch.state !== INSTALLATION_STATE.RUNNING || this.prefetchProgressByImage[image] === undefined) {
    return;
  }
  this.prefetchProgressByImage[image] = progress;
  const prefetchedImages = Object.entries(this.prefetchProgressByImage);
  const weightedProgress = prefetchedImages.reduce(
    (sum, [prefetchedImage, imageProgress]) => sum + IMAGE_SIZE_IN_BYTES[prefetchedImage] * imageProgress,
    0,
  );
  // Not neededBytes, which adds the margin kept free on the disk
  const totalSize = prefetchedImages.reduce((sum, [prefetchedImage]) => sum + IMAGE_SIZE_IN_BYTES[prefetchedImage], 0);
  // Never backwards: a pull discovers the size of the layers as it goes
  this.prefetch.progress = Math.max(this.prefetch.progress, Math.floor(weightedProgress / totalSize));
}

module.exports = {
  updatePrefetchProgress,
};
