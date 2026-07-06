import { DEVICE_FEATURE_CATEGORIES } from '../../../../server/utils/constants';

// Visual groups of device feature categories, used to filter
// the activity history and to give each event an icon + color.
const CATEGORY_GROUPS = [
  {
    id: 'openings',
    icon: 'log-in',
    colorClass: 'azure',
    categories: [
      DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
      DEVICE_FEATURE_CATEGORIES.LOCK,
      DEVICE_FEATURE_CATEGORIES.SHUTTER,
      DEVICE_FEATURE_CATEGORIES.CURTAIN
    ]
  },
  {
    id: 'motion',
    icon: 'eye',
    colorClass: 'green',
    categories: [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR, DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR]
  },
  {
    id: 'buttons',
    icon: 'target',
    colorClass: 'purple',
    categories: [DEVICE_FEATURE_CATEGORIES.BUTTON, DEVICE_FEATURE_CATEGORIES.CUBE]
  },
  {
    id: 'lights',
    icon: 'sun',
    colorClass: 'yellow',
    categories: [
      DEVICE_FEATURE_CATEGORIES.LIGHT,
      DEVICE_FEATURE_CATEGORIES.SWITCH,
      DEVICE_FEATURE_CATEGORIES.TELEVISION
    ]
  },
  {
    id: 'climate',
    icon: 'thermometer',
    colorClass: 'blue',
    categories: [
      DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
      DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
      DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
      DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR,
      DEVICE_FEATURE_CATEGORIES.PM25_SENSOR,
      DEVICE_FEATURE_CATEGORIES.PM10_SENSOR,
      DEVICE_FEATURE_CATEGORIES.VOC_SENSOR,
      DEVICE_FEATURE_CATEGORIES.FORMALDEHYD_SENSOR,
      DEVICE_FEATURE_CATEGORIES.NOISE_SENSOR,
      DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
      DEVICE_FEATURE_CATEGORIES.UV_SENSOR,
      DEVICE_FEATURE_CATEGORIES.SOIL_MOISTURE_SENSOR,
      DEVICE_FEATURE_CATEGORIES.RAIN_SENSOR,
      DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR,
      DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      DEVICE_FEATURE_CATEGORIES.HEATER,
      DEVICE_FEATURE_CATEGORIES.FAN,
      DEVICE_FEATURE_CATEGORIES.THERMOSTAT
    ]
  },
  {
    id: 'security',
    icon: 'shield',
    colorClass: 'red',
    categories: [
      DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
      DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
      DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
      DEVICE_FEATURE_CATEGORIES.SIREN,
      DEVICE_FEATURE_CATEGORIES.TAMPER,
      DEVICE_FEATURE_CATEGORIES.SISMIC_SENSOR,
      DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
      DEVICE_FEATURE_CATEGORIES.BATTERY_LOW
    ]
  },
  {
    id: 'energy',
    icon: 'zap',
    colorClass: 'orange',
    categories: [
      DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      DEVICE_FEATURE_CATEGORIES.ENERGY_PRODUCTION_SENSOR,
      DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_BATTERY,
      DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CHARGE,
      DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_STATE
    ]
  }
];

// Categories not in any group above belong to the "other" group
const GROUPED_CATEGORIES = CATEGORY_GROUPS.reduce((acc, group) => acc.concat(group.categories), []);
const OTHER_CATEGORIES = Object.values(DEVICE_FEATURE_CATEGORIES).filter(
  category => !GROUPED_CATEGORIES.includes(category)
);

const OTHER_GROUP = {
  id: 'other',
  icon: 'activity',
  colorClass: 'gray',
  categories: OTHER_CATEGORIES
};

const ALL_GROUPS = [...CATEGORY_GROUPS, OTHER_GROUP];

const getGroupOfCategory = category => {
  const group = CATEGORY_GROUPS.find(oneGroup => oneGroup.categories.includes(category));
  return group || OTHER_GROUP;
};

export { CATEGORY_GROUPS, OTHER_GROUP, ALL_GROUPS, getGroupOfCategory };
