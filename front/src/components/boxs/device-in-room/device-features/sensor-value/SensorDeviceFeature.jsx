import { createElement } from 'preact';
import get from 'get-value';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';

import BatteryLevelFeature from './BatteryLevelFeature';
import BinaryDeviceValue from './BinaryDeviceValue';
import LastSeenDeviceValue from './LastSeenDeviceValue';
import MotionSensorDeviceValue from './MotionSensorDeviceValue';
import BadgeNumberDeviceValue from './BadgeNumberDeviceValue';
import DistanceSensorDeviceValue from './DistanceSensorDeviceValue';
import IconBinaryDeviceValue from './IconBinaryDeviceValue';
import SignalQualityDeviceValue from './SignalQualityDeviceValue';
import ButtonClickDeviceValue from './ButtonClickDeviceValue';
import TextDeviceValue from './TextDeviceValue';
import NoRecentValueBadge from './NoRecentValueBadge';
import TemperatureSensorDeviceValue from './TemperatureSensorDeviceValue';
import LevelSensorDeviceValue from './LevelSensorDeviceValue';
import PressureSensorDeviceValue from './PressureSensorDeviceValue';

const DISPLAY_BY_FEATURE_CATEGORY = {
  [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR]: MotionSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR]: LastSeenDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: IconBinaryDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.SIGNAL]: SignalQualityDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.BUTTON]: ButtonClickDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.TEXT]: TextDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: TemperatureSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.DISTANCE_SENSOR]: DistanceSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR]: PressureSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR]: DistanceSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_DRIVE]: DistanceSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CONSUMPTION]: DistanceSensorDeviceValue
};

const DISPLAY_BY_FEATURE_TYPE = {
  [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: BinaryDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.LEVEL_SENSOR.LIQUID_STATE]: LevelSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.LEVEL_SENSOR.LIQUID_DEPTH]: DistanceSensorDeviceValue,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.DOOR_OPENED]: BinaryDeviceValue,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.PLUGGED]: BinaryDeviceValue,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.WINDOW_OPENED]: BinaryDeviceValue,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_ENERGY_REMAINING]: BadgeNumberDeviceValue,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_LEVEL]: BatteryLevelFeature,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_POWER]: BadgeNumberDeviceValue,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_TEMPERATURE]: TemperatureSensorDeviceValue,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_VOLTAGE]: BadgeNumberDeviceValue,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CLIMATE.INDOOR_TEMPERATURE]: TemperatureSensorDeviceValue,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_BATTERY.BATTERY_RANGE_ESTIMATE]: DistanceSensorDeviceValue,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.ODOMETER]: DistanceSensorDeviceValue,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.TIRE_PRESSURE]: PressureSensorDeviceValue
};

const DEVICE_FEATURES_WITHOUT_EXPIRATION = [
  DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
  DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
  DEVICE_FEATURE_CATEGORIES.BUTTON,
  DEVICE_FEATURE_CATEGORIES.TEXT
];

const SensorDeviceType = ({ children, ...props }) => {
  const { deviceFeature: feature } = props;
  const { category, type } = feature;

  let elementType = DISPLAY_BY_FEATURE_CATEGORY[category];

  if (!elementType) {
    elementType = DISPLAY_BY_FEATURE_TYPE[type];
  }

  if (!elementType) {
    elementType = BadgeNumberDeviceValue;
  }

  // If the device feature has no recent value, and the feature is not in the blacklist
  // we display a message to the user
  if (feature.last_value_is_too_old && DEVICE_FEATURES_WITHOUT_EXPIRATION.indexOf(feature.category) === -1) {
    elementType = NoRecentValueBadge;
  }

  return (
    <tr>
      <td>
        <i class={`mr-2 fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`)}`} />
      </td>
      <td>{props.rowName}</td>
      <td class="text-right">{createElement(elementType, props)}</td>
    </tr>
  );
};

export default SensorDeviceType;
