const { IMAGES } = require('./constants');

/**
 * @description Download in parallel the images of the containers that are missing from the machine: before init
 * replaces a container by a new version, which keeps running meanwhile, or ahead of the installation (see
 * startPrefetch). The error of each download that fails is kept until the next call: init goes on with the containers
 * in place, and a container to create fails at once on it (see pullImage).
 * @returns {Promise} Resolve once the missing images are downloaded.
 * @example
 * await this.pullMissingImages();
 */
async function pullMissingImages() {
  this.imagePullFailures = {};
  // Each image is downloaded only when missing
  await Promise.all(
    IMAGES.map(async (image) => {
      try {
        await this.pullImage(image);
      } catch (e) {
        this.imagePullFailures[image] = e;
        throw e;
      }
    }),
  );
}

module.exports = {
  pullMissingImages,
};
