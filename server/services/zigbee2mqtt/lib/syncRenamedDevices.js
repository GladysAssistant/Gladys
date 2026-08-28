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
 * @returns {Promise} Resolve when the device is updated.
 * @example
 * applyRename(gladys, device, 'old-name', 'new-name');
 */
async function applyRename(gladys, gladysDevice, currentName, newName) {
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

  const device = {
    ...gladysDevice,
    // Only follow the rename on the Gladys name if the user didn't customize it
    name: gladysDevice.name === currentName ? newName : gladysDevice.name,
    external_id: `${EXTERNAL_ID_PREFIX}${newName}`,
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
        await applyRename(this.gladys, gladysDevice, currentName, renamedZ2mDevice.friendly_name);
      } catch (e) {
        logger.warn(`Zigbee2mqtt: unable to sync device "${gladysDevice.external_id}" after rename: ${e}`);
      }
    });
  } catch (e) {
    logger.warn(`Zigbee2mqtt: unable to sync renamed devices: ${e}`);
  }
}

module.exports = {
  syncRenamedDevices,
};
