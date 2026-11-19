const { findOwnContainer } = require('../../../utils/dockerContainers');
const { PlatformNotCompatible } = require('../../../utils/coreErrors');

/**
 * @description One of our containers, as findOwnContainer finds it, or null when there is none: also when Gladys does
 * not run in Docker (Zigbee2mqtt on an external broker), where there is none to look for. A stop, a restart or a reset
 * of the integration then goes on without containers instead of failing.
 * @param {object} system - Gladys system module.
 * @param {object} descriptor - Container descriptor.
 * @returns {Promise<object|null>} The container, or null.
 * @example
 * const container = await findOwnZ2mContainer(this.gladys.system, zigbee2mqttContainerDescriptor);
 */
async function findOwnZ2mContainer(system, descriptor) {
  try {
    return await findOwnContainer(system, descriptor);
  } catch (e) {
    if (e instanceof PlatformNotCompatible) {
      return null;
    }
    throw e;
  }
}

module.exports = {
  findOwnZ2mContainer,
};
