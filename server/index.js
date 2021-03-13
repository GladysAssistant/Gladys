const Gladys = require('./lib');
const db = require('./models');
const { start } = require('./api/');

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

let server;

const shutdown = async (signal) => {
  logger.info(`${signal} received.`);
  logger.info('Closing database connection.');
  await db.sequelize.close();
  if (server) {
    logger.info('Closing server connections.');
    server.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

(async () => {
  // create Gladys object
  const gladys = Gladys({
    jwtSecret: process.env.JWT_SECRET,
  });

  // start Gladys
  await gladys.start();

  // start server
  ({ server } = start(gladys, SERVER_PORT, {
    serveFront: SERVE_FRONT,
  }));
})();
