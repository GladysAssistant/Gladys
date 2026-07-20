if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config(); // eslint-disable-line
}
const Promise = require('bluebird');
const { readdirSync } = require('fs');
const { join } = require('path');
const { exec } = require('../utils/childProcess');
const logger = require('../utils/logger');

const SERVICE_PATH = join(__dirname, '../services');
const INSTALL_CONCURRENCY = 4;

/**
 * @description Install npm dependencies for all Gladys services.
 * @returns {Promise<void>} Resolve when all installs are finished.
 * @example
 * installServiceDependencies();
 */
async function installServiceDependencies() {
  const directories = readdirSync(SERVICE_PATH, { withFileTypes: true })
    .filter((data) => data.isDirectory())
    .map((data) => join(SERVICE_PATH, data.name));

  await Promise.map(
    directories,
    async (directory) => {
      logger.info(`Installing dependencies in folder ${directory}`);
      try {
        await exec(`cd ${directory} && npm install --unsafe-perm`);
      } catch (e) {
        logger.warn(e);

        const silentFail = process.env.INSTALL_SERVICES_SILENT_FAIL === 'true';
        if (!silentFail) {
          throw e;
        }
      }
    },
    { concurrency: INSTALL_CONCURRENCY },
  );
}

/* istanbul ignore next */
if (require.main === module) {
  installServiceDependencies().catch(() => {
    process.exit(1);
  });
}

module.exports = {
  INSTALL_CONCURRENCY,
  installServiceDependencies,
};
