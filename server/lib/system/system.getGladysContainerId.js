const fs = require('fs');
const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

const CIDFILE_FILE_PATH_IN_CONTAINER = '/var/lib/gladysassistant/containerId';

/**
 * @description Returns the containerId defined on cidfile.
 * @returns {Promise} Resolve with container id or undefined.
 * @example
 * const containerId = await getContainerIdFromCidFile();
 */
async function getContainerIdFromCidFile() {
  try {
    // We try if the cidfile exist in the container
    await fs.promises.access(CIDFILE_FILE_PATH_IN_CONTAINER, fs.constants.F_OK);
    // if yes, we read it
    const containerId = await fs.promises.readFile(CIDFILE_FILE_PATH_IN_CONTAINER, 'utf-8');
    // we return the containerId trimed, just in case
    return containerId.trim();
  } catch (e) {
    // container id not found return undefined
    return undefined;
  }
}

/**
 * @description Returns the containerId found on /proc/self/cgroup.
 * @returns {Promise} Resolve with container id or undefined.
 * @example
 * const containerId = await getContainerIdFromCgroup();
 */
async function getContainerIdFromCgroup() {
  const cgroupFile = '/proc/self/cgroup';
  try {
    // We try if the cgroup file exist in the container
    await fs.promises.access(cgroupFile, fs.constants.F_OK);
    // if yes, we read it
    const cgroup = await fs.promises.readFile(cgroupFile, 'utf-8');
    // String looks like this in cgroup v2 (Debian 11)
    // 0::/system.slice/docker-2bb2c94b0c395fc8fdff9fa4ce364a3be0dd05792145ffc93ce8d665d06521f1.scope
    // Or this in cgroup v1 (Debian 10)
    // 12:cpuset:/docker/357e73ad015211a5acd76a8973b9287d4de75922e9802d94ba46b756f2bb5350
    let firstPart;
    let containerId;
    // If we are on cgroup v1 (debian 10)
    if (cgroup.indexOf('/docker/') !== -1) {
      const allLines = cgroup.split('\n');
      const lineWithDocker = allLines.find((line) => line.indexOf('/docker/') !== -1);
      [, containerId] = lineWithDocker.split('/docker/');
    } else if (cgroup.indexOf('docker-') !== -1) {
      // if we are on cgroupv2 (debian 11)
      const allLines = cgroup.split('\n');
      const lineWithDocker = allLines.find((line) => line.indexOf('docker-') !== -1);
      [, firstPart] = lineWithDocker.split('docker-');
      // then, we remove .scope
      [containerId] = firstPart.split('.scope');
    }
    return containerId;
  } catch (e) {
    // container id not found return undefined
    return undefined;
  }
}

/**
 * @description Returns the containerId found on /proc/self/mountinfo.
 * @returns {Promise} Resolve with container id or undefined.
 * @example
 * const containerId = await getContainerIdFromMountInfo();
 */
async function getContainerIdFromMountInfo() {
  const mountInfoFile = '/proc/self/mountinfo';
  try {
    // We try if the mountinfo file exist in the container
    await fs.promises.access(mountInfoFile, fs.constants.F_OK);
    // container id not found return undefined
    const mountinfo = await fs.promises.readFile(mountInfoFile, 'utf-8');
    let containerId;
    if (mountinfo.indexOf('/docker/containers/') !== -1) {
      const allLines = mountinfo.split('\n');
      const lineWithDocker = allLines.find((line) => line.indexOf('/docker/containers/') !== -1);
      [, containerId] = /\/docker\/containers\/(\w+)/gm.exec(lineWithDocker);
    }
    return containerId;
  } catch (e) {
    // container id not found return undefined
    return undefined;
  }
}

/**
 * @description Return the containerId from the cidfile, only when it still
 * names a running container. The cidfile lives in the data volume, so it
 * outlives the container that wrote it: installs that once used
 * `docker run --cidfile` keep the file forever, and it goes stale as soon as
 * the container is recreated without the flag — possibly still naming a
 * previous Gladys container the Docker daemon has not removed yet. A stale id
 * silently breaks every feature that inspects the Gladys container (upgrade,
 * host reboot/shutdown...).
 * @returns {Promise} Resolve with container id or undefined.
 * @example
 * const containerId = await getValidatedContainerIdFromCidFile.call(system);
 */
async function getValidatedContainerIdFromCidFile() {
  const containerId = await getContainerIdFromCidFile();
  if (containerId === undefined) {
    return undefined;
  }
  try {
    const { State } = await this.dockerode.getContainer(containerId).inspect();
    // A stopped container cannot be us, we are running: the cidfile is stale.
    if (State && State.Running === true) {
      return containerId;
    }
    logger.warn(`System: the cidfile names a container that is not running, ignoring it`);
  } catch (e) {
    logger.warn(`System: the cidfile names a container unknown to Docker, ignoring it (${e.message})`);
  }
  return undefined;
}

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

  // The kernel-provided sources describe the container Gladys is actually
  // running in right now, so they are authoritative and tried first.
  let containerId = await getContainerIdFromCgroup();

  if (containerId === undefined) {
    // Not found in cgroup try on mountinfo
    containerId = await getContainerIdFromMountInfo();
  }

  if (containerId === undefined) {
    // Last resort: the cidfile, which can be stale (see above) — a running
    // container it names may still be a previous Gladys, but nothing better
    // is available at this point.
    containerId = await getValidatedContainerIdFromCidFile.call(this);
  }

  if (containerId === undefined) {
    throw new PlatformNotCompatible('DOCKER_CONTAINER_ID_NOT_AVAILABLE');
  }

  // we return the containerId trimed, just in case
  return containerId.trim();
}

module.exports = {
  getGladysContainerId,
};
