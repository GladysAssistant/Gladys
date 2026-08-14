/**
 * @description Return when Gladys last pulled an image, if it did so during
 * this process' lifetime. Used by the external integration image cleanup to
 * leave alone an image that was just fetched but whose `t_service` row does
 * not declare it yet (see B.20 of the external integrations spec).
 * @param {string} imageName - Name of the image (with tag or digest).
 * @returns {number|undefined} The timestamp of the last pull, undefined if never pulled here.
 * @example
 * const pulledAt = getImagePullTime('ghcr.io/john/my-integration:1.0.0');
 */
function getImagePullTime(imageName) {
  return this.imagePullTimes.get(imageName);
}

module.exports = {
  getImagePullTime,
};
