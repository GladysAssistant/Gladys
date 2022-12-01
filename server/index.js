if (process.env.NODE_ENV === 'development') {
  require('dotenv').config(); // eslint-disable-line
}

const Gladys = require('./lib');
const db = require('./models');
const { start } = require('./api');

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

const shutdown = async (signal) => {
  logger.info(`${signal} received.`);
  // We give Gladys 10 seconds to properly shutdown, otherwise we do it
  setTimeout(() => {
    logger.info('Timeout to shutdown expired, forcing shut down.');
    process.exit();
  }, 10 * 1000);
  logger.info('Closing database connection.');
  try {
    await db.sequelize.close();
  } catch (e) {
    logger.info('Database is probably already closed');
    logger.warn(e);
  }
  process.exit();
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
  start(gladys, SERVER_PORT, {
    serveFront: SERVE_FRONT,
  });
})();
