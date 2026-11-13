const { IMAGES } = require('./constants');

/**
 * @description Download in parallel the images of the containers that are missing from the machine: before init
 * replaces a container by a new version, which keeps running meanwhile, or ahead of the installation (see
 * startPrefetch). Init gives the table where the error of each download that fails is kept: it goes on with the
 * containers in place, and a container to create fails at once on it (see pullImage).
 * @param {object} [failures] - Error of each download that fails, by image. Written even once the call ended, when
 * one download fails after the other: the caller decides how long it keeps it.
 * @returns {Promise} Resolve once the missing images are downloaded.
 * @example
 * await this.pullMissingImages(this.imagePullFailures);
 */
async function pullMissingImages(failures = {}) {
  // Each image is downloaded only when missing
  await Promise.all(
    IMAGES.map(async (image) => {
      try {
        await this.pullImage(image);
      } catch (e) {
        failures[image] = e;
        throw e;
      }
    }),
  );
}

module.exports = {
  pullMissingImages,
};
