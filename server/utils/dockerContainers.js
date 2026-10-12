const { ConflictError } = require('./coreErrors');

// Docker label set on every container created by a core service (see the
// `Labels` field of the container descriptors in `services/*/docker/`). A
// service only stops, removes or reconfigures a container that carries its
// own value of this label: the name alone is not a proof of ownership, a
// user container can carry it too.
const GLADYS_SERVICE_LABEL = 'io.gladysassistant.service';

/**
 * @description Strip the tag and the digest of an image reference.
 * @param {string} image - Image reference (`registry/repo:tag@sha256:...`).
 * @returns {string} The repository part of the reference.
 * @example
 * getImageRepository('koenkk/zigbee2mqtt:2.14.2'); // 'koenkk/zigbee2mqtt'
 */
function getImageRepository(image = '') {
  const [withoutDigest] = image.split('@');
  const lastSlash = withoutDigest.lastIndexOf('/');
  const lastColon = withoutDigest.lastIndexOf(':');
  // A colon after the last slash separates the tag; before it, it is a registry port
  return lastColon > lastSlash ? withoutDigest.slice(0, lastColon) : withoutDigest;
}

/**
 * @description Find the container carrying exactly this name. The Docker `name`
 * filter matches substrings (`gladys-node-red` also matches `gladys-node-red-old`),
 * so the result is post-filtered on the exact name.
 * @param {object} system - Gladys system module.
 * @param {string} name - Container name, without the leading slash.
 * @returns {Promise<object|null>} Resolve with the container summary, or null.
 * @example
 * const container = await findContainerByName(gladys.system, 'gladys-node-red');
 */
async function findContainerByName(system, name) {
  const containers = await system.getContainers({ all: true, filters: { name: [name] } });
  return containers.find((container) => container.name === `/${name}` || container.name === name) || null;
}

/**
 * @description Check that a container was created by the service owning this
 * descriptor. A container carrying the Gladys service label is ours only if
 * the label names this service. A container without the label was created
 * before the label existed: it is ours if it was created from the image of
 * the descriptor (read with inspect, as the listing shows an image id once the
 * tag has been re-pulled). A user container created from the same public
 * image under our exact name is indistinguishable in that legacy case; it is
 * labeled as ours at its next recreation.
 * @param {object} system - Gladys system module.
 * @param {object} container - Container summary, as returned by `system.getContainers`.
 * @param {object} descriptor - Container descriptor of the service (`services/*\/docker/*.json`).
 * @returns {Promise<boolean>} Resolve with true if the container is ours.
 * @example
 * const ours = await isManagedByGladys(gladys.system, container, descriptor);
 */
async function isManagedByGladys(system, container, descriptor) {
  const service = descriptor.Labels[GLADYS_SERVICE_LABEL];
  const labels = container.labels || {};
  if (Object.prototype.hasOwnProperty.call(labels, GLADYS_SERVICE_LABEL)) {
    return labels[GLADYS_SERVICE_LABEL] === service;
  }
  const { Config } = await system.inspectContainer(container.id);
  const expected = getImageRepository(descriptor.Image);
  const actual = getImageRepository(Config.Image);
  return actual === expected || actual.endsWith(`/${expected}`);
}

/**
 * @description Find the container of a service by the exact name of its
 * descriptor, and make sure it is ours before handing it over.
 * @param {object} system - Gladys system module.
 * @param {object} descriptor - Container descriptor of the service (`services/*\/docker/*.json`).
 * @returns {Promise<object|null>} Resolve with the container summary, or null when it does not exist.
 * @throws {ConflictError} When the name is taken by a container that is not ours.
 * @example
 * const container = await findManagedContainer(gladys.system, containerDescriptor);
 */
async function findManagedContainer(system, descriptor) {
  const container = await findContainerByName(system, descriptor.name);
  if (container && !(await isManagedByGladys(system, container, descriptor))) {
    throw new ConflictError(
      `Container "${descriptor.name}" already exists but was not created by Gladys (image "${container.image}"): rename or remove it`,
    );
  }
  return container;
}

module.exports = {
  GLADYS_SERVICE_LABEL,
  getImageRepository,
  findContainerByName,
  isManagedByGladys,
  findManagedContainer,
};
