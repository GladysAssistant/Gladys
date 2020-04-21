const Bottleneck = require('bottleneck/es5');

// we rate-limit the number of request per seconds to poll lights
const pollLimiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 100, // 100 ms
});

// we rate-limit the number of request per seconds to control lights
const setValueLimiter = new Bottleneck({
    minTime: 100, // 100 ms
});