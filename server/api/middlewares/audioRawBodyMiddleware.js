const express = require('express');

const audioRawBodyMiddleware = express.raw({
  type: ['audio/*', 'application/octet-stream'],
  limit: '5mb',
});

module.exports = audioRawBodyMiddleware;
