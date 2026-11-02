const logger = require('../../utils/logger');
const { EVENTS, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { Error402, Error403 } = require('../../utils/httpErrors');
const { BACKUP_ERRORS } = require('./gateway.backupHealth');

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
 * @description Return the calendar day of a date in the timezone of the instance.
 * @param {Date} date - The date.
 * @param {string|null} timezone - The timezone of the instance, null for the system one.
 * @returns {string} The day, as YYYY-MM-DD.
 * @example
 * getLocalDay(new Date(), 'Europe/Paris');
 */
function getLocalDay(date, timezone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || undefined,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * @description Check if a backup is needed: one backup a day, on the calendar
 * day of the instance. Runs every night, once in the daytime and after
 * start-up (see gateway.init), so a day missed for any reason is caught up.
 * @example
 * checkIfBackupNeeded();
 */
async function checkIfBackupNeeded() {
  // The checks overlap by design (night, daytime, start-up, subscription
  // unlock): the Gateway list only shows a backup once it is uploaded, so
  // a check running while one is pending or in progress would schedule a
  // second one, and two backups at once empty the same folder
  if (this.pendingBackupTimer !== null) {
    logger.info(`A backup is already scheduled, not checking again.`);
    return;
  }
  if (this.backupInProgress) {
    logger.info(`A backup is in progress, not checking again.`);
    return;
  }
  if (!this.connected) {
    const refreshToken = await this.variable.getValue('GLADYS_GATEWAY_REFRESH_TOKEN');
    if (refreshToken === null) {
      logger.debug(`Gladys Plus is not configured, not backing up.`);
      return;
    }
    logger.info(`Instance not connected to Gladys Gateway, not backing up.`);
    // the instance is linked but cannot reach Gladys Plus: a night without
    // backup the admins must hear about if it lasts
    await this.recordBackupFailure(BACKUP_ERRORS.NOT_CONNECTED);
    return;
  }
  // Also the daily probe of a locked instance: one cheap call a day, and the
  // first success after the payment unlocks the features (see getBackups)
  let backups;
  try {
    backups = await this.getBackups();
  } catch (e) {
    if (e instanceof Error402) {
      logger.info(`Gladys Plus subscription is not paid, not backing up.`);
      return;
    }
    // Gladys Plus refused the list (403 for a plan without backups, the Lite
    // plan): nothing to back up, and nothing to report every night
    if (e instanceof Error403) {
      logger.info(`Backups are not included in the Gladys Plus plan of this instance, not backing up.`);
      return;
    }
    // no internet tonight: no backup, recorded as such
    logger.warn(`Unable to list the Gladys Plus backups, not backing up.`);
    logger.warn(e);
    await this.recordBackupFailure(BACKUP_ERRORS.UNREACHABLE);
    return;
  }
  const timezone = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
  let shouldBackup = false;
  if (backups.length === 0) {
    shouldBackup = true;
  } else {
    const lastBackupDate = new Date(backups[0].created_at);
    // Gladys Plus is the source of truth for the last backup: it fills the
    // local health at the first run after an upgrade, and fixes it after the
    // restore of an old backup (whose health is the one of the day it was made)
    const health = await this.getBackupHealth();
    if (health.last_success_at === null || new Date(health.last_success_at) < lastBackupDate) {
      await this.recordBackupSuccess(lastBackupDate);
    }
    // One backup a day, by calendar day: the night check starts between 2 and
    // 4 AM, so "the last backup is more than 24 hours old" was false one night
    // out of two, and most instances were backed up every other day
    shouldBackup = getLocalDay(lastBackupDate, timezone) !== getLocalDay(new Date(), timezone);
  }
  if (shouldBackup) {
    // To avoid being too brutal with the Gladys Gateway server
    // we start backups at a random moment
    // between now (0ms wait) and RAND_INTERVAL_IN_MS wait
    const randomMoment = generateRandomInteger(this.backupRandomInterval);
    logger.info(`Backup will be started in ${Math.round(randomMoment / 1000)} seconds`);
    this.pendingBackupTimer = setTimeout(() => {
      this.pendingBackupTimer = null;
      logger.info(`Starting backup!`);
      this.event.emit(EVENTS.GATEWAY.CREATE_BACKUP);
    }, randomMoment);
  } else {
    logger.info(`Not backing up instance to Gladys Gateway, a backup was already made today.`);
  }
}

module.exports = {
  checkIfBackupNeeded,
};
