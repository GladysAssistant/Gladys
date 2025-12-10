import { v4 as uuid } from 'uuid';
import get from 'get-value';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../../../server/utils/constants';

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 1000000;

const buildDailyConsumptionFeature = (usagePointId, intlDictionary, existingFeature) => {
  if (existingFeature) {
    return {
      ...existingFeature,
      energy_parent_id: null
    };
  }

  return {
    id: uuid(),
    name: get(intlDictionary, 'integration.enedis.welcome.dailyConsumptionFeatureName'),
    selector: `enedis-${usagePointId}-daily-consumption`,
    min: DEFAULT_MIN,
    max: DEFAULT_MAX,
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    external_id: `enedis:${usagePointId}:daily-consumption`,
    type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
    unit: DEVICE_FEATURE_UNITS.WATT_HOUR,
    read_only: true,
    has_feedback: false,
    keep_history: true,
    energy_parent_id: null
  };
};

const buildConsumptionLoadCurveFeature = (usagePointId, intlDictionary, dailyFeatureId, existingFeature) => ({
  id: (existingFeature && existingFeature.id) || uuid(),
  name: get(intlDictionary, 'integration.enedis.welcome.consumptionLoadCurveFeatureName'),
  selector: `enedis-${usagePointId}-consumption-load-curve`,
  min: DEFAULT_MIN,
  max: DEFAULT_MAX,
  category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  external_id: `enedis:${usagePointId}:consumption-load-curve`,
  type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
  unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  read_only: true,
  has_feedback: false,
  keep_history: true,
  energy_parent_id: dailyFeatureId
});

const buildConsumptionLoadCurveCostFeature = (usagePointId, intlDictionary, consumptionFeatureId, existingFeature) => ({
  id: (existingFeature && existingFeature.id) || uuid(),
  name: get(intlDictionary, 'integration.enedis.welcome.consumptionLoadCurveCostFeatureName'),
  selector: `enedis-${usagePointId}-consumption-load-curve-cost`,
  min: DEFAULT_MIN,
  max: DEFAULT_MAX,
  category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  external_id: `enedis:${usagePointId}:consumption-load-curve-cost`,
  type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
  unit: DEVICE_FEATURE_UNITS.EURO,
  read_only: true,
  has_feedback: false,
  keep_history: true,
  energy_parent_id: consumptionFeatureId
});

export const buildUsagePointDevicePayload = ({ usagePointId, serviceId, intlDictionary, existingDevice }) => {
  const existingFeatures = (existingDevice && existingDevice.features) || [];

  const oldDailyConsumptionFeature = existingFeatures.find(
    feature => feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION
  );
  const oldConsumptionLoadCurveFeature = existingFeatures.find(
    feature => feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION
  );
  const oldConsumptionLoadCurveCostFeature = existingFeatures.find(
    feature => feature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST
  );

  const dailyConsumptionFeature = buildDailyConsumptionFeature(
    usagePointId,
    intlDictionary,
    oldDailyConsumptionFeature
  );
  const consumptionLoadCurveFeature = buildConsumptionLoadCurveFeature(
    usagePointId,
    intlDictionary,
    dailyConsumptionFeature.id,
    oldConsumptionLoadCurveFeature
  );
  const consumptionLoadCurveCostFeature = buildConsumptionLoadCurveCostFeature(
    usagePointId,
    intlDictionary,
    consumptionLoadCurveFeature.id,
    oldConsumptionLoadCurveCostFeature
  );

  return {
    name: (existingDevice && existingDevice.name) || 'Enedis',
    selector: `enedis-${usagePointId}`,
    external_id: `enedis:${usagePointId}`,
    service_id: serviceId,
    features: [dailyConsumptionFeature, consumptionLoadCurveFeature, consumptionLoadCurveCostFeature]
  };
};
