const Gladys = require('./lib');
const server = require('./api/');

if (process.env.NODE_ENV === 'development') {
  require('dotenv').config(); // eslint-disable-line
}

const SERVER_PORT = parseInt(process.env.SERVER_PORT, 10) || 1443;
const SERVE_FRONT = process.env.NODE_ENV === 'production' ? true : process.env.SERVE_FRONT === 'true';

const logger = require('./utils/logger');

process.on('unhandledRejection', (error, promise) => {
  logger.error('unhandledRejection catched:', promise);
  logger.error(error);
});

process.on('uncaughtException', (error, promise) => {
  logger.error('uncaughtException catched:', promise);
  logger.error(error);
});

(async () => {
  // create Gladys object
  const gladys = Gladys({
    jwtSecret: process.env.JWT_SECRET,
  });

  // start Gladys
  await gladys.start();

  // start server
  server.start(gladys, SERVER_PORT, {
    serveFront: SERVE_FRONT,
  });
})();
