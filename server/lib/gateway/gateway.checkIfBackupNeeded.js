const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');

/**
 * @description Generate a number between 0 and max included.
 * @param {number} max - The upper bound included.
 * @returns {number} - Return a random value.
 * @example
 *
 * const rand = generateRandomInteger(1000);
 */
function generateRandomInteger(max) {
  return Math.floor(Math.random() * max) + 1;
}

/**
 * @description Check if a backup is needed.
 * @example
 * checkIfBackupNeeded();
 */
async function checkIfBackupNeeded() {
  if (!this.connected) {
    logger.info(`Instance not connected to Gladys Gateway, not backing up.`);
    return;
  }
  const backups = await this.getBackups();
  let shouldBackup = false;
  if (backups.length === 0) {
    shouldBackup = true;
  } else {
    const lastBackupTimestamp = new Date(backups[0].created_at).getTime();
    const yesterday = new Date().getTime() - 24 * 60 * 60 * 1000;
    if (lastBackupTimestamp <= yesterday) {
      shouldBackup = true;
    }
  }
  if (shouldBackup) {
    // To avoid being too brutal with the Gladys Gateway server
    // we start backups at a random moment
    // between now (0ms wait) and RAND_INTERVAL_IN_MS wait
    const randomMoment = generateRandomInteger(this.backupRandomInterval);
    logger.info(`Backup will be started in ${Math.round(randomMoment / 1000)} seconds`);
    setTimeout(() => {
      logger.info(`Starting backup!`);
      this.event.emit(EVENTS.GATEWAY.CREATE_BACKUP);
    }, randomMoment);
  } else {
    logger.info(`Not backing up instance to Gladys Gateway, last backup is recent.`);
  }
}

module.exports = {
  checkIfBackupNeeded,
};
