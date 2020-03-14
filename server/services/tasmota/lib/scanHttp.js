const logger = require('../../../utils/logger');
const { status } = require('./http/tasmota.http.status.js');

/**
 * @description Scan for HTTP devices.
 * @param {Object} options - IP to scan.
 * @example
 * tasmotaManager.scanHttp({ singleAddress: '192.168.1.1' });
 * @example
 * tasmotaManager.scanHttp({ firstAddress: '192.168.1.1', lastAddress: '192.168.1.100' });
 */
function scanHttp(options) {
  const { singleAddress, firstAddress, lastAddress, username, password } = options;
  if (singleAddress) {
    logger.debug(`Tasmota: HTTP looking for ${singleAddress} ${username} ${password}`);
    status(singleAddress, username, password, this);
  } else if (firstAddress && lastAddress) {
    let [firstAddressR1, firstAddressR2, firstAddressR3, firstAddressR4] = firstAddress
      .split('.')
      .map((v) => parseInt(v, 10));
    const [lastAddressR1, lastAddressR2, lastAddressR3, lastAddressR4] = lastAddress
      .split('.')
      .map((v) => parseInt(v, 10));

    logger.debug(`${firstAddress}`);
    logger.debug(`${lastAddress}`);

    // Loop on 1st numbers
    while (firstAddressR1 <= lastAddressR1) {
      // Loop on 2nd numbers
      while (firstAddressR2 <= lastAddressR2) {
        // Loop on 3rd numbers
        while (firstAddressR3 <= lastAddressR3) {
          // Loop on 4th numbers
          while (firstAddressR4 <= lastAddressR4) {
            const ipAddress = `${firstAddressR1}.${firstAddressR2}.${firstAddressR3}.${firstAddressR4}`;
            logger.debug(`Tasmota: HTTP looking for ${ipAddress}`);

            status(ipAddress, undefined, undefined, this);
            firstAddressR4 += 1;
          }
          firstAddressR3 += 1;
        }
        firstAddressR2 += 1;
      }
      firstAddressR1 += 1;
    }
  } else {
    throw new Error('Tasmota: HTTP scanner needs "singleAddress" or both "firstAddress" and "lastAddress" options.');
  }

  return null;
}

module.exports = {
  scanHttp,
};
