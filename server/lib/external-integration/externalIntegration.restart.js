/**
 * @description Restart an external integration (stop then start).
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise<object>} Resolve with the integration.
 * @example
 * await gladys.externalIntegration.restart('ext-dev-my-integration');
 */
async function restart(selector) {
  await this.stop(selector);
  return this.start(selector);
}

module.exports = {
  restart,
};
