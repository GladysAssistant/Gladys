const Promise = require('bluebird');
const logger = require('../../../utils/logger');
const { DEVICE_PARAMS } = require('./constants');

const EXTERNAL_ID_PREFIX = 'zigbee2mqtt:';

const getIeeeAddressParam = (device) => {
  return (device.params || []).find((param) => param.name === DEVICE_PARAMS.IEEE_ADDRESS);
};

/**
 * @description Drop a RAM cache entry keyed by an external_id we no longer use, unless another
 * entity took it over in the meantime. On a name swap the new owner is written to the cache
 * before the previous owner cleans up, so a blind delete would evict the fresh entry and leave
 * the device unreachable for incoming MQTT states.
 * @param {object} gladys - Gladys instance.
 * @param {string} entity - Cache to clean ("deviceByExternalId" or "deviceFeatureByExternalId").
 * @param {string} externalId - The external_id that is no longer used.
 * @param {string} ownerId - Id of the device (or feature) that used to own this external_id.
 * @example
 * deleteOwnedCacheEntry(gladys, 'deviceByExternalId', 'zigbee2mqtt:old-name', device.id);
 */
function deleteOwnedCacheEntry(gladys, entity, externalId, ownerId) {
  const cachedEntity = gladys.stateManager.get(entity, externalId);
  if (cachedEntity && cachedEntity.id !== ownerId) {
    return;
  }
  gladys.stateManager.deleteState(entity, externalId);
}

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
  const staleFeatures = (gladysDevice.features || []).filter(
    (feature, index) => feature.external_id !== renamedFeatures[index].external_id,
  );
  const writtenExternalIds = {
    device: `${EXTERNAL_ID_PREFIX}${newName}`,
    features: renamedFeatures.map((feature) => ({ id: feature.id, external_id: feature.external_id })),
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
  // but the entries keyed by the old name are still there: drop the ones we still own.
  deleteOwnedCacheEntry(gladys, 'deviceByExternalId', oldExternalId, gladysDevice.id);
  staleFeatures.forEach((feature) => {
    deleteOwnedCacheEntry(gladys, 'deviceFeatureByExternalId', feature.external_id, feature.id);
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

  // A rename can only be applied if its destination external_id is free, or is freed by
  // another rename that is itself applicable. Dropping one rename can therefore block the
  // rename that was waiting on it (A -> B -> C where C is held by a device we don't rename),
  // so the set is filtered again until it stops shrinking.
  let applicableRenames = renames;
  let previousCount = -1;
  while (applicableRenames.length !== previousCount) {
    previousCount = applicableRenames.length;
    const freedExternalIds = new Set(applicableRenames.map((rename) => rename.gladysDevice.external_id));
    applicableRenames = applicableRenames.filter((rename) => {
      const destinationExternalId = `${EXTERNAL_ID_PREFIX}${rename.newName}`;
      const occupant = gladysDeviceByExternalId.get(destinationExternalId);
      if (occupant && occupant.id !== rename.gladysDevice.id && !freedExternalIds.has(occupant.external_id)) {
        logger.warn(
          `Zigbee2mqtt: cannot rename "${rename.gladysDevice.external_id}" to "${destinationExternalId}":` +
            ` another Gladys device ("${occupant.name}") still uses this external_id and is not being renamed.` +
            ` If it is a duplicate left by a previous rename, delete it to restore the link.`,
        );
        return false;
      }
      return true;
    });
  }

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
        deleteOwnedCacheEntry(gladys, 'deviceByExternalId', rename.staged.device, gladysDevice.id);
        rename.staged.features.forEach((feature) => {
          deleteOwnedCacheEntry(gladys, 'deviceFeatureByExternalId', feature.external_id, feature.id);
        });
      }
    } catch (e) {
      logger.warn(`Zigbee2mqtt: unable to sync device "${rename.gladysDevice.external_id}" after rename: ${e}`);
    }
  });
}

/**
 * @description Reconcile Gladys devices with one Zigbee2mqtt inventory: backfill the IEEE
 * address where it is missing, then plan and apply the renames it implies.
 * @param {object} manager - Zigbee2mqtt manager.
 * @param {Array} z2mDevices - Devices published by Zigbee2mqtt on the bridge/devices topic.
 * @returns {Promise} Resolve when devices are synchronized.
 * @example
 * reconcileDevices(zigbee2mqttManager, devices);
 */
async function reconcileDevices(manager, z2mDevices) {
  const self = manager;
  try {
    const z2mDeviceByIeeeAddress = new Map();
    const z2mDeviceByName = new Map();
    z2mDevices
      .filter((z2mDevice) => z2mDevice.type !== 'Coordinator' && z2mDevice.ieee_address)
      .forEach((z2mDevice) => {
        z2mDeviceByIeeeAddress.set(z2mDevice.ieee_address, z2mDevice);
        z2mDeviceByName.set(z2mDevice.friendly_name, z2mDevice);
      });

    const gladysDevices = await self.gladys.device.get({ service: 'zigbee2mqtt' });

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
            await self.gladys.device.setParam(gladysDevice, DEVICE_PARAMS.IEEE_ADDRESS, sameNameZ2mDevice.ieee_address);
            // setParam only writes in DB: patch the RAM copy so the discover page
            // doesn't flag the device as needing an update.
            const ramDevice = self.gladys.stateManager.get('deviceByExternalId', gladysDevice.external_id);
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
      await applyRenames(self.gladys, renames, gladysDevices);
    }
  } catch (e) {
    logger.warn(`Zigbee2mqtt: unable to sync renamed devices: ${e}`);
  }
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
  // MQTT messages are handled without being awaited, so two "bridge/devices" messages can
  // overlap: running both would plan the same renames from the same DB snapshot and fight
  // over the same rows. The newer inventory is not dropped though, it supersedes any other
  // pending one and is reconciled as soon as the running pass is done — waiting for the next
  // message would leave the rename unapplied until Zigbee2mqtt publishes again.
  if (this.syncRenamedDevicesRunning) {
    this.pendingSyncRenamedDevices = z2mDevices;
    logger.debug('Zigbee2mqtt: rename synchronization already running, queuing this inventory');
    return;
  }

  this.syncRenamedDevicesRunning = true;
  try {
    let devicesToSync = z2mDevices;
    while (devicesToSync) {
      // eslint-disable-next-line no-await-in-loop
      await reconcileDevices(this, devicesToSync);
      devicesToSync = this.pendingSyncRenamedDevices;
      this.pendingSyncRenamedDevices = null;
    }
  } finally {
    this.syncRenamedDevicesRunning = false;
  }
}

module.exports = {
  syncRenamedDevices,
};
