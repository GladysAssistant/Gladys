const logger = require('../../../utils/logger');

const asArrayOfStrings = (value) =>
  Array.isArray(value) ? value.filter((v) => typeof v === 'string' && v.length > 0) : [];

const buildPeriod = (startDate, endDate) => {
  if (!startDate && !endDate) {
    return null;
  }
  return {
    start_date: startDate || null,
    end_date: endDate || null,
  };
};

const extractSelectorsFromObject = (value = {}) =>
  asArrayOfStrings(value.featureSelectors || value.feature_selectors || []);

const normalizeJobArgs = (startAt, featureSelectors, endAt) => {
  if (Array.isArray(startAt)) {
    return { selectors: asArrayOfStrings(startAt), period: null };
  }
  if (startAt && typeof startAt === 'object' && !Array.isArray(startAt)) {
    const selectors = extractSelectorsFromObject(startAt);
    const period = buildPeriod(startAt.startDate || startAt.start_date, startAt.endDate || startAt.end_date);
    return { selectors, period };
  }
  const selectors = Array.isArray(featureSelectors) ? asArrayOfStrings(featureSelectors) : [];
  const period = buildPeriod(typeof startAt === 'string' ? startAt : null, typeof endAt === 'string' ? endAt : null);
  return { selectors, period };
};

const resolveFeature = (stateManager, selector) => {
  const bySelector = stateManager.get('deviceFeature', selector);
  const byExternalId = stateManager.get('deviceFeatureByExternalId', selector);
  return bySelector || byExternalId || null;
};

const buildJobData = function buildJobData(startAt, featureSelectors, endAt, label) {
  const { selectors: scopedSelectors, period } = normalizeJobArgs(startAt, featureSelectors, endAt);
  if (scopedSelectors.length === 0) {
    return period ? { scope: 'all', period } : { scope: 'all' };
  }

  const devicesMap = new Map();

  scopedSelectors.forEach((selector) => {
    const feature = resolveFeature(this.gladys.stateManager, selector);
    const deviceName =
      feature && feature.device_id
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
  if (period) {
    data.period = period;
  }
  if (label) {
    data.kind = label;
  }
  return data;
};

const buildJobDataForConsumption = async function buildJobDataForConsumption(startAt, featureSelectors, endAt) {
  try {
    return buildJobData.call(this, startAt, featureSelectors, endAt, 'consumption');
  } catch (e) {
    logger.warn('energy-monitoring: failed to build job data for consumption', e);
    return {};
  }
};

const buildJobDataForCost = async function buildJobDataForCost(startAt, featureSelectors, endAt) {
  try {
    return buildJobData.call(this, startAt, featureSelectors, endAt, 'cost');
  } catch (e) {
    logger.warn('energy-monitoring: failed to build job data for cost', e);
    return {};
  }
};

module.exports = {
  buildJobDataForConsumption,
  buildJobDataForCost,
};
