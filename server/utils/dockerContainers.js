const { generate } = require('./password');
const logger = require('./logger');

const MAX_NAME_ATTEMPTS = 5;

/**
 * @description Return the Docker containers whose name matches EXACTLY the given name.
 * Docker name filters match by substring ('gladys-node-red' would also match a user
 * container named 'gladys-node-red-old'), so the results are post-filtered on the exact
 * dockerode name format ('/<name>') to avoid ever targeting the wrong container.
 * @param {object} system - Gladys system manager (this.gladys.system).
 * @param {string} name - Exact container name to look up.
 * @returns {Promise<Array>} Resolve with the containers matching exactly the name.
 * @example
 * const [container] = await getContainersByExactName(gladys.system, 'gladys-node-red');
 */
async function getContainersByExactName(system, name) {
  const containers = await system.getContainers({
    all: true,
    filters: { name: [name] },
  });
  return containers.filter((container) => container.name === `/${name}`);
}

/**
 * @description Resolve a container name the service can safely own. An existing container
 * keeping the default name is adopted only when its image proves it is ours (the image
 * marker matches): a user container that happens to use the same name is never adopted,
 * as the update flow would otherwise remove it. On a real collision (same name, foreign
 * image) a random suffix is appended until a free name is found.
 * @param {object} system - Gladys system manager (this.gladys.system).
 * @param {string} baseName - Preferred (default) container name.
 * @param {string} imageMarker - Substring identifying our own image.
 * @param {string} logPrefix - Prefix used for log messages (e.g. 'Zigbee2mqtt').
 * @returns {Promise<string>} Resolve with a free (or adopted) container name.
 * @example
 * const name = await resolveContainerName(gladys.system, 'gladys-node-red', 'nodered/node-red', 'Node-RED');
 */
async function resolveContainerName(system, baseName, imageMarker, logPrefix) {
  const existing = await getContainersByExactName(system, baseName);
  if (existing.length === 0 || (existing[0].image || '').includes(imageMarker)) {
    return baseName;
  }
  logger.info(
    `${logPrefix}: container name "${baseName}" is already used by a foreign container, allocating an alternative name`,
  );
  // eslint-disable-next-line no-plusplus
  for (let attempt = 0; attempt < MAX_NAME_ATTEMPTS; attempt++) {
    const candidate = `${baseName}-${generate(7, { number: true, lowercase: true })}`;
    // eslint-disable-next-line no-await-in-loop
    const candidateContainers = await getContainersByExactName(system, candidate);
    if (candidateContainers.length === 0) {
      return candidate;
    }
  }
  throw new Error(`${logPrefix}: unable to find a free container name from "${baseName}"`);
}

module.exports = {
  getContainersByExactName,
  resolveContainerName,
};
