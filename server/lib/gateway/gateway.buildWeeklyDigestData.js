const dayjs = require('dayjs');

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { isSensorFeature } = require('../../services/mcp/lib/selectFeature');

const DEFAULT_DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED = 48;

const CONSUMPTION_FEATURE_TYPES = [
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
];

/**
 * @description Check if a feature should be monitored for stale sensor reporting.
 * @param {object} feature - Device feature.
 * @returns {boolean} True when stale checks apply.
 * @example
 * shouldCheckFeatureForStale({ category: 'co2-sensor' });
 */
function shouldCheckFeatureForStale(feature) {
  if (feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR) {
    return false;
  }

  return isSensorFeature(feature);
}

/**
 * @description Build human-friendly silent durations for stale sensors.
 * @param {number} hours - Hours since last update.
 * @returns {object} Structured silent duration.
 * @example
 * formatSilentDuration(1700);
 */
function formatSilentDuration(hours) {
  const roundedHours = Math.round(hours);

  if (roundedHours < 48) {
    return {
      silent_for_hours: roundedHours,
    };
  }

  const days = Math.round(roundedHours / 24);
  if (days < 14) {
    return {
      silent_for_days: days,
    };
  }

  const weeks = Math.round(days / 7);
  if (weeks < 8) {
    return {
      silent_for_weeks: weeks,
    };
  }

  return {
    silent_for_months: Math.round(days / 30),
  };
}

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

const COST_FEATURE_TYPES = [
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST,
  DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
];

/**
 * @description Find a device feature by id across all devices.
 * @param {Array<object>} devices - Devices with features.
 * @param {string} featureId - Feature id.
 * @returns {{ device: object, feature: object }|null} Device feature match.
 * @example
 * findDeviceFeatureById([], 'feature-id');
 */
function findDeviceFeatureById(devices, featureId) {
  const match = devices
    .map((device) => {
      const feature = device.features.find((entry) => entry.id === featureId);
      return feature ? { device, feature } : null;
    })
    .find((entry) => entry !== null);

  return match ?? null;
}

/**
 * @description Check if a feature belongs to the configured main meter energy branch.
 * @param {Array<object>} devices - Devices with features.
 * @param {object} feature - Consumption feature.
 * @param {string|null} mainMeterDeviceId - Configured main meter device id.
 * @returns {boolean} True when feature is under the main meter hierarchy.
 * @example
 * belongsToMainMeterBranch([], { energy_parent_id: 'parent-id' }, 'meter-id');
 */
function belongsToMainMeterBranch(devices, feature, mainMeterDeviceId) {
  if (!mainMeterDeviceId || !feature.energy_parent_id) {
    return false;
  }

  let parentId = feature.energy_parent_id;
  const visited = new Set();

  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = findDeviceFeatureById(devices, parentId);
    if (!parent) {
      return false;
    }

    if (parent.device.id === mainMeterDeviceId) {
      return true;
    }

    parentId = parent.feature.energy_parent_id;
  }

  return false;
}

/**
 * @description Build calendar-aligned digest periods for energy comparisons.
 * @param {Date} [now] - Reference date.
 * @returns {object} Period boundaries and metadata.
 * @example
 * buildDigestPeriods(new Date('2026-06-08T15:30:00'));
 */
function buildDigestPeriods(now = new Date()) {
  const periodStart = dayjs(now)
    .startOf('day')
    .subtract(6, 'day');
  const periodEnd = dayjs(now)
    .startOf('day')
    .add(1, 'day');
  const previousPeriodStart = periodStart.subtract(7, 'day');

  return {
    periodStart: periodStart.toDate(),
    periodEnd: periodEnd.toDate(),
    previousPeriodStart: previousPeriodStart.toDate(),
    metadata: {
      from: periodStart.toDate().toISOString(),
      to: periodEnd.toDate().toISOString(),
      from_date: periodStart.format('YYYY-MM-DD'),
      to_date: periodStart.add(6, 'day').format('YYYY-MM-DD'),
      days_count: 7,
      aggregation: 'sum_of_daily_buckets',
      comparison_window: 'previous_7_calendar_days',
      note:
        'Seven calendar days including today, using local midnight boundaries like the energy dashboard day view. This is not the same as a dashboard month view from the 1st of the month.',
    },
  };
}

/**
 * @description Find the cost feature linked to a consumption feature on the same device.
 * @param {object} device - Device with features.
 * @param {object} consumptionFeature - Consumption feature.
 * @returns {object|null} Linked cost feature.
 * @example
 * findCostFeatureForConsumption({ features: [] }, { id: 'consumption-id' });
 */
function findCostFeatureForConsumption(device, consumptionFeature) {
  if (!device?.features?.length) {
    return null;
  }

  return (
    device.features.find(
      (feature) => COST_FEATURE_TYPES.includes(feature.type) && feature.energy_parent_id === consumptionFeature.id,
    ) ?? null
  );
}

/**
 * @description Get leaf consumption features, excluding empty intermediate parents.
 * @param {Array<object>} devices - Devices with features.
 * @param {string|null} [mainMeterDeviceId] - Main electric meter device id.
 * @returns {Array<object>} Leaf consumption candidates.
 * @example
 * getConsumptionFeaturesForDigest([{ id: 'd1', name: 'Plug', features: [] }]);
 */
function getConsumptionFeaturesForDigest(devices, mainMeterDeviceId = null) {
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
 * @description Fetch consumption totals for a period comparison.
 * @param {object} context - Gateway context with device manager.
 * @param {string} selector - Device feature selector.
 * @param {Date} periodStart - Current period start.
 * @param {Date} periodEnd - Current period end.
 * @param {Date} previousPeriodStart - Previous period start.
 * @param {string} displayMode - Consumption display mode.
 * @returns {Promise<object>} Current and previous totals.
 * @example
 * fetchConsumptionTotals(context, 'meter', new Date(), new Date(), new Date(), 'kwh');
 */
async function fetchConsumptionTotals(context, selector, periodStart, periodEnd, previousPeriodStart, displayMode) {
  const [currentWeekResults, previousWeekResults] = await Promise.all([
    context.device.energySensorManager.getConsumptionByDates([selector], {
      from: periodStart,
      to: periodEnd,
      group_by: 'day',
      display_mode: displayMode,
    }),
    context.device.energySensorManager.getConsumptionByDates([selector], {
      from: previousPeriodStart,
      to: periodStart,
      group_by: 'day',
      display_mode: displayMode,
    }),
  ]);

  return {
    current: sumConsumptionValues(currentWeekResults),
    previous: sumConsumptionValues(previousWeekResults),
    currencyUnit: currentWeekResults?.[0]?.deviceFeature?.currency_unit,
  };
}

/**
 * @description Fetch weekly consumption totals for one feature.
 * @param {object} context - Gateway context with device manager.
 * @param {object} candidate - Consumption candidate with device and feature.
 * @param {Date} periodStart - Current period start.
 * @param {Date} periodEnd - Current period end.
 * @param {Date} previousPeriodStart - Previous period start.
 * @param {string|null} mainMeterDeviceId - Configured main meter device id.
 * @param {Array<object>} devices - All devices with features.
 * @returns {Promise<object|null>} Consumption entry or null.
 * @example
 * fetchEnergyConsumptionForFeature(context, candidate, new Date(), new Date(), new Date(), 'meter-id', []);
 */
async function fetchEnergyConsumptionForFeature(
  context,
  candidate,
  periodStart,
  periodEnd,
  previousPeriodStart,
  mainMeterDeviceId,
  devices,
) {
  try {
    const kwhTotals = await fetchConsumptionTotals(
      context,
      candidate.feature.selector,
      periodStart,
      periodEnd,
      previousPeriodStart,
      'kwh',
    );

    const costFeature = findCostFeatureForConsumption(candidate.device, candidate.feature);
    let costTotals = null;
    if (costFeature?.selector) {
      try {
        costTotals = await fetchConsumptionTotals(
          context,
          costFeature.selector,
          periodStart,
          periodEnd,
          previousPeriodStart,
          'currency',
        );
      } catch (e) {
        costTotals = null;
      }
    }

    const hasKwhData = kwhTotals.current !== null || kwhTotals.previous !== null;
    const hasCostData = costTotals && (costTotals.current !== null || costTotals.previous !== null);

    if (!hasKwhData && !hasCostData) {
      return null;
    }

    const roomName = candidate.device.room?.name ?? 'Unknown room';

    return {
      device_id: candidate.device.id,
      device_name: candidate.device.name,
      room: roomName,
      feature_id: candidate.feature.id,
      feature_name: candidate.feature.name,
      feature_type: candidate.feature.type,
      energy_parent_feature_id: candidate.feature.energy_parent_id ?? null,
      is_on_configured_main_meter_device: mainMeterDeviceId !== null && candidate.device.id === mainMeterDeviceId,
      is_alternate_main_meter_source:
        mainMeterDeviceId !== null &&
        candidate.device.id !== mainMeterDeviceId &&
        belongsToMainMeterBranch(devices, candidate.feature, mainMeterDeviceId),
      current_week_kwh: kwhTotals.current,
      previous_week_kwh: kwhTotals.previous,
      ...(hasCostData
        ? {
            current_week_cost: costTotals.current,
            previous_week_cost: costTotals.previous,
            cost_unit: costTotals.currencyUnit ?? costFeature?.unit ?? null,
          }
        : {}),
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
  const { periodStart, periodEnd, previousPeriodStart, metadata: periodMetadata } = buildDigestPeriods(now);

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

      if (shouldCheckFeatureForStale(feature) && feature.last_value_changed) {
        const hoursSinceUpdate = (now.getTime() - new Date(feature.last_value_changed).getTime()) / (1000 * 60 * 60);
        if (hoursSinceUpdate > outdatedHours) {
          staleSensors.push({
            device: device.name,
            feature: feature.name,
            room: roomName,
            last_update: feature.last_value_changed,
            ...formatSilentDuration(hoursSinceUpdate),
          });
        }
      }
    });
  });

  const energyCandidates = getConsumptionFeaturesForDigest(devices, mainMeterDeviceId);
  const energyResults = await Promise.all(
    energyCandidates.map((candidate) =>
      fetchEnergyConsumptionForFeature(
        this,
        candidate,
        periodStart,
        periodEnd,
        previousPeriodStart,
        mainMeterDeviceId,
        devices,
      ),
    ),
  );
  const energy = energyResults.filter((entry) => entry !== null);

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
    period: periodMetadata,
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
    energy_context: {
      configured_main_meter_device_id: mainMeterDeviceId,
      feature_count: energy.length,
      note:
        'energy entries include all leaf consumption features with energy_parent_feature_id hierarchy. Siblings under the same parent are often tariff bands (e.g. Tempo HP/HC), not separate appliances. is_alternate_main_meter_source true means another view of the same main meter (e.g. Enedis API vs local Lixee TIC), not a separate load or activity trend. Do not sum parent and child values or duplicate main-meter sources. is_on_configured_main_meter_device marks the device linked to the energy price contract. Use period.from_date and period.to_date when stating totals. current_week_cost comes from linked daily-consumption-cost features only and excludes subscription charges.',
    },
    recent_scenes: recentlyExecutedScenes,
  };
}

module.exports = {
  buildWeeklyDigestData,
  sumConsumptionValues,
  isConsumptionFeature,
  shouldCheckFeatureForStale,
  formatSilentDuration,
  getConsumptionFeaturesForDigest,
  findDeviceFeatureById,
  belongsToMainMeterBranch,
  buildDigestPeriods,
  findCostFeatureForConsumption,
  getMainMeterDeviceId,
  fetchConsumptionTotals,
  fetchEnergyConsumptionForFeature,
};
