const Promise = require('bluebird');
const logger = require('../../../utils/logger');
const { DEVICE_PARAMS } = require('./constants');

const EXTERNAL_ID_PREFIX = 'zigbee2mqtt:';

const getIeeeAddressParam = (device) => {
  return (device.params || []).find((param) => param.name === DEVICE_PARAMS.IEEE_ADDRESS);
};

/**
 * @description Update a Gladys device (and its features) external_id to follow the new
 * Zigbee2mqtt friendly_name. Selectors are left untouched so scenes, dashboards and
 * device history keep working.
 * @param {object} gladys - Gladys instance.
 * @param {object} gladysDevice - Gladys device to rename, as returned by device.get.
 * @param {string} currentName - Zigbee2mqtt friendly_name currently stored in the external_id.
 * @param {string} newName - New Zigbee2mqtt friendly_name.
 * @param {string} newDisplayName - Name the Gladys device should have after the rename.
 * @returns {Promise<object>} Resolve with the external_ids written on the device and its features.
 * @example
 * applyRename(gladys, device, 'old-name', 'new-name', 'new-name');
 */
async function applyRename(gladys, gladysDevice, currentName, newName, newDisplayName) {
  const oldExternalId = gladysDevice.external_id;
  const oldPrefix = `${EXTERNAL_ID_PREFIX}${currentName}:`;
  const newPrefix = `${EXTERNAL_ID_PREFIX}${newName}:`;

  const renamedFeatures = (gladysDevice.features || []).map((feature) => ({
    ...feature,
    external_id: feature.external_id.startsWith(oldPrefix)
      ? `${newPrefix}${feature.external_id.substring(oldPrefix.length)}`
      : feature.external_id,
  }));
  const staleFeatureExternalIds = (gladysDevice.features || [])
    .map((feature) => feature.external_id)
    .filter((externalId, index) => externalId !== renamedFeatures[index].external_id);
  const writtenExternalIds = {
    device: `${EXTERNAL_ID_PREFIX}${newName}`,
    features: renamedFeatures.map((feature) => feature.external_id),
  };

  const device = {
    ...gladysDevice,
    name: newDisplayName,
    external_id: writtenExternalIds.device,
    features: renamedFeatures,
    params: gladysDevice.params,
  };

  logger.info(`Zigbee2mqtt: device "${currentName}" renamed to "${newName}", updating it in Gladys`);
  await gladys.device.create(device);

  // device.create registered the device under its new external_ids in the RAM cache,
  // but the entries keyed by the old name are still there: drop them.
  gladys.stateManager.deleteState('deviceByExternalId', oldExternalId);
  staleFeatureExternalIds.forEach((featureExternalId) => {
    gladys.stateManager.deleteState('deviceFeatureByExternalId', featureExternalId);
  });

  return writtenExternalIds;
}

/**
 * @description Apply the planned renames. external_id is unique in DB, so a rename whose
 * destination is still owned by another device cannot be written directly. Devices whose
 * current name is the destination of another rename (cyclic renames, e.g. an A<->B swap)
 * are staged through a temporary external_id first; a destination owned by a device that
 * is not being renamed (a stale duplicate left by the old behavior) is skipped with a log.
 * @param {object} gladys - Gladys instance.
 * @param {Array} renames - Planned renames ({ gladysDevice, currentName, newName, ieeeAddress }).
 * @param {Array} gladysDevices - All Gladys devices of the service.
 * @returns {Promise} Resolve when all renames are applied.
 * @example
 * applyRenames(gladys, renames, gladysDevices);
 */
async function applyRenames(gladys, renames, gladysDevices) {
  const gladysDeviceByExternalId = new Map(gladysDevices.map((device) => [device.external_id, device]));
  const renamedExternalIds = new Set(renames.map((rename) => rename.gladysDevice.external_id));

  const applicableRenames = renames.filter((rename) => {
    const destinationExternalId = `${EXTERNAL_ID_PREFIX}${rename.newName}`;
    const occupant = gladysDeviceByExternalId.get(destinationExternalId);
    if (occupant && occupant.id !== rename.gladysDevice.id && !renamedExternalIds.has(occupant.external_id)) {
      logger.warn(
        `Zigbee2mqtt: cannot rename "${rename.gladysDevice.external_id}" to "${destinationExternalId}":` +
          ` another Gladys device ("${occupant.name}") already uses this external_id.` +
          ` Delete the duplicated device to restore the link.`,
      );
      return false;
    }
    return true;
  });

  const destinationExternalIds = new Set(applicableRenames.map((rename) => `${EXTERNAL_ID_PREFIX}${rename.newName}`));

  // Phase 1: a device whose current external_id is wanted by another rename moves to a
  // temporary external_id (unique thanks to the IEEE address) to free its name first.
  await Promise.each(applicableRenames, async (rename) => {
    if (!destinationExternalIds.has(rename.gladysDevice.external_id)) {
      return;
    }
    try {
      const temporaryName = `__renaming__${rename.ieeeAddress}`;
      rename.staged = await applyRename(
        gladys,
        rename.gladysDevice,
        rename.currentName,
        temporaryName,
        rename.gladysDevice.name,
      );
    } catch (e) {
      logger.warn(`Zigbee2mqtt: unable to stage rename of "${rename.gladysDevice.external_id}": ${e}`);
    }
  });

  // Phase 2: apply the final names.
  await Promise.each(applicableRenames, async (rename) => {
    try {
      const { gladysDevice, currentName, newName } = rename;
      // Only follow the rename on the Gladys name if the user didn't customize it
      const newDisplayName = gladysDevice.name === currentName ? newName : gladysDevice.name;
      await applyRename(gladys, gladysDevice, currentName, newName, newDisplayName);
      if (rename.staged) {
        // The temporary external_ids of phase 1 are gone from DB: drop them from RAM too.
        gladys.stateManager.deleteState('deviceByExternalId', rename.staged.device);
        rename.staged.features.forEach((featureExternalId) => {
          gladys.stateManager.deleteState('deviceFeatureByExternalId', featureExternalId);
        });
      }
    } catch (e) {
      logger.warn(`Zigbee2mqtt: unable to sync device "${rename.gladysDevice.external_id}" after rename: ${e}`);
    }
  });
}

/**
 * @description Keep Gladys devices in sync with Zigbee2mqtt renames. The link between
 * Gladys and Zigbee2mqtt is the friendly_name (stored in external_ids), so a rename done
 * in Zigbee2mqtt used to break it. This function stores the immutable IEEE address as a
 * device param, and uses it to re-attach (and update) Gladys devices whose friendly_name
 * changed. It is called on every "bridge/devices" message, which is retained and
 * republished by Zigbee2mqtt after each rename, so renames done while Gladys was offline
 * are handled too.
 * @param {Array} z2mDevices - Devices published by Zigbee2mqtt on the bridge/devices topic.
 * @returns {Promise} Resolve when devices are synchronized.
 * @example
 * await zigbee2mqttManager.syncRenamedDevices(devices);
 */
async function syncRenamedDevices(z2mDevices) {
  try {
    const z2mDeviceByIeeeAddress = new Map();
    const z2mDeviceByName = new Map();
    z2mDevices
      .filter((z2mDevice) => z2mDevice.type !== 'Coordinator' && z2mDevice.ieee_address)
      .forEach((z2mDevice) => {
        z2mDeviceByIeeeAddress.set(z2mDevice.ieee_address, z2mDevice);
        z2mDeviceByName.set(z2mDevice.friendly_name, z2mDevice);
      });

    const gladysDevices = await this.gladys.device.get({ service: 'zigbee2mqtt' });

    const renames = [];
    await Promise.each(gladysDevices, async (gladysDevice) => {
      try {
        if (!gladysDevice.external_id || !gladysDevice.external_id.startsWith(EXTERNAL_ID_PREFIX)) {
          return;
        }
        const currentName = gladysDevice.external_id.substring(EXTERNAL_ID_PREFIX.length);
        const ieeeAddressParam = getIeeeAddressParam(gladysDevice);
        const sameNameZ2mDevice = z2mDeviceByName.get(currentName);

        const linkIntact =
          sameNameZ2mDevice && (!ieeeAddressParam || ieeeAddressParam.value === sameNameZ2mDevice.ieee_address);
        if (linkIntact) {
          if (!ieeeAddressParam) {
            // Backfill the IEEE address on devices added before this param existed,
            // so their next rename can be matched.
            await this.gladys.device.setParam(gladysDevice, DEVICE_PARAMS.IEEE_ADDRESS, sameNameZ2mDevice.ieee_address);
            // setParam only writes in DB: patch the RAM copy so the discover page
            // doesn't flag the device as needing an update.
            const ramDevice = this.gladys.stateManager.get('deviceByExternalId', gladysDevice.external_id);
            if (ramDevice && Array.isArray(ramDevice.params) && !getIeeeAddressParam(ramDevice)) {
              ramDevice.params.push({
                name: DEVICE_PARAMS.IEEE_ADDRESS,
                value: sameNameZ2mDevice.ieee_address,
                device_id: gladysDevice.id,
              });
            }
          }
          return;
        }

        if (!ieeeAddressParam) {
          // No z2m device with this name anymore, and no IEEE address stored:
          // nothing to match on (device removed, or renamed before Gladys stored it).
          return;
        }
        const renamedZ2mDevice = z2mDeviceByIeeeAddress.get(ieeeAddressParam.value);
        if (!renamedZ2mDevice || renamedZ2mDevice.friendly_name === currentName) {
          return;
        }
        renames.push({
          gladysDevice,
          currentName,
          newName: renamedZ2mDevice.friendly_name,
          ieeeAddress: ieeeAddressParam.value,
        });
      } catch (e) {
        logger.warn(`Zigbee2mqtt: unable to sync device "${gladysDevice.external_id}" after rename: ${e}`);
      }
    });

    if (renames.length > 0) {
      await applyRenames(this.gladys, renames, gladysDevices);
    }
  } catch (e) {
    logger.warn(`Zigbee2mqtt: unable to sync renamed devices: ${e}`);
  }
}

module.exports = {
  syncRenamedDevices,
};
