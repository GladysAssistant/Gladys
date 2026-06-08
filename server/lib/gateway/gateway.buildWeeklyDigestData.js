const dayjs = require('dayjs');

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

const DEFAULT_DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED = 48;

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

  const batteryThreshold = Number(batteryThresholdRaw ?? 10);
  const outdatedHours = Number(outdatedHoursRaw ?? DEFAULT_DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED);

  const temperatures = [];
  const humidities = [];
  const lowBatteries = [];
  const staleSensors = [];
  const energyFeatures = [];

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

      if (
        feature.category === DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR &&
        feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION
      ) {
        energyFeatures.push({
          device: device.name,
          feature: feature.name,
          selector: feature.selector,
          unit: feature.unit,
        });
      }
    });
  });

  const energy = [];
  await Promise.all(
    energyFeatures.slice(0, 3).map(async (energyFeature) => {
      try {
        const [currentWeekResults, previousWeekResults] = await Promise.all([
          this.device.energySensorManager.getConsumptionByDates([energyFeature.selector], {
            from: periodStart,
            to: periodEnd,
            group_by: 'day',
            display_mode: 'kwh',
          }),
          this.device.energySensorManager.getConsumptionByDates([energyFeature.selector], {
            from: previousPeriodStart,
            to: periodStart,
            group_by: 'day',
            display_mode: 'kwh',
          }),
        ]);

        const currentWeekTotal = sumConsumptionValues(currentWeekResults);
        const previousWeekTotal = sumConsumptionValues(previousWeekResults);

        if (currentWeekTotal === null && previousWeekTotal === null) {
          return;
        }

        energy.push({
          device: energyFeature.device,
          feature: energyFeature.feature,
          unit: 'kWh',
          current_week_total: currentWeekTotal,
          previous_week_total: previousWeekTotal,
        });
      } catch (e) {
        // Ignore energy errors for a single meter in the digest.
      }
    }),
  );

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
};
