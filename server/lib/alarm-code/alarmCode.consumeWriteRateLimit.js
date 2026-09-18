const { TooManyRequests } = require('../../utils/coreErrors');

/**
 * @description Spend one write credit, or refuse. Refusing a code because somebody else already
 * uses it tells the caller that this exact code exists, and on 10 000 four-digit combinations such
 * an answer is an enumeration tool — so writing a code is rate limited, the way typing one is.
 * @param {string} userId - Id of the user writing a code.
 * @returns {Promise} Resolve when the write is allowed.
 * @example
 * await this.consumeWriteRateLimit(userId);
 */
async function consumeWriteRateLimit(userId) {
  const rateLimitRes = await this.writeRateLimit.get(userId);

  if (rateLimitRes && rateLimitRes.remainingPoints === 0) {
    throw new TooManyRequests('TOO_MANY_ALARM_CODE_WRITES', rateLimitRes.msBeforeNext);
  }

  await this.writeRateLimit.consume(userId, 1);
}

module.exports = {
  consumeWriteRateLimit,
};
