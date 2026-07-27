const Promise = require('bluebird');
const get = require('get-value');

const logger = require('../../utils/logger');
const { SUB_CONTAINER_PORTS_VARIABLE } = require('./constants');

/**
 * @description Build the state of every declared sub-container: Docker
 * status, desired state, start date, assigned host ports and, per requested
 * hardware class, the granted/available flags — this is how the integration
 * knows what to put in its own config (e.g. `edgetpu` vs `cpu` detector for
 * Frigate). Also feeds the supervision block of the frontend.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise<Array>} Resolve with the list of sub-container states.
 * @example
 * const containers = await gladys.externalIntegration.getSubContainersState(service);
 */
async function getSubContainersState(service) {
  const entries = this.getManifestContainers(service);
  if (entries.length === 0) {
    return [];
  }
  const desired = await this.getDesiredContainers(service);
  const rawAssignments = await this.variable.getValue(SUB_CONTAINER_PORTS_VARIABLE, service.id);
  let assignments = {};
  if (rawAssignments) {
    try {
      assignments = JSON.parse(rawAssignments);
    } catch (e) {
      logger.debug(`Invalid port assignments of integration ${service.selector}`, e);
    }
  }
  let detectedClasses = [];
  try {
    detectedClasses = await this.system.detectHardwareClasses();
  } catch (e) {
    logger.debug('Unable to detect hardware classes', e);
  }
  const grantedClasses = Array.isArray(service.granted_devices) ? service.granted_devices : [];
  return Promise.map(entries, async (entry) => {
    let status = 'stopped';
    let startedAt = null;
    if (this.available) {
      const container = await this.findSubContainer(service, entry.name);
      if (container) {
        try {
          const containerInspect = await this.system.inspectContainer(container.id);
          if (get(containerInspect, 'State.Running') === true) {
            status = 'running';
            startedAt = get(containerInspect, 'State.StartedAt') || null;
          }
        } catch (e) {
          logger.debug(`Unable to inspect sub-container ${entry.name} of integration ${service.selector}`, e);
        }
      }
    }
    const ports = (entry.ports || []).map((port) => {
      const protocol = port.protocol || 'tcp';
      const assignedPort = assignments[`${entry.name}/${port.container_port}/${protocol}`];
      return {
        container_port: port.container_port,
        protocol,
        host_port: assignedPort === undefined ? null : assignedPort,
        label: port.label,
      };
    });
    const devices = (entry.devices || []).map((hardwareClass) => {
      const detected = detectedClasses.find((detectedClass) => detectedClass.class === hardwareClass);
      return {
        class: hardwareClass,
        granted: grantedClasses.includes(hardwareClass),
        available: Boolean(detected && detected.detected),
      };
    });
    return {
      name: entry.name,
      status,
      desired: desired[entry.name],
      started_at: startedAt,
      ports,
      devices,
    };
  });
}

module.exports = {
  getSubContainersState,
};
