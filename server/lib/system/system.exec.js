const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Execute a command in a container image.
 * @param {string} containerId - Container id.
 * @param {object} options - Command to execute.
 * @returns {Promise<object>} The state of the command.
 * @example
 * const state = await exec(containerId, options);
 */
async function exec(containerId, options) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const container = await this.dockerode.getContainer(containerId);
  const executable = await container.exec(options);
  return new Promise((resolve, reject) => {
    executable.start((err, stream) => {
      if (err) {
        reject(err);
      } else {
        stream.on('end', () => {
          resolve(true);
        });
        this.dockerode.modem.demuxStream(stream, process.stdout, process.stderr);
      }
    });
  });
}

module.exports = {
  exec,
};
