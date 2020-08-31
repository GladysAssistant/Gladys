/**
 * @description Check if Gladys network on Docker is well configured for embedded broker.
 * @returns {Promise} Promise with true if network is usable.
 * @example
 * checkDockerNetwork();
 */
async function checkDockerNetwork() {
  const gladysNetworkMode = await this.gladys.system.getNetworkMode();
  return gladysNetworkMode === 'host';
}

module.exports = {
  checkDockerNetwork,
};
