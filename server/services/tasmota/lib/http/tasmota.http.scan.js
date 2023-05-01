const logger = require('../../../../utils/logger');
const { BadParameters } = require('../../../../utils/coreErrors');

const intToIp = (ipInt) => {
  const ipArr = [];
  let num = ipInt;
  for (let i = 4; i > 0; i -= 1) {
    ipArr.push(num % 256);
    num = Math.floor(num / 256);
  }
  return ipArr.reverse().join('.');
};

const ipToInt = (ipStr) => {
  return ipStr
    .split('.')
    .map(parseFloat)
    .reverse()
    .reduce((acc, cur, index) => acc + cur * 256 ** index);
};

/**
 * @description Scan for HTTP devices.
 * @param {object} options - IP to scan.
 * @returns {null} Return when scan started.
 * @example
 * tasmotaManager.scanHttp({ singleAddress: '192.168.1.1' });
 * @example
 * tasmotaManager.scanHttp({ firstAddress: '192.168.1.1', lastAddress: '192.168.1.100' });
 */
function scan(options) {
  const { singleAddress, firstAddress, lastAddress, username, password } = options;
  if (singleAddress) {
    logger.debug(`Tasmota: HTTP looking for ${singleAddress}`);
    this.status(singleAddress, username, password);
  } else if (firstAddress && lastAddress) {
    logger.debug(`Tasmota: looing from ${firstAddress} to ${lastAddress}...`);

    let currentIntAddress = ipToInt(firstAddress);
    const lastIntAddress = ipToInt(lastAddress);
    while (currentIntAddress <= lastIntAddress) {
      const ipAddress = intToIp(currentIntAddress);
      logger.debug(`Tasmota: HTTP looking for ${ipAddress}`);

      this.status(ipAddress, undefined, undefined);
      currentIntAddress += 1;
    }
  } else {
    throw new BadParameters(
      'Tasmota: HTTP scanner needs "singleAddress" or both "firstAddress" and "lastAddress" options.',
    );
  }

  return null;
}

module.exports = {
  scan,
};
