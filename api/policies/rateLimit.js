var RateLimit = require('express-rate-limit');

var limiter = new RateLimit({
    windowMs: 30*60*1000, // 30 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    delayMs: 0 // disable delaying - full speed until the max limit is reached
});

module.exports = limiter;