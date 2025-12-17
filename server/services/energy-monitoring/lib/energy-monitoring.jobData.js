const logger = require('../../../utils/logger');

const asArrayOfStrings = (value) =>
  Array.isArray(value) ? value.filter((v) => typeof v === 'string' && v.length > 0) : [];

const resolveFeature = (stateManager, selector) => {
  const bySelector = stateManager.get('deviceFeature', selector);
  const byExternalId = stateManager.get('deviceFeatureByExternalId', selector);
  return bySelector || byExternalId || null;
};

const buildJobData = function buildJobData(selectors, label) {
  const scopedSelectors = asArrayOfStrings(selectors);
  if (scopedSelectors.length === 0) {
    return { scope: 'all' };
  }

  const devicesMap = new Map();

  scopedSelectors.forEach((selector) => {
    const feature = resolveFeature(this.gladys.stateManager, selector);
    const deviceName = feature && feature.device_id
      ? (this.gladys.stateManager.get('deviceById', feature.device_id) || {}).name || feature.device_id
      : 'Unknown device';
    const featureName = (feature && feature.name) || selector;
    const deviceKey = deviceName;
    if (!devicesMap.has(deviceKey)) {
      devicesMap.set(deviceKey, { device: deviceName, features: [] });
    }
    devicesMap.get(deviceKey).features.push(featureName);
  });

  const devices = Array.from(devicesMap.values()).map((d) => ({
    device: d.device,
    features: d.features.sort((a, b) => a.localeCompare(b)),
  }));

  const data = { scope: 'selection', devices };
  if (label) {
    data.kind = label;
  }
  return data;
};

const buildJobDataForConsumption = async function buildJobDataForConsumption(featureSelectors = []) {
  try {
    return buildJobData.call(this, featureSelectors, 'consumption');
  } catch (e) {
    logger.warn('energy-monitoring: failed to build job data for consumption', e);
    return {};
  }
};

const buildJobDataForCost = async function buildJobDataForCost(featureSelectors = []) {
  try {
    return buildJobData.call(this, featureSelectors, 'cost');
  } catch (e) {
    logger.warn('energy-monitoring: failed to build job data for cost', e);
    return {};
  }
};

module.exports = {
  buildJobDataForConsumption,
  buildJobDataForCost,
};
