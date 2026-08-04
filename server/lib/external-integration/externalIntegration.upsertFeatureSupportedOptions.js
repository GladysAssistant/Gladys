const Promise = require('bluebird');

const logger = require('../../utils/logger');

const optionListsAreEqual = (existingOptions, publishedOptions) => {
  if (existingOptions.length !== publishedOptions.length) {
    return false;
  }
  return existingOptions.every((existing, index) => {
    const published = publishedOptions[index];
    return (
      existing.value === published.value &&
      existing.label === published.label &&
      existing.sort_order === published.sort_order
    );
  });
};

/**
 * @description Silently upsert the supported_options of the features of an
 * already-created device when the integration re-publishes it (same
 * external_id). Like the params (see upsertDeviceParams), the option lists
 * are technical data OWNED by the integration — typically camera presets
 * read from the device (spec camera-ptz-control.md, A.3) — so they are
 * synced without any user gesture. Only features whose publication carries
 * a supported_options array are touched, and no device-updated echo is sent
 * back to the integration (this is its own publication — it would loop).
 * @param {object} createdDevice - The in-memory device (stateManager).
 * @param {Array} publishedFeatures - The features published in the discovery
 * (with supported_options already normalized by setDiscoveredDevices).
 * @returns {Promise} Resolve when the options are up to date.
 * @example
 * await gladys.externalIntegration.upsertFeatureSupportedOptions(device, features);
 */
async function upsertFeatureSupportedOptions(createdDevice, publishedFeatures) {
  const existingFeatures = createdDevice.features || [];
  await Promise.each(publishedFeatures, async (publishedFeature) => {
    if (!Array.isArray(publishedFeature.supported_options)) {
      return;
    }
    const existingFeature = existingFeatures.find((feature) => feature.external_id === publishedFeature.external_id);
    if (!existingFeature) {
      return;
    }
    const existingOptions = existingFeature.supported_options || [];
    if (optionListsAreEqual(existingOptions, publishedFeature.supported_options)) {
      return;
    }
    logger.debug(
      `External integration: syncing ${publishedFeature.supported_options.length} supported options of feature ${existingFeature.selector}`,
    );
    const savedOptions = await this.device.syncFeatureSupportedOptions(
      existingFeature.id,
      publishedFeature.supported_options,
    );
    // the in-memory device is the same object across every stateManager
    // key: patching it here updates them all
    existingFeature.supported_options = savedOptions;
  });
}

module.exports = {
  upsertFeatureSupportedOptions,
};
