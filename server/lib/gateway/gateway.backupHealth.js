const Promise = require('bluebird');

const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES, USER_ROLE } = require('../../utils/constants');

// The admins are told about a backup problem from its second night on: one
// missed night (network blip, Gladys Plus maintenance, a restart during the
// backup window) is almost always transient and fixed by the next attempt.
// Any delay between one night (26h with the 2h random window) and two nights
// (46h) means "two consecutive failed nights"; the midpoint keeps a margin
// on both sides.
const FIRST_ALERT_DELAY_IN_MS = 36 * 60 * 60 * 1000;
// then one reminder a week while it keeps failing, never more
const REMINDER_INTERVAL_IN_MS = 7 * 24 * 60 * 60 * 1000;

// the brain answers exist in these languages only, see config/brain/index.js
const FALLBACK_LANGUAGE = 'en';

// error texts of the nights where no backup could even be attempted
const BACKUP_ERRORS = {
  NOT_CONNECTED: 'Gladys is not connected to Gladys Plus',
  UNREACHABLE: 'Gladys Plus could not be reached',
};

/**
 * @description Format a date for a message to a user.
 * @param {string} isoDate - The ISO date to format.
 * @param {string} language - The language of the user.
 * @param {string|null} timezone - The timezone of the instance, null for the system one.
 * @returns {string} The formatted date.
 * @example
 * formatDate('2024-01-05T02:00:00.000Z', 'fr', 'Europe/Paris');
 */
function formatDate(isoDate, language, timezone) {
  return new Date(isoDate).toLocaleString(language, { timeZone: timezone || undefined });
}

/**
 * @description Get the message of an intent in the language of a user, in
 * English when the brain has no answers in that language (the brain answers
 * exist in en / fr / es, the interface has more languages).
 * @param {object} gateway - The gateway instance.
 * @param {string} language - The language of the user.
 * @param {string} intent - The brain intent.
 * @param {object} context - The context of the message.
 * @returns {string} The message.
 * @example
 * getReply(this, 'de', 'backup.recovered', context);
 */
function getReply(gateway, language, intent, context) {
  try {
    return gateway.brain.getReply(language, intent, context);
  } catch (e) {
    logger.debug(`No "${intent}" answer in language ${language}, falling back to English`);
    return gateway.brain.getReply(FALLBACK_LANGUAGE, intent, context);
  }
}

/**
 * @description Tell the admins of this instance about the health of the
 * backups, in their language, through the channel of the system messages.
 * Best effort: one failing admin must not prevent the others from being told.
 * @param {object} gateway - The gateway instance.
 * @param {string} intent - The brain intent to send.
 * @param {object} context - The dates (ISO) and error of the message.
 * @param {string} [context.failingSince] - When the current failure streak started.
 * @param {string} [context.lastSuccessAt] - When the last backup was uploaded.
 * @param {string} [context.errorMessage] - The last error.
 * @returns {Promise} Resolve when every admin was handled.
 * @example
 * await notifyAdmins(this, 'backup.failing', { failingSince, lastSuccessAt, errorMessage });
 */
async function notifyAdmins(gateway, intent, { failingSince = null, lastSuccessAt = null, errorMessage = null }) {
  const timezone = await gateway.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
  const admins = await gateway.user.getByRole(USER_ROLE.ADMIN);
  await Promise.each(admins, async (admin) => {
    try {
      const text = getReply(gateway, admin.language, intent, {
        failingSinceDate: failingSince ? formatDate(failingSince, admin.language, timezone) : null,
        lastSuccessDate: lastSuccessAt ? formatDate(lastSuccessAt, admin.language, timezone) : null,
        errorMessage,
      });
      await gateway.message.sendSystemMessage(admin.selector, text, null, { messageType: 'notification' });
    } catch (e) {
      logger.error(`Unable to send the backup health message (${intent}) to ${admin.selector}`, e);
    }
  });
}

/**
 * @description Return the health of the Gladys Plus backups, as saved locally.
 * @returns {Promise<object>} The last success, the current failure streak and the last alert.
 * @example
 * const { last_success_at, failing_since, last_error, alert_sent_at } = await gateway.getBackupHealth();
 */
async function getBackupHealth() {
  const [lastSuccessAt, failingSince, lastError, alertSentAt] = await Promise.all([
    this.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT),
    this.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE),
    this.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_ERROR),
    this.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT),
  ]);
  return {
    last_success_at: lastSuccessAt,
    failing_since: failingSince,
    last_error: lastError,
    alert_sent_at: alertSentAt,
  };
}

/**
 * @description A backup was uploaded: close the failure streak, and tell the
 * admins that backups work again when they had been warned of a problem.
 * Never throws: the backup is on Gladys Plus, a bookkeeping error must not
 * turn it into a failure.
 * @param {Date} [date] - When the backup was uploaded, now by default.
 * @returns {Promise} Resolve when the state is saved.
 * @example
 * await gateway.recordBackupSuccess();
 */
async function recordBackupSuccess(date = new Date()) {
  try {
    const health = await this.getBackupHealth();
    await this.variable.setValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_SUCCESS_AT, date.toISOString());
    await this.variable.destroy(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE);
    await this.variable.destroy(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_ERROR);
    if (health.alert_sent_at === null) {
      return;
    }
    await this.variable.destroy(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT);
    logger.info('Gateway backup: backups are working again, telling the admins.');
    await notifyAdmins(this, 'backup.recovered', { lastSuccessAt: date.toISOString() });
  } catch (e) {
    logger.warn('Gateway backup: unable to record the backup success');
    logger.warn(e);
  }
}

/**
 * @description A backup failed, or could not be attempted tonight: keep the
 * failure streak, and alert the admins on the state of the backups rather than
 * on each attempt. First alert once no backup has succeeded for two nights,
 * then one reminder a week while it keeps failing; the recovery is announced
 * by recordBackupSuccess. Never throws: the caller has a backup error of its
 * own to report.
 * @param {string} errorMessage - Why the backup failed.
 * @returns {Promise} Resolve when the state is saved.
 * @example
 * await gateway.recordBackupFailure(e.toString());
 */
async function recordBackupFailure(errorMessage) {
  try {
    const now = new Date();
    const health = await this.getBackupHealth();
    const failingSince = health.failing_since || now.toISOString();
    if (health.failing_since === null) {
      await this.variable.setValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_FAILING_SINCE, failingSince);
    }
    await this.variable.setValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_LAST_ERROR, String(errorMessage));
    // an instance that never backed up is measured from its first failure
    const reference = new Date(health.last_success_at || failingSince);
    if (now.getTime() - reference.getTime() < FIRST_ALERT_DELAY_IN_MS) {
      logger.info('Gateway backup: first failed night, the admins will be told if it fails again.');
      return;
    }
    if (
      health.alert_sent_at !== null &&
      now.getTime() - new Date(health.alert_sent_at).getTime() < REMINDER_INTERVAL_IN_MS
    ) {
      logger.info('Gateway backup: still failing, the admins were already told this week.');
      return;
    }
    const intent = health.alert_sent_at === null ? 'backup.failing' : 'backup.still-failing';
    await this.variable.setValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_ALERT_SENT_AT, now.toISOString());
    logger.warn(`Gateway backup: backups failing since ${failingSince}, telling the admins (${intent}).`);
    await notifyAdmins(this, intent, {
      failingSince,
      lastSuccessAt: health.last_success_at,
      errorMessage: String(errorMessage),
    });
  } catch (e) {
    logger.warn('Gateway backup: unable to record the backup failure');
    logger.warn(e);
  }
}

module.exports = {
  BACKUP_ERRORS,
  getBackupHealth,
  recordBackupSuccess,
  recordBackupFailure,
};
