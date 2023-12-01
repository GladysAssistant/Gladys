/**
 * @description Get eWeLink status.
 * @returns {object} Current eWeLink network status.
 * @example
 * this.getStatus();
 */
function getStatus() {
  return this.status;
}

module.exports = {
  getStatus,
};
