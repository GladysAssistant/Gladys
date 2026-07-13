const logger = require('../../utils/logger');

/**
 * @description Stop advertising Gladys on the local network (sends mDNS goodbye packets).
 * @returns {Promise} Resolve when the mDNS instance is destroyed.
 * @example
 * await mdns.stop();
 */
async function stop() {
  if (this.announceTimeout !== null) {
    clearTimeout(this.announceTimeout);
    this.announceTimeout = null;
  }
  if (this.mdns === null) {
    return;
  }
  const instance = this.mdns;
  this.mdns = null;
  try {
    const goodbyes = this.getRecords(0);
    if (goodbyes.length > 0) {
      await new Promise((resolve) => {
        instance.respond({ answers: goodbyes }, () => resolve(null));
      });
    }
    await new Promise((resolve) => {
      instance.destroy(() => resolve(null));
    });
    logger.info('mDNS: stopped advertising Gladys');
  } catch (e) {
    logger.warn(e);
  }
}

module.exports = {
  stop,
};
