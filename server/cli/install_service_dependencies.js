if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config(); // eslint-disable-line
}
const { readdirSync } = require('fs');
const { join } = require('path');
const { exec } = require('../utils/childProcess');
const logger = require('../utils/logger');

const SERVICE_PATH = join(__dirname, '../services');
const DEFAULT_CONCURRENCY = 4;

/**
 * @description Get service directories that contain a package.json.
 * @param {string} servicePath - Path to the services folder.
 * @param {Function} readdirSyncFn - Function used to read the services folder.
 * @returns {Array<string>} List of service directory paths.
 * @example
 * getServiceDirectories('/services');
 */
function getServiceDirectories(servicePath, readdirSyncFn = readdirSync) {
  return readdirSyncFn(servicePath, { withFileTypes: true })
    .filter((data) => data.isDirectory())
    .map((data) => join(servicePath, data.name));
}

/**
 * @description Install npm dependencies for all Gladys services with limited parallelism.
 * @param {object} [options] - Install options.
 * @param {string} [options.servicePath] - Path to the services folder.
 * @param {number} [options.concurrency] - Maximum number of parallel npm installs.
 * @param {Function} [options.execFn] - Function used to execute npm install.
 * @param {object} [options.loggerInstance] - Logger instance.
 * @param {boolean} [options.silentFail] - Whether to ignore install errors.
 * @param {Function} [options.readdirSyncFn] - Function used to read the services folder.
 * @returns {Promise<void>} Resolve when all installs are finished.
 * @example
 * installServiceDependencies({ concurrency: 4 });
 */
async function installServiceDependencies(options = {}) {
  const {
    servicePath = SERVICE_PATH,
    concurrency = DEFAULT_CONCURRENCY,
    execFn = exec,
    loggerInstance = logger,
    silentFail = process.env.INSTALL_SERVICES_SILENT_FAIL === 'true',
    readdirSyncFn = readdirSync,
  } = options;

  const directories = getServiceDirectories(servicePath, readdirSyncFn);
  let nextDirectoryIndex = 0;
  let firstError = null;

  /**
   * @description Install npm dependencies for one service directory.
   * @param {string} directory - Path to the service directory.
   * @returns {Promise<void>} Resolve when install is finished.
   * @example
   * installDirectory('/services/mqtt');
   */
  async function installDirectory(directory) {
    loggerInstance.info(`Installing dependencies in folder ${directory}`);
    try {
      await execFn(`cd ${directory} && npm install --unsafe-perm`);
    } catch (e) {
      loggerInstance.warn(e);
      if (!silentFail) {
        firstError = firstError || e;
      }
    }
  }

  /**
   * @description Worker that installs service dependencies until all directories are processed.
   * @returns {Promise<void>} Resolve when no directory is left to install.
   * @example
   * worker();
   */
  async function worker() {
    if (nextDirectoryIndex >= directories.length || firstError) {
      return;
    }

    const directory = directories[nextDirectoryIndex];
    nextDirectoryIndex += 1;
    await installDirectory(directory);
    await worker();
  }

  const workerCount = Math.min(concurrency, directories.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  if (firstError) {
    throw firstError;
  }
}

/**
 * @description Run the CLI entrypoint.
 * @param {Function} [installFn] - Function used to install service dependencies.
 * @returns {Promise<void>} Resolve when install is finished.
 * @example
 * runCli();
 */
function runCli(installFn = installServiceDependencies) {
  return installFn().catch(() => {
    process.exit(1);
  });
}

/* istanbul ignore next */
if (require.main === module) {
  runCli();
}

module.exports = {
  DEFAULT_CONCURRENCY,
  getServiceDirectories,
  installServiceDependencies,
  runCli,
};
