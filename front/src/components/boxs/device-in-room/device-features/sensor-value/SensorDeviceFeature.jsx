import { createElement } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';
import RelativeTime from '../../../../device/RelativeTime';

import BatteryLevelFeature from './BatteryLevelFeature';
import BinaryDeviceValue from './BinaryDeviceValue';
import LastSeenDeviceValue from './LastSeenDeviceValue';
import MotionSensorDeviceValue from './MotionSensorDeviceValue';
import DoorbellRingDeviceValue from './DoorbellRingDeviceValue';
import BadgeNumberDeviceValue from './BadgeNumberDeviceValue';
import DistanceSensorDeviceValue from './DistanceSensorDeviceValue';
import IconBinaryDeviceValue from './IconBinaryDeviceValue';
import SignalQualityDeviceValue from './SignalQualityDeviceValue';
import ButtonClickDeviceValue from './ButtonClickDeviceValue';
import TextDeviceValue from './TextDeviceValue';
import NoRecentValueBadge from './NoRecentValueBadge';
import TemperatureSensorDeviceValue from './TemperatureSensorDeviceValue';
import LevelSensorDeviceValue from './LevelSensorDeviceValue';
import WaterValveDeviceValue from './WaterValveDeviceValue';
import PressureSensorDeviceValue from './PressureSensorDeviceValue';
import FanSensorDeviceValue from './FanSensorDeviceValue';
import VacuumCleanerStateDeviceValue from './VacuumCleanerStateDeviceValue';
import ThermostatOperatingStateDeviceValue from './ThermostatOperatingStateDeviceValue';
import ChargingStationConnectorStatusDeviceValue from './ChargingStationConnectorStatusDeviceValue';
import ChargingStationChargingStateDeviceValue from './ChargingStationChargingStateDeviceValue';

// Checked before the category map: a category whose renderer only makes sense for one of its
// types needs an escape hatch. presence-sensor is historically a "push" category rendered as a
// last-seen date, but cameras report presence as a binary, which deserves a Yes/No badge.
const DISPLAY_BY_FEATURE_CATEGORY_AND_TYPE = {
  [DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR]: {
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: BinaryDeviceValue
  }
};

const DISPLAY_BY_FEATURE_CATEGORY = {
  [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR]: MotionSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.DOORBELL]: DoorbellRingDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR]: LastSeenDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: BinaryDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.SIGNAL]: SignalQualityDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.BUTTON]: ButtonClickDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.TEXT]: TextDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.LOCK]: IconBinaryDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: TemperatureSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.DISTANCE_SENSOR]: DistanceSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR]: PressureSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR]: DistanceSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_DRIVE]: DistanceSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.ELECTRICAL_VEHICLE_CONSUMPTION]: DistanceSensorDeviceValue,
  [DEVICE_FEATURE_CATEGORIES.FAN]: FanSensorDeviceValue
};

const DISPLAY_BY_FEATURE_TYPE = {
  [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: BinaryDeviceValue,
  [DEVICE_FEATURE_TYPES.LEVEL_SENSOR.LIQUID_STATE]: LevelSensorDeviceValue,
  [DEVICE_FEATURE_TYPES.WATER_VALVE.CURRENT_DEVICE_STATUS]: WaterValveDeviceValue,
  [DEVICE_FEATURE_TYPES.WATER_VALVE.VALVE_WORK_STATE]: BinaryDeviceValue,
  [DEVICE_FEATURE_TYPES.LEVEL_SENSOR.LIQUID_DEPTH]: DistanceSensorDeviceValue,
  [DEVICE_FEATURE_TYPES.SIREN.TEST_IN_PROGRESS]: BinaryDeviceValue,
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
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_STATE.TIRE_PRESSURE]: PressureSensorDeviceValue,
  [DEVICE_FEATURE_TYPES.VACUUM_CLEANER.STATE]: VacuumCleanerStateDeviceValue,
  [DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE]: ThermostatOperatingStateDeviceValue,
  [DEVICE_FEATURE_TYPES.CHARGING_STATION.CONNECTOR_STATUS]: ChargingStationConnectorStatusDeviceValue,
  [DEVICE_FEATURE_TYPES.CHARGING_STATION.CHARGING_STATE]: ChargingStationChargingStateDeviceValue,
  // Registered by type, not by category: the category map is checked first and would force one
  // renderer on every water-heater sensor. remaining-hot-water keeps the numeric-badge default.
  [DEVICE_FEATURE_TYPES.WATER_HEATER.HEATING]: BinaryDeviceValue
};

const DEVICE_FEATURES_WITHOUT_EXPIRATION = [
  DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
  DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
  DEVICE_FEATURE_CATEGORIES.BUTTON,
  DEVICE_FEATURE_CATEGORIES.TEXT
];

const SensorDeviceType = ({ children, ...props }) => {
  const { deviceFeature: feature, displayLastStateChange, lastStateChange, user } = props;
  const { category, type } = feature;

  // Enabled per box in the box editor. A binary state alone does not tell when the door was
  // opened: the date of the last state change is displayed right under the state.
  // Restricted to read-only features: writable binary features (a switch, a child lock...) also
  // reach this component through DeviceRow, and DevicesBox does not request any date for them.
  // `lastStateChange` is undefined while the request is in flight, and stays undefined for a
  // feature the server left out (unknown, or not keeping any history), so nothing is displayed
  // until an answer is known: null then really means "no change found in the history".
  const showLastStateChange =
    displayLastStateChange === true &&
    feature.read_only === true &&
    type === DEVICE_FEATURE_TYPES.SENSOR.BINARY &&
    lastStateChange !== undefined;

  let elementType = get(DISPLAY_BY_FEATURE_CATEGORY_AND_TYPE, `${category}.${type}`);

  if (!elementType) {
    elementType = DISPLAY_BY_FEATURE_CATEGORY[category];
  }

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
      <td class="text-right">
        {createElement(elementType, props)}
        {showLastStateChange && (
          <div class="small text-muted">
            {lastStateChange ? (
              <RelativeTime datetime={lastStateChange} language={user ? user.language : null} futureDisabled />
            ) : (
              <Text id="dashboard.boxes.devicesInRoom.noLastStateChange" />
            )}
          </div>
        )}
      </td>
    </tr>
  );
};

export default SensorDeviceType;
