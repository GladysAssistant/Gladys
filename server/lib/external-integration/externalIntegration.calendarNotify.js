const db = require('../../models');
const { TooManyRequests } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { MAX_CALENDAR_WRITES_PER_MINUTE } = require('./constants');

/**
 * @description Push the real-time calendar refresh to the frontend after a
 * write batch: to the owning user, to every connected user when at least one
 * of the touched calendars is shared.
 * @param {string} userId - Id of the user owning the calendars.
 * @param {Array} calendarSelectors - Selectors of the touched calendars.
 * @param {boolean} anyShared - Whether at least one of them is shared.
 * @example
 * this.notifyCalendarUpdated(user.id, ['personal'], false);
 */
function notifyCalendarUpdated(userId, calendarSelectors, anyShared) {
  if (calendarSelectors.length === 0) {
    return;
  }
  const message = {
    type: WEBSOCKET_MESSAGE_TYPES.CALENDAR.UPDATED,
    payload: { calendar_selectors: calendarSelectors },
  };
  if (anyShared) {
    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, message);
  } else {
    this.event.emit(EVENTS.WEBSOCKET.SEND, { ...message, userId });
  }
}

/**
 * @description Notify a calendar integration that a user enabled or disabled
 * it, changed their account values, or toggled a calendar (fire-and-forget:
 * on every (re)connection the integration re-reads its accounts anyway).
 * @param {object} service - The external integration service (plain object).
 * @param {string} userId - Id of the user whose account changed.
 * @returns {Promise} Resolve when sent (or dropped, disconnected integration).
 * @example
 * await this.notifyCalendarAccountUpdated(service, user.id);
 */
async function notifyCalendarAccountUpdated(service, userId) {
  const user = await db.User.findOne({ where: { id: userId }, attributes: ['selector'] });
  if (user === null) {
    return;
  }
  this.sendMessage(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CALENDAR_ACCOUNT_UPDATED, {
    user: user.selector,
  });
}

/**
 * @description Fixed one-minute window rate limit on the calendar write
 * endpoints (POST/DELETE), in memory per integration — the POST /state
 * mechanics (a burst straddling the window boundary can reach ~2x the
 * limit, acceptable for this anti-spam purpose).
 * @param {object} service - The external integration service (plain object).
 * @example
 * this.assertCalendarWriteAllowed(service);
 */
function assertCalendarWriteAllowed(service) {
  const now = Date.now();
  let rateLimit = this.calendarWriteRateLimits.get(service.id);
  if (!rateLimit || now >= rateLimit.resetAt) {
    rateLimit = { count: 0, resetAt: now + 60 * 1000 };
    this.calendarWriteRateLimits.set(service.id, rateLimit);
  }
  if (rateLimit.count + 1 > MAX_CALENDAR_WRITES_PER_MINUTE) {
    throw new TooManyRequests(
      `RATE_LIMIT_EXCEEDED: max ${MAX_CALENDAR_WRITES_PER_MINUTE} calendar writes per minute`,
      Math.ceil((rateLimit.resetAt - now) / 1000),
    );
  }
  rateLimit.count += 1;
}

module.exports = {
  notifyCalendarUpdated,
  notifyCalendarAccountUpdated,
  assertCalendarWriteAllowed,
};
