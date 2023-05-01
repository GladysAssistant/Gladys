if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config(); // eslint-disable-line
}
const { readdirSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');
const logger = require('../utils/logger');

const SERVICE_PATH = join(__dirname, '../services');

readdirSync(SERVICE_PATH, { withFileTypes: true }).forEach((data) => {
  if (data.isDirectory()) {
    const directory = join(SERVICE_PATH, data.name);
    logger.info(`Installing dependencies in folder ${directory}`);
    try {
      execSync(`cd ${directory} && npm install --unsafe-perm`, {
        maxBuffer: 10 * 1000 * 1024, // 10Mb of logs allowed for module with big npm install
      });
    } catch (e) {
      logger.warn(e);

      const silentFail = process.env.INSTALL_SERVICES_SILENT_FAIL === 'true';
      if (!silentFail) {
        throw e;
      }
    }
  }
});
