const dayjs = require('dayjs');

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

const DEFAULT_DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED = 48;
const TOP_CONSUMERS_COUNT = 3;
const MAX_OTHER_ENERGY_CANDIDATES = 15;

const CONSUMPTION_FEATURE_TYPES = [
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
];

/**
 * @description Check if a device feature reports energy consumption history.
 * @param {object} feature - Device feature.
 * @returns {boolean} True when feature is a consumption sensor.
 * @example
 * isConsumptionFeature({ category: 'energy-sensor', type: 'daily-consumption' });
 */
function isConsumptionFeature(feature) {
  return (
    feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR && CONSUMPTION_FEATURE_TYPES.includes(feature.type)
  );
}

/**
 * @description Pick the best consumption feature on a device.
 * @param {Array<object>} features - Device features.
 * @returns {object|null} Selected consumption feature.
 * @example
 * pickConsumptionFeatureOnDevice([{ type: 'thirty-minutes-consumption' }]);
 */
function pickConsumptionFeatureOnDevice(features) {
  const consumptionFeatures = features.filter(isConsumptionFeature);
  const thirtyMinutesFeature = consumptionFeatures.find(
    (feature) => feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
  );
  if (thirtyMinutesFeature) {
    return thirtyMinutesFeature;
  }

  return consumptionFeatures.find((feature) => feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION);
}

/**
 * @description Get leaf consumption features, excluding empty intermediate parents.
 * @param {Array<object>} devices - Devices with features.
 * @param {string|null} [mainMeterDeviceId] - Main electric meter device id.
 * @returns {Array<object>} Leaf consumption candidates.
 * @example
 * getLeafConsumptionCandidates([{ id: 'd1', name: 'Plug', features: [] }]);
 */
function getLeafConsumptionCandidates(devices, mainMeterDeviceId = null) {
  const consumptionFeatures = devices.flatMap((device) =>
    device.features.filter(isConsumptionFeature).map((feature) => ({ device, feature })),
  );

  const intermediateParentIds = new Set(
    consumptionFeatures
      .filter(({ feature }) => consumptionFeatures.some((other) => other.feature.energy_parent_id === feature.id))
      .filter(({ device }) => device.id !== mainMeterDeviceId)
      .map(({ feature }) => feature.id),
  );

  return consumptionFeatures.filter(({ feature }) => !intermediateParentIds.has(feature.id));
}

/**
 * @description Keep one consumption feature per device.
 * @param {Array<object>} candidates - Leaf consumption candidates.
 * @returns {Array<object>} Deduplicated candidates.
 * @example
 * dedupeConsumptionCandidatesByDevice([{ device: { id: 'd1' }, feature: {} }]);
 */
function dedupeConsumptionCandidatesByDevice(candidates) {
  const byDeviceId = new Map();

  candidates.forEach((candidate) => {
    const selectedFeature = pickConsumptionFeatureOnDevice(
      candidates.filter((other) => other.device.id === candidate.device.id).map((other) => other.feature),
    );

    if (!selectedFeature) {
      return;
    }

    byDeviceId.set(candidate.device.id, {
      device: candidate.device,
      feature: selectedFeature,
    });
  });

  return Array.from(byDeviceId.values());
}

/**
 * @description Split main meter and other consumption candidates.
 * @param {Array<object>} candidates - Consumption candidates.
 * @param {string|null} mainMeterDeviceId - Main electric meter device id.
 * @returns {{ mainMeterCandidates: Array<object>, otherCandidates: Array<object> }} Split candidates.
 * @example
 * splitMainMeterAndOtherCandidates([], null);
 */
function splitMainMeterAndOtherCandidates(candidates, mainMeterDeviceId) {
  if (!mainMeterDeviceId) {
    return {
      mainMeterCandidates: [],
      otherCandidates: candidates,
    };
  }

  return {
    mainMeterCandidates: candidates.filter((candidate) => candidate.device.id === mainMeterDeviceId),
    otherCandidates: candidates.filter((candidate) => candidate.device.id !== mainMeterDeviceId),
  };
}

/**
 * @description Select consumption features to query for the weekly digest.
 * @param {Array<object>} devices - Devices with features.
 * @param {string|null} mainMeterDeviceId - Main electric meter device id.
 * @returns {Array<object>} Selected candidates with role metadata.
 * @example
 * selectEnergyFeaturesForDigest([], null);
 */
function selectEnergyFeaturesForDigest(devices, mainMeterDeviceId) {
  const leafCandidates = dedupeConsumptionCandidatesByDevice(getLeafConsumptionCandidates(devices, mainMeterDeviceId));
  const { mainMeterCandidates, otherCandidates } = splitMainMeterAndOtherCandidates(leafCandidates, mainMeterDeviceId);

  const selected = [];

  if (mainMeterCandidates.length > 0) {
    selected.push({
      ...mainMeterCandidates[0],
      role: 'main_meter',
    });
  }

  otherCandidates.slice(0, MAX_OTHER_ENERGY_CANDIDATES).forEach((candidate) => {
    selected.push({
      ...candidate,
      role: 'top_consumer_candidate',
    });
  });

  return selected;
}

/**
 * @description Sum consumption values from getConsumptionByDates result.
 * @param {Array} consumptionResults - Consumption query results.
 * @returns {number|null} Total consumption or null.
 * @example
 * sumConsumptionValues([{ deviceFeature: { name: 'Consumption' }, values: [{ sum_value: 12.5 }] }]);
 */
function sumConsumptionValues(consumptionResults) {
  if (!consumptionResults?.length) {
    return null;
  }

  const consumptionEntry = consumptionResults.find((entry) => !entry.deviceFeature?.is_subscription);
  if (!consumptionEntry?.values?.length) {
    return null;
  }

  return consumptionEntry.values.reduce((total, entry) => {
    const value = Number(entry.sum_value ?? entry.value ?? 0);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}

/**
 * @description Fetch weekly consumption totals for one feature.
 * @param {object} context - Gateway context with device manager.
 * @param {object} candidate - Consumption candidate.
 * @param {Date} periodStart - Current period start.
 * @param {Date} periodEnd - Current period end.
 * @param {Date} previousPeriodStart - Previous period start.
 * @returns {Promise<object|null>} Consumption entry or null.
 * @example
 * fetchEnergyConsumptionForCandidate(context, candidate, new Date(), new Date(), new Date());
 */
async function fetchEnergyConsumptionForCandidate(context, candidate, periodStart, periodEnd, previousPeriodStart) {
  try {
    const [currentWeekResults, previousWeekResults] = await Promise.all([
      context.device.energySensorManager.getConsumptionByDates([candidate.feature.selector], {
        from: periodStart,
        to: periodEnd,
        group_by: 'day',
        display_mode: 'kwh',
      }),
      context.device.energySensorManager.getConsumptionByDates([candidate.feature.selector], {
        from: previousPeriodStart,
        to: periodStart,
        group_by: 'day',
        display_mode: 'kwh',
      }),
    ]);

    const currentWeekTotal = sumConsumptionValues(currentWeekResults);
    const previousWeekTotal = sumConsumptionValues(previousWeekResults);

    if (currentWeekTotal === null && previousWeekTotal === null) {
      return null;
    }

    return {
      device: candidate.device.name,
      feature: candidate.feature.name,
      role: candidate.role,
      unit: 'kWh',
      current_week_total: currentWeekTotal,
      previous_week_total: previousWeekTotal,
    };
  } catch (e) {
    return null;
  }
}

/**
 * @description Resolve main electric meter device id from configured energy prices.
 * @param {object} context - Gateway context.
 * @param {Array<object>} devices - Devices with features.
 * @returns {Promise<string|null>} Main meter device id.
 * @example
 * getMainMeterDeviceId({ energyPrice: { getDefaultElectricMeterFeatureId: async () => 'feature-id' } }, []);
 */
async function getMainMeterDeviceId(context, devices) {
  if (!context.energyPrice?.getDefaultElectricMeterFeatureId) {
    return null;
  }

  const defaultMeterFeatureId = await context.energyPrice.getDefaultElectricMeterFeatureId();
  if (!defaultMeterFeatureId) {
    return null;
  }

  const meterDevice = devices.find((device) => device.features.some((feature) => feature.id === defaultMeterFeatureId));

  return meterDevice?.id ?? null;
}

/**
 * @description Build structured home data for the weekly digest.
 * @returns {Promise<object>} Aggregated digest payload.
 * @example
 * buildWeeklyDigestData();
 */
async function buildWeeklyDigestData() {
  const now = new Date();
  const periodEnd = now;
  const periodStart = dayjs(now)
    .subtract(7, 'day')
    .toDate();
  const previousPeriodStart = dayjs(now)
    .subtract(14, 'day')
    .toDate();

  const [devices, scenes, batteryThresholdRaw, outdatedHoursRaw] = await Promise.all([
    this.device.get(),
    this.scene.get(),
    this.variable.getValue(SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_THRESHOLD),
    this.variable.getValue(SYSTEM_VARIABLE_NAMES.DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED),
  ]);

  const mainMeterDeviceId = await getMainMeterDeviceId(this, devices);

  const batteryThreshold = Number(batteryThresholdRaw ?? 10);
  const outdatedHours = Number(outdatedHoursRaw ?? DEFAULT_DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED);

  const temperatures = [];
  const humidities = [];
  const lowBatteries = [];
  const staleSensors = [];

  devices.forEach((device) => {
    const roomName = device.room?.name ?? 'Unknown room';

    device.features.forEach((feature) => {
      if (feature.category === DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR && feature.last_value !== null) {
        temperatures.push({
          room: roomName,
          device: device.name,
          value: feature.last_value,
          unit: feature.unit,
        });
      }

      if (feature.category === DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR && feature.last_value !== null) {
        humidities.push({
          room: roomName,
          device: device.name,
          value: feature.last_value,
          unit: feature.unit,
        });
      }

      if (
        feature.category === DEVICE_FEATURE_CATEGORIES.BATTERY &&
        feature.last_value !== null &&
        feature.last_value < batteryThreshold
      ) {
        lowBatteries.push({
          device: device.name,
          level: feature.last_value,
          unit: feature.unit,
        });
      }

      if (feature.last_value_changed) {
        const hoursSinceUpdate = (now.getTime() - new Date(feature.last_value_changed).getTime()) / (1000 * 60 * 60);
        if (hoursSinceUpdate > outdatedHours) {
          staleSensors.push({
            device: device.name,
            feature: feature.name,
            room: roomName,
            hours_since_update: Math.round(hoursSinceUpdate),
          });
        }
      }
    });
  });

  const energyCandidates = selectEnergyFeaturesForDigest(devices, mainMeterDeviceId);
  const mainMeterCandidate = energyCandidates.find((candidate) => candidate.role === 'main_meter');
  const otherCandidates = energyCandidates.filter((candidate) => candidate.role === 'top_consumer_candidate');

  const [mainMeterEnergy, ...topConsumerEnergies] = await Promise.all([
    mainMeterCandidate
      ? fetchEnergyConsumptionForCandidate(this, mainMeterCandidate, periodStart, periodEnd, previousPeriodStart)
      : Promise.resolve(null),
    ...otherCandidates.map((candidate) =>
      fetchEnergyConsumptionForCandidate(this, candidate, periodStart, periodEnd, previousPeriodStart),
    ),
  ]);

  const energy = [];
  if (mainMeterEnergy) {
    energy.push(mainMeterEnergy);
  }

  topConsumerEnergies
    .filter((entry) => entry !== null)
    .sort((a, b) => (b.current_week_total ?? 0) - (a.current_week_total ?? 0))
    .slice(0, TOP_CONSUMERS_COUNT)
    .forEach((entry) => {
      energy.push({
        ...entry,
        role: 'top_consumer',
      });
    });

  const recentlyExecutedScenes = scenes
    .filter((scene) => scene.last_executed)
    .sort((a, b) => new Date(b.last_executed).getTime() - new Date(a.last_executed).getTime())
    .slice(0, 5)
    .map((scene) => ({
      name: scene.name,
      last_executed: scene.last_executed,
      active: scene.active,
    }));

  return {
    period: {
      from: periodStart.toISOString(),
      to: periodEnd.toISOString(),
    },
    summary: {
      device_count: devices.length,
      scene_count: scenes.length,
      active_scene_count: scenes.filter((scene) => scene.active).length,
    },
    temperatures,
    humidities,
    low_batteries: lowBatteries,
    stale_sensors: staleSensors.slice(0, 10),
    energy,
    recent_scenes: recentlyExecutedScenes,
  };
}

module.exports = {
  buildWeeklyDigestData,
  sumConsumptionValues,
  isConsumptionFeature,
  pickConsumptionFeatureOnDevice,
  getLeafConsumptionCandidates,
  dedupeConsumptionCandidatesByDevice,
  splitMainMeterAndOtherCandidates,
  selectEnergyFeaturesForDigest,
  getMainMeterDeviceId,
  fetchEnergyConsumptionForCandidate,
  TOP_CONSUMERS_COUNT,
};
