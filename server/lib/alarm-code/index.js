const { RateLimiterMemory } = require('rate-limiter-flexible');

const { consumeWriteRateLimit } = require('./alarmCode.consumeWriteRateLimit');
const { createGuest } = require('./alarmCode.createGuest');
const { destroy } = require('./alarmCode.destroy');
const { destroyForUser } = require('./alarmCode.destroyForUser');
const { existsActive } = require('./alarmCode.existsActive');
const { existsForUser } = require('./alarmCode.existsForUser');
const { get } = require('./alarmCode.get');
const { setForUser } = require('./alarmCode.setForUser');
const { validate } = require('./alarmCode.validate');

const AlarmCode = function AlarmCode() {
  this.writeRateLimit = new RateLimiterMemory({
    points: 10, // 10 writes
    duration: 60 * 60, // Per hour
  });
};

AlarmCode.prototype.consumeWriteRateLimit = consumeWriteRateLimit;
AlarmCode.prototype.createGuest = createGuest;
AlarmCode.prototype.destroy = destroy;
AlarmCode.prototype.destroyForUser = destroyForUser;
AlarmCode.prototype.existsActive = existsActive;
AlarmCode.prototype.existsForUser = existsForUser;
AlarmCode.prototype.get = get;
AlarmCode.prototype.setForUser = setForUser;
AlarmCode.prototype.validate = validate;

module.exports = AlarmCode;
