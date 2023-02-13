const { Netmask } = require('netmask');

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

/**
 * @description Scan for network devices.
 * @returns {Promise} - Discovered devices.
 * @example
 * await lanManager.scan();
 */
async function scan() {
  if (!this.scanning) {
    this.scanning = true;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: this.getStatus(),
    });

    // Generates IPs to scan
    const ipArrayToScan = new Set();
    this.ipMasks
      .filter((ipMask) => ipMask.enabled)
      .forEach((ipMask) => {
        const block = new Netmask(ipMask.mask);
        block.forEach((ip) => ipArrayToScan.add(ip));
      });

    try {
      if (ipArrayToScan.size !== 0) {
        this.discoveredDevices = await this.lanDiscovery.discover(Array.from(ipArrayToScan));
        logger.info(`LANManager discovers ${this.discoveredDevices.length} devices`);
      }
    } catch (e) {
      this.discoveredDevices = [];
      logger.error('LANManager fails to discover devices over network -', e);
    } finally {
      this.scanning = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
        payload: this.getStatus(),
      });
    }
  }

  return this.discoveredDevices;
}

module.exports = {
  scan,
};
