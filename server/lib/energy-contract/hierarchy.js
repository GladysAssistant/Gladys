const { Op } = require('sequelize');
const db = require('../../models');
const logger = require('../../utils/logger');
const { BadParameters, NotFoundError } = require('../../utils/coreErrors');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  ENERGY_CONTRACT_DIRECTIONS,
  EVENTS,
} = require('../../utils/constants');
const {
  isEnergyIndexFeature,
  isEnergyCostFeature,
  isEnergySourceFeature,
  getAttachmentFeatures,
  getMeterRootFeature,
  findCycle,
  findLinkToCut,
} = require('../../utils/energyHierarchy');
const { isElectricMeter } = require('../../utils/enforceEnergyHierarchy');
const { localToUtcMs } = require('./tariff.time');
const {
  CONSUMPTION_COST_TYPES,
  DERIVED_CONSUMPTION_SUFFIX,
  DERIVED_COST_SUFFIX,
} = require('../../services/energy-monitoring/utils/addEnergyFeatures');

// the categories the integrations and the former "My devices" page ever linked
const ENERGY_CATEGORIES = [
  DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  DEVICE_FEATURE_CATEGORIES.SWITCH,
  DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
];
// the consumption type a cost type is derived from (the inverse of the derivation's own map)
const CONSUMPTION_TYPE_OF_COST = Object.fromEntries(
  Object.entries(CONSUMPTION_COST_TYPES).map(([consumptionType, costType]) => [costType, consumptionType]),
);

/**
 * @description The feature the devices of a meter are attached to (docs/specs/energy-hierarchy.md,
 * section B): the first index among the attachment features of the meter device, else its first
 * consumption; never a feature derived from another one.
 * @param {string} meterDeviceId - The meter device id.
 * @returns {string|null} The feature id, or null when the device is unknown or has none.
 * @example
 * energyContract.getMeterRootFeatureId('a8b3c7d5-…');
 */
function getMeterRootFeatureId(meterDeviceId) {
  const meter = this.stateManager.get('deviceById', meterDeviceId);
  if (!meter) {
    return null;
  }
  const rootFeature = getMeterRootFeature(meter);
  return rootFeature ? rootFeature.id : null;
}

/**
 * @description Make the meter of a consumption contract a root: its attachment features lose
 * their parent on another device (section C.2), so its own contract prices it.
 * @param {object} contract - The contract (`direction`, `electric_meter_device_id`).
 * @returns {Promise<void>} Resolves when done.
 * @example
 * await energyContract.detachElectricMeter(contract);
 */
async function detachElectricMeter(contract) {
  if (contract.direction !== ENERGY_CONTRACT_DIRECTIONS.CONSUMPTION) {
    return;
  }
  const meter = this.stateManager.get('deviceById', contract.electric_meter_device_id);
  if (!meter) {
    return;
  }
  const attached = getAttachmentFeatures(meter).filter((feature) => feature.energy_parent_id);
  // eslint-disable-next-line no-restricted-syntax
  for (const feature of attached) {
    logger.info(`Energy hierarchy: electric meter feature "${feature.selector}" is now a root`);
    // eslint-disable-next-line no-await-in-loop
    await this.device.updateFeature(feature.selector, { energy_parent_id: null });
  }
}

/**
 * @description The devices hanging under a device (a plug attached to a sub-meter): the ones whose
 * attachment features reach a feature of this device when walking up their parents.
 * @param {object} stateManager - The state manager.
 * @param {object} device - The device.
 * @returns {Array<string>} Their ids.
 * @example
 * getDescendantDeviceIds(stateManager, subMeter);
 */
function getDescendantDeviceIds(stateManager, device) {
  const ownIds = new Set(device.features.map((feature) => feature.id));
  const reachesDevice = (feature) => {
    const visited = new Set();
    let parentId = feature.energy_parent_id;
    while (parentId && !visited.has(parentId)) {
      if (ownIds.has(parentId)) {
        return true;
      }
      visited.add(parentId);
      const parent = stateManager.get('deviceFeatureById', parentId);
      parentId = parent ? parent.energy_parent_id : null;
    }
    return false;
  };
  return stateManager
    .getAllKeys('deviceById')
    .filter((deviceId) => deviceId !== device.id)
    .filter((deviceId) => getAttachmentFeatures(stateManager.get('deviceById', deviceId)).some(reachesDevice));
}

/**
 * @description Attach a device to an electric meter (section D.1): every attachment feature of
 * the device gets the root feature of the meter as parent, and the costs of the device, and of
 * the devices hanging under it (a sub-meter moved with its plugs), are recomputed from the
 * earliest start of the meter's contracts.
 * @param {string} deviceSelector - The device selector.
 * @param {string} meterDeviceId - The electric meter device id.
 * @returns {Promise<object>} The updated device.
 * @example
 * await energyContract.setDeviceElectricMeter('washing-machine-plug', 'a8b3c7d5-…');
 */
async function setDeviceElectricMeter(deviceSelector, meterDeviceId) {
  const device = this.stateManager.get('device', deviceSelector);
  if (!device) {
    throw new NotFoundError('DEVICE_NOT_FOUND');
  }
  const meter = typeof meterDeviceId === 'string' ? this.stateManager.get('deviceById', meterDeviceId) : null;
  if (!meter) {
    throw new NotFoundError('ELECTRIC_METER_DEVICE_NOT_FOUND');
  }
  if (meter.id === device.id) {
    throw new BadParameters('ELECTRIC_METER_IS_THE_DEVICE');
  }
  const contracts = await db.EnergyContract.findAll({
    where: { electric_meter_device_id: meter.id, direction: ENERGY_CONTRACT_DIRECTIONS.CONSUMPTION },
    attributes: ['valid_from', 'timezone'],
  });
  if (contracts.length === 0) {
    throw new BadParameters('ELECTRIC_METER_HAS_NO_CONTRACT');
  }
  if (await isElectricMeter(device.id)) {
    throw new BadParameters('DEVICE_IS_AN_ELECTRIC_METER');
  }
  const rootFeature = getMeterRootFeature(meter);
  if (!rootFeature) {
    throw new BadParameters('ELECTRIC_METER_HAS_NO_ENERGY_FEATURE');
  }
  const attachments = getAttachmentFeatures(device);
  if (attachments.length === 0) {
    throw new BadParameters('DEVICE_HAS_NO_ENERGY_FEATURE');
  }
  const toAttach = attachments.filter((feature) => feature.energy_parent_id !== rootFeature.id);
  // eslint-disable-next-line no-restricted-syntax
  for (const feature of toAttach) {
    // eslint-disable-next-line no-await-in-loop
    await this.device.updateFeature(feature.selector, { energy_parent_id: rootFeature.id });
  }
  if (toAttach.length > 0) {
    const from = new Date(Math.min(...contracts.map((c) => localToUtcMs(c.valid_from, c.timezone))));
    logger.info(`Energy hierarchy: device ${device.selector} attached to meter ${meter.selector}`);
    this.event.emit(EVENTS.ENERGY_CONTRACT.RECALCULATE, {
      from,
      electric_meter_device_ids: [meter.id],
      // the root meter of the devices hanging under this one changed too
      device_ids: [device.id, ...getDescendantDeviceIds(this.stateManager, device)],
    });
  }
  return this.stateManager.get('deviceById', device.id);
}

/**
 * @description The consumption a parentless derived feature belongs to, on its own device
 * (section C.3, step 3): the index of `<index>_consumption`, the consumption of `<x>_cost`
 * (`<x>_consumption`, else `<x>`), failing that the only consumption of the same duration.
 * @param {object} feature - A parentless feature.
 * @param {Array} deviceFeatures - The features of its device.
 * @returns {object|null} The parent to restore, if any.
 * @example
 * findLostDerivedParent(costFeature, deviceFeatures);
 */
function findLostDerivedParent(feature, deviceFeatures) {
  const externalId = feature.external_id;
  if (
    feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
    feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION &&
    externalId.endsWith(DERIVED_CONSUMPTION_SUFFIX)
  ) {
    const indexExternalId = externalId.slice(0, -DERIVED_CONSUMPTION_SUFFIX.length);
    return deviceFeatures.find((f) => isEnergyIndexFeature(f) && f.external_id === indexExternalId) || null;
  }
  if (!isEnergyCostFeature(feature)) {
    return null;
  }
  const consumptionType = CONSUMPTION_TYPE_OF_COST[feature.type];
  const consumptions = deviceFeatures.filter(
    (f) => f.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR && f.type === consumptionType,
  );
  if (externalId.endsWith(DERIVED_COST_SUFFIX)) {
    const base = externalId.slice(0, -DERIVED_COST_SUFFIX.length);
    const byName =
      consumptions.find((f) => f.external_id === `${base}${DERIVED_CONSUMPTION_SUFFIX}`) ||
      consumptions.find((f) => f.external_id === base);
    if (byName) {
      return byName;
    }
  }
  return consumptions.length === 1 ? consumptions[0] : null;
}

/**
 * @description Repair the energy hierarchy at start-up (docs/specs/energy-hierarchy.md, section
 * C.3), idempotently: cut the cycles, make the electric meters roots, restore the derived links
 * the former "Fix" button removed. Nothing is written on a sound hierarchy.
 * @returns {Promise<number>} The number of features repaired.
 * @example
 * await energyContract.repairHierarchy();
 */
async function repairHierarchy() {
  const rows = await db.DeviceFeature.findAll({
    where: { [Op.or]: [{ energy_parent_id: { [Op.ne]: null } }, { category: ENERGY_CATEGORIES }] },
    attributes: ['id', 'device_id', 'category', 'type', 'external_id', 'selector', 'energy_parent_id'],
  });
  const features = rows.map((row) => row.get({ plain: true }));
  const byId = new Map(features.map((feature) => [feature.id, feature]));
  const getFeature = async (id) => byId.get(id) || null;
  const changes = new Map();
  const setParent = (feature, parentId, reason) => {
    logger.warn(`Energy hierarchy repaired: feature "${feature.selector}" ${reason}`);
    feature.energy_parent_id = parentId;
    changes.set(feature.id, feature);
  };

  const featuresByDevice = new Map();
  features.forEach((feature) => {
    if (!featuresByDevice.has(feature.device_id)) {
      featuresByDevice.set(feature.device_id, []);
    }
    featuresByDevice.get(feature.device_id).push(feature);
  });

  // 1. an electric meter is a root (first: in a cycle across a meter and a plug of equal ranks,
  // the meter's link is the one to cut, the plug stays attached)
  const contracts = await db.EnergyContract.findAll({
    where: { direction: ENERGY_CONTRACT_DIRECTIONS.CONSUMPTION },
    attributes: ['electric_meter_device_id'],
  });
  const meterIds = new Set(contracts.map((contract) => contract.electric_meter_device_id));
  features
    .filter((feature) => meterIds.has(feature.device_id) && isEnergySourceFeature(feature) && feature.energy_parent_id)
    .filter((feature) => {
      const parent = byId.get(feature.energy_parent_id);
      return !parent || parent.device_id !== feature.device_id;
    })
    .forEach((feature) => setParent(feature, null, 'detached (an electric meter is a root)'));
  // a meter whose energy features all hang off one another on the device (left by the former
  // free editor) has nothing to attach the devices to: its best index becomes its root
  meterIds.forEach((meterId) => {
    const meterFeatures = featuresByDevice.get(meterId) || [];
    if (getAttachmentFeatures({ features: meterFeatures }).length === 0) {
      const sources = meterFeatures.filter(isEnergySourceFeature);
      const best = getMeterRootFeature({ features: sources.map((f) => ({ ...f, energy_parent_id: null })) });
      if (best !== null) {
        setParent(byId.get(best.id), null, 'detached (an electric meter needs a root)');
      }
    }
  });

  // 2. no cycle
  // eslint-disable-next-line no-restricted-syntax
  for (const feature of features) {
    // eslint-disable-next-line no-await-in-loop
    const cycle = await findCycle(feature, getFeature);
    if (cycle !== null) {
      setParent(findLinkToCut(cycle), null, 'detached (circular energy hierarchy)');
    }
  }

  // 3. the derived links lost to the former "Fix" button
  // eslint-disable-next-line no-restricted-syntax
  for (const feature of features.filter((f) => !f.energy_parent_id)) {
    const parent = findLostDerivedParent(feature, featuresByDevice.get(feature.device_id));
    if (parent !== null) {
      feature.energy_parent_id = parent.id;
      // eslint-disable-next-line no-await-in-loop
      if ((await findCycle(feature, getFeature)) === null) {
        setParent(feature, parent.id, `linked back to "${parent.selector}"`);
      } else {
        feature.energy_parent_id = null;
      }
    }
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const feature of changes.values()) {
    // eslint-disable-next-line no-await-in-loop
    await db.DeviceFeature.update({ energy_parent_id: feature.energy_parent_id }, { where: { id: feature.id } });
    // a feature is one object in RAM, whatever the store it is read from (device.add)
    const featureInRam = this.stateManager.get('deviceFeatureById', feature.id);
    if (featureInRam) {
      featureInRam.energy_parent_id = feature.energy_parent_id;
    }
  }
  return changes.size;
}

/**
 * @description The electric meter whose contract applies to a device (docs/specs/energy-hierarchy.md,
 * section B): the root reached by walking up the parents of its first attachment feature that
 * resolves (the device itself when it is a root, a meter or an unattached device). A device with no
 * energy source feature at all (a home battery publishing only power and battery indexes) can never
 * be attached to a meter: it is on the main meter, the one new energy devices are attached to.
 * @param {object} device - The device, with its features.
 * @returns {Promise<string|null>} The meter device id, or null when the hierarchy does not resolve
 * (a broken parent, a cycle) or the device has no attachment feature and no main meter exists.
 * @example
 * await energyContract.getDeviceElectricMeterId(battery);
 */
async function getDeviceElectricMeterId(device) {
  const attachments = getAttachmentFeatures(device);
  if (attachments.length === 0) {
    const mainContract = await db.EnergyContract.findOne({
      where: { direction: ENERGY_CONTRACT_DIRECTIONS.CONSUMPTION },
      order: [['created_at', 'DESC']],
      attributes: ['electric_meter_device_id'],
    });
    return mainContract === null ? null : mainContract.electric_meter_device_id;
  }
  const root = attachments
    .map((feature) => this.device.energySensorManager.getRootElectricMeterDevice(feature))
    .find((feature) => feature !== null);
  return root === undefined ? null : root.device_id;
}

module.exports = {
  getDescendantDeviceIds,
  getMeterRootFeatureId,
  getDeviceElectricMeterId,
  detachElectricMeter,
  setDeviceElectricMeter,
  repairHierarchy,
  findLostDerivedParent,
};
