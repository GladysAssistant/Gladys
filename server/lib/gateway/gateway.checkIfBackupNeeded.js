const logger = require('../../utils/logger');
/**
 * @description Check if a backup is needed
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
    logger.info(`Trying to backup instance to Gladys Gateway`);
    await this.backup();
  } else {
    logger.info(`Not backing up instance to Gladys Gateway, last backup is recent.`);
  }
}

module.exports = {
  checkIfBackupNeeded,
};
