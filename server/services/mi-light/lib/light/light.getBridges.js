const logger = require('../../../../utils/logger');

/**
 * @description Return milight bridges
 * @example
 * getBridges();
 */
async function getBridges() {
  // IMPORTANT NOTE
  // Instead of providing the global broadcast address which is the default, 
  // you should provide the IP address of the Milight Controller for unicast mode. 
  // Don't use the global broadcast address on Windows as this may give unexpected results. 
  // On Windows, global broadcast packets will only be routed via the first network adapter. 
  // If you want to use a broadcast address though, use a network-specific address, 
  // e.g. for 192.168.0.1/24 use 192.168.0.255.
  // this.bridges = await this.milightClient.discoverBridges({address: '192.168.x.x', type: 'all'});
  this.bridges = await this.milightClient.discoverBridges({address: '255.255.255.255', type: 'all'});
  logger.info(`MiLightService: Found ${this.bridges.length} bridges`);
  this.bridges.forEach((bridge) => {
    this.bridgesByMac.set(bridge.mac, bridge);
  });
  return this.bridges;
}

module.exports = {
  getBridges,
};
