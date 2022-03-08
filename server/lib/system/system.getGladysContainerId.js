const fs = require('fs');
const { exec } = require('../../utils/childProcess');
const { PlatformNotCompatible } = require('../../utils/coreErrors');

const CIDFILE_FILE_PATH_IN_CONTAINER = '/var/lib/gladysassistant/containerId';

/**
 * @description Return the containerId of the currently running container.
 * @returns {Promise} Resolve with list of mounts.
 * @example
 * const containerId = await getGladysContainerId();
 */
async function getGladysContainerId() {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  try {
    // We try if the cidfile exist in the container
    await fs.promises.access(CIDFILE_FILE_PATH_IN_CONTAINER, fs.constants.F_OK);
    // if yes, we read it
    return fs.promises.readFile(CIDFILE_FILE_PATH_IN_CONTAINER, 'utf8');
  } catch (e) {
    // if not, we get the containerId from the cgroup
    return exec(
      'cat /proc/self/cgroup | grep -o -e "docker.*" | head -n 1 | sed -e "s/.scope//g;s/docker-//g;s!docker/!!g"',
    );
  }
}

module.exports = {
  getGladysContainerId,
};
