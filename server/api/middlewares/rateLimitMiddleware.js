const rateLimit = require('express-rate-limit');

// @ts-ignore
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 20, // limit each IP to 20 requests per windowMs
});

module.exports = limiter;
