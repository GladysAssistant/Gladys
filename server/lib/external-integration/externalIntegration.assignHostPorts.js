const Promise = require('bluebird');

const db = require('../../models');
const logger = require('../../utils/logger');
const { getFreePort } = require('../../utils/getFreePort');
const { SUB_CONTAINER_PORTS_VARIABLE } = require('./constants');

/**
 * @description Assign a host port to every published port declared by the
 * sub-containers of an integration. The host port is chosen by Gladys (a
 * free port, never declared by the manifest: no possible collision between
 * integrations or with a host service), allocated once then persisted in a
 * variable scoped to the integration — stable across container recreations.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise<object>} Resolve with { "<name>/<port>/<protocol>": hostPort }.
 * @example
 * const assignments = await gladys.externalIntegration.assignHostPorts(service);
 */
async function assignHostPorts(service) {
  const declaredKeys = [];
  this.getManifestContainers(service).forEach((entry) => {
    (entry.ports || []).forEach((port) => {
      declaredKeys.push(`${entry.name}/${port.container_port}/${port.protocol || 'tcp'}`);
    });
  });
  const rawAssignments = await this.variable.getValue(SUB_CONTAINER_PORTS_VARIABLE, service.id);
  let assignments = {};
  if (rawAssignments) {
    try {
      assignments = JSON.parse(rawAssignments);
    } catch (e) {
      logger.warn(`Invalid port assignments of integration ${service.selector}, reallocating`, e);
      assignments = {};
    }
  }
  const missingKeys = declaredKeys.filter((key) => assignments[key] === undefined);
  if (missingKeys.length === 0) {
    return assignments;
  }
  // ports already assigned to any integration (even stopped) must not be reused
  const allPortVariables = await db.Variable.findAll({ where: { name: SUB_CONTAINER_PORTS_VARIABLE } });
  const usedPorts = new Set();
  allPortVariables.forEach((variable) => {
    try {
      Object.values(JSON.parse(variable.value)).forEach((port) => usedPorts.add(port));
    } catch (e) {
      logger.debug('Ignoring invalid port assignments variable', e);
    }
  });
  await Promise.each(missingKeys, async (key) => {
    const port = await getFreePort(usedPorts);
    usedPorts.add(port);
    assignments[key] = port;
  });
  await this.variable.setValue(SUB_CONTAINER_PORTS_VARIABLE, JSON.stringify(assignments), service.id);
  return assignments;
}

module.exports = {
  assignHostPorts,
};
