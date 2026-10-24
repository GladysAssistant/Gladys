const { parseBoundedInteger } = require('./music.getPlayer');

/**
 * @description Jump to an item of the queue of a player, by its index in the
 * full queue (capabilities/music.md, section 4.3).
 * @param {string} selector - The device selector.
 * @param {number|string} index - The index in the full queue.
 * @returns {Promise} Resolve when the integration acked.
 * @example
 * await gladys.device.music.playQueueItem('kitchen-speaker', 7);
 */
async function playQueueItem(selector, index) {
  const { device, music } = this.getPlayer(selector);
  await music.playQueueItem(device, parseBoundedInteger(index, { name: 'index', min: 0 }));
}

module.exports = {
  playQueueItem,
};
