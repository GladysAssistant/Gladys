const rateLimit = require('express-rate-limit');

// @ts-ignore
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 requests
});

module.exports = limiter;
