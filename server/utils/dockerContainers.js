const logger = require('./logger');
const { ConflictError } = require('./coreErrors');
const { parseImageReference } = require('../lib/system/system.getGladysImage');

// Docker label set on every container created by a core service (see the
// `Labels` field of the container descriptors in `services/*/docker/`). A
// service only stops, removes or reconfigures a container that carries its
// own value of this label: the name alone is not a proof of ownership, a
// user container can carry it too.
const GLADYS_SERVICE_LABEL = 'io.gladysassistant.service';

// Prefixes a runtime may add to a short image reference without changing the
// image it designates (`eclipse-mosquitto` is `docker.io/library/eclipse-mosquitto`).
const DOCKER_HUB_PREFIX_REGEX = /^(index\.)?docker\.io\//;
const DOCKER_HUB_LIBRARY_PREFIX_REGEX = /^library\//;

/**
 * @description Repository of an image reference, without its tag and digest,
 * and without the implicit Docker Hub prefixes some runtimes make explicit.
 * @param {string} image - Image reference (`registry/repo:tag@sha256:...`).
 * @returns {string|null} The normalized repository, or null for an image id or an empty reference.
 * @example
 * getImageRepository('docker.io/library/eclipse-mosquitto:2.0.15'); // 'eclipse-mosquitto'
 */
function getImageRepository(image) {
  if (!image) {
    return null;
  }
  const { repository } = parseImageReference(image);
  if (!repository) {
    return null;
  }
  return repository.replace(DOCKER_HUB_PREFIX_REGEX, '').replace(DOCKER_HUB_LIBRARY_PREFIX_REGEX, '');
}

/**
 * @description Tell whether a container carries the Gladys service label, whatever its value.
 * @param {object} container - Container summary, as returned by `system.getContainers`.
 * @returns {boolean} True when the container was created by a Gladys service.
 * @example
 * if (!hasServiceLabel(container)) { ... }
 */
function hasServiceLabel(container) {
  return Object.prototype.hasOwnProperty.call(container.labels || {}, GLADYS_SERVICE_LABEL);
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
 * @description Decide whether a container was created by the service owning
 * this descriptor. A container carrying the Gladys service label is ours only
 * if the label names this service. A container without the label was created
 * before the label existed: it is ours if it was created from the image
 * repository of the descriptor (read with inspect, as the listing shows an
 * image id once the tag has been re-pulled). Gladys always creates from the
 * bare reference of the descriptor, so apart from the implicit Docker Hub
 * prefixes a registry or namespace prefix is a container we did not create.
 * A user container created from the same public image under our exact name
 * is indistinguishable in that legacy case; it is labeled as ours at its next
 * recreation.
 * @param {object} system - Gladys system module.
 * @param {object} container - Container summary, as returned by `system.getContainers`.
 * @param {object} descriptor - Container descriptor of the service (`services/*\/docker/*.json`).
 * @returns {Promise<object>} Resolve with `managed` and the `image` the container was created from.
 * @example
 * const { managed, image } = await getOwnership(gladys.system, container, descriptor);
 */
async function getOwnership(system, container, descriptor) {
  const service = (descriptor.Labels || {})[GLADYS_SERVICE_LABEL];
  if (hasServiceLabel(container)) {
    return { managed: container.labels[GLADYS_SERVICE_LABEL] === service, image: container.image };
  }
  const { Config } = await system.inspectContainer(container.id);
  const image = Config.Image || container.image;
  const repository = getImageRepository(Config.Image);
  return { managed: repository !== null && repository === getImageRepository(descriptor.Image), image };
}

/**
 * @description Check that a container was created by the service owning this
 * descriptor (see `getOwnership`).
 * @param {object} system - Gladys system module.
 * @param {object} container - Container summary, as returned by `system.getContainers`.
 * @param {object} descriptor - Container descriptor of the service (`services/*\/docker/*.json`).
 * @returns {Promise<boolean>} Resolve with true if the container is ours.
 * @example
 * const ours = await isManagedByGladys(gladys.system, container, descriptor);
 */
async function isManagedByGladys(system, container, descriptor) {
  const { managed } = await getOwnership(system, container, descriptor);
  return managed;
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
  if (!container) {
    return null;
  }
  const { managed, image } = await getOwnership(system, container, descriptor);
  if (!managed) {
    throw new ConflictError(
      `Container "${descriptor.name}" already exists but was not created by Gladys (image "${image}"): rename or remove it`,
    );
  }
  return container;
}

/**
 * @description Non-throwing variant of `findManagedContainer`, for the paths
 * that must go on when the name is taken (disconnect, status): a container
 * that is not ours is reported as absent, with a warning.
 * @param {object} system - Gladys system module.
 * @param {object} descriptor - Container descriptor of the service (`services/*\/docker/*.json`).
 * @returns {Promise<object|null>} Resolve with our container, or null when it does not exist or is not ours.
 * @example
 * const container = await findOwnContainer(gladys.system, containerDescriptor);
 */
async function findOwnContainer(system, descriptor) {
  const container = await findContainerByName(system, descriptor.name);
  if (!container) {
    return null;
  }
  const { managed, image } = await getOwnership(system, container, descriptor);
  if (!managed) {
    logger.warn(`Container "${descriptor.name}" was not created by Gladys (image "${image}"), leaving it untouched`);
    return null;
  }
  return container;
}

module.exports = {
  GLADYS_SERVICE_LABEL,
  getImageRepository,
  hasServiceLabel,
  findContainerByName,
  isManagedByGladys,
  findManagedContainer,
  findOwnContainer,
};
