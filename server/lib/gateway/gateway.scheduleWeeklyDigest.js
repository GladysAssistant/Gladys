const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { isSystemVariableEnabled } = require('./gateway.sendWeeklyDigest');

const WEEKLY_DIGEST_MAX_RANDOM_DELAY_MS = 60 * 1000;

/**
 * @description Return a random delay between 0 and 60 seconds (inclusive).
 * @returns {number} Delay in milliseconds.
 * @example
 * getWeeklyDigestRandomDelayMs();
 */
function getWeeklyDigestRandomDelayMs() {
  return Math.floor(Math.random() * (WEEKLY_DIGEST_MAX_RANDOM_DELAY_MS + 1));
}

/**
 * @description Schedule the weekly digest job based on system variables.
 * @returns {Promise<null>} Resolves when scheduled or cancelled.
 * @example
 * scheduleWeeklyDigest();
 */
async function scheduleWeeklyDigest() {
  try {
    if (this.weeklyDigestSchedule?.cancel) {
      this.weeklyDigestSchedule.cancel();
      this.weeklyDigestSchedule = null;
    }

    const enabled = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_ENABLED);
    if (!isSystemVariableEnabled(enabled)) {
      return null;
    }

    const timezone = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
    const dayOfWeek = Number((await this.variable.getValue(SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_DAY)) ?? 0);
    const hour = Number((await this.variable.getValue(SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_HOUR)) ?? 18);

    const rule = {
      tz: timezone,
      dayOfWeek,
      hour,
      minute: 0,
      second: 0,
    };

    this.weeklyDigestSchedule = this.scheduler.scheduleJob(rule, async () => {
      const randomDelayMs = getWeeklyDigestRandomDelayMs();
      if (randomDelayMs > 0) {
        logger.info(`Weekly digest will start in ${Math.round(randomDelayMs / 1000)} seconds`);
        await new Promise((resolve) => {
          setTimeout(resolve, randomDelayMs);
        });
      }

      try {
        await this.sendWeeklyDigest();
      } catch (e) {
        logger.warn('Weekly digest scheduled job failed', e);
      }
    });

    return null;
  } catch (e) {
    logger.warn('Weekly digest scheduling failed', e);
    return null;
  }
}

module.exports = {
  scheduleWeeklyDigest,
  getWeeklyDigestRandomDelayMs,
  WEEKLY_DIGEST_MAX_RANDOM_DELAY_MS,
};
