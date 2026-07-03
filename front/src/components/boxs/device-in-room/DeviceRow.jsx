import { createElement } from 'preact';
import get from 'get-value';
import { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } from '../../../../../server/utils/constants';

import { getDeviceName } from '../../../utils/device';

import BinaryDeviceFeature from './device-features/BinaryDeviceFeature';
import ColorDeviceFeature from './device-features/ColorDeviceFeature';
import SensorDeviceFeature from './device-features/sensor-value/SensorDeviceFeature';
import LightTemperatureDeviceFeature from './device-features/LightTemperatureDeviceFeature';
import MultiLevelDeviceFeature from './device-features/MultiLevelDeviceFeature';
import NumberDeviceFeature from './device-features/NumberDeviceFeature';
import CoverDeviceFeature from './device-features/CoverDeviceFeature';
import SetpointDeviceFeature from './device-features/SetpointDeviceFeature';
import AirConditioningModeDeviceFeature from './device-features/AirConditioningModeDeviceFeature';
import FanModeDeviceFeature from './device-features/FanModeDeviceFeature';
import FanLabeledSelectDeviceFeature from './device-features/FanLabeledSelectDeviceFeature';
import PilotWireModeDeviceFeature from './device-features/PilotWireModeDeviceFeature';
import LMHVolumeDeviceFeature from './device-features/LMHVolumeDeviceFeature';
import PushDeviceFeature from './device-features/PushDeviceFeature';
import VacuumCleanerDockDeviceFeature from './device-features/VacuumCleanerDockDeviceFeature';
import VacuumCleanerModeDeviceFeature from './device-features/VacuumCleanerModeDeviceFeature';
import VacuumCleanerCleanModeDeviceFeature from './device-features/VacuumCleanerCleanModeDeviceFeature';

const ROW_TYPE_BY_FEATURE_TYPE = {
  [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: BinaryDeviceFeature,
  [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: ColorDeviceFeature,
  [DEVICE_FEATURE_TYPES.SWITCH.DIMMER]: MultiLevelDeviceFeature,
  [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: MultiLevelDeviceFeature,
  [DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE]: LightTemperatureDeviceFeature,
  [DEVICE_FEATURE_TYPES.TELEVISION.CHANNEL]: NumberDeviceFeature,
  [DEVICE_FEATURE_TYPES.TELEVISION.VOLUME]: MultiLevelDeviceFeature,
  [DEVICE_FEATURE_TYPES.SHUTTER.STATE]: CoverDeviceFeature,
  [DEVICE_FEATURE_TYPES.SHUTTER.POSITION]: MultiLevelDeviceFeature,
  [DEVICE_FEATURE_TYPES.CURTAIN.STATE]: CoverDeviceFeature,
  [DEVICE_FEATURE_TYPES.CURTAIN.POSITION]: MultiLevelDeviceFeature,
  [DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE]: SetpointDeviceFeature,
  [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE]: AirConditioningModeDeviceFeature,
  [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE]: SetpointDeviceFeature,
  [DEVICE_FEATURE_TYPES.FAN.MODE]: FanModeDeviceFeature,
  [DEVICE_FEATURE_TYPES.FAN.PERCENT]: MultiLevelDeviceFeature,
  [DEVICE_FEATURE_TYPES.FAN.SPEED]: MultiLevelDeviceFeature,
  [DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING]: FanLabeledSelectDeviceFeature,
  [DEVICE_FEATURE_TYPES.FAN.WIND_SETTING]: FanLabeledSelectDeviceFeature,
  [DEVICE_FEATURE_TYPES.FAN.AIRFLOW_DIRECTION]: FanLabeledSelectDeviceFeature,
  [DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE]: PilotWireModeDeviceFeature,
  [DEVICE_FEATURE_TYPES.LOCK.BINARY]: BinaryDeviceFeature,
  [DEVICE_FEATURE_TYPES.SIREN.LMH_VOLUME]: LMHVolumeDeviceFeature,
  [DEVICE_FEATURE_TYPES.SIREN.MELODY]: NumberDeviceFeature,
  [DEVICE_FEATURE_TYPES.DURATION.DECIMAL]: MultiLevelDeviceFeature,
  [DEVICE_FEATURE_TYPES.BUTTON.PUSH]: PushDeviceFeature,
  [DEVICE_FEATURE_TYPES.SWITCH.TARGET_CURRENT]: SetpointDeviceFeature,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.CHARGE_ON]: BinaryDeviceFeature,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.TARGET_CHARGE_LIMIT]: MultiLevelDeviceFeature,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CHARGE.TARGET_CURRENT]: SetpointDeviceFeature,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CLIMATE.CLIMATE_ON]: BinaryDeviceFeature,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_CLIMATE.TARGET_TEMPERATURE]: SetpointDeviceFeature,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_COMMAND.ALARM]: BinaryDeviceFeature,
  [DEVICE_FEATURE_TYPES.ELECTRICAL_VEHICLE_COMMAND.LOCK]: BinaryDeviceFeature,
  [DEVICE_FEATURE_TYPES.VACUUM_CLEANER.DOCK]: VacuumCleanerDockDeviceFeature,
  [DEVICE_FEATURE_TYPES.VACUUM_CLEANER.RUN_MODE]: VacuumCleanerModeDeviceFeature,
  [DEVICE_FEATURE_TYPES.VACUUM_CLEANER.CLEAN_MODE]: VacuumCleanerCleanModeDeviceFeature
};

// Some feature type strings are shared across categories (e.g. AIR_CONDITIONING.MODE and FAN.MODE
// are both 'mode'). Because ROW_TYPE_BY_FEATURE_TYPE is keyed by type only, whichever entry is
// declared last silently wins for every category. This category-aware map takes precedence and
// disambiguates each colliding type by its category, so routing no longer depends on declaration
// order and stays correct when new categories reuse an existing type string.
const ROW_TYPE_BY_CATEGORY_AND_TYPE = {
  [DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]: {
    [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE]: AirConditioningModeDeviceFeature
  },
  [DEVICE_FEATURE_CATEGORIES.FAN]: {
    [DEVICE_FEATURE_TYPES.FAN.MODE]: FanModeDeviceFeature
  }
};

const DeviceRow = ({ children, ...props }) => {
  const { device, deviceFeature } = props;
  const rowName = deviceFeature.new_label || getDeviceName(device, deviceFeature);

  // if device is a sensor, we display the sensor deviceFeature
  if (props.deviceFeature.read_only) {
    return (
      <SensorDeviceFeature
        user={props.user}
        device={device}
        deviceFeature={deviceFeature}
        rowName={rowName}
        intl={props.intl}
      />
    );
  }

  const elementType =
    get(ROW_TYPE_BY_CATEGORY_AND_TYPE, `${deviceFeature.category}.${deviceFeature.type}`) ||
    ROW_TYPE_BY_FEATURE_TYPE[props.deviceFeature.type];

  if (!elementType) {
    // if no related components, we display the device as a sensor
    return (
      <SensorDeviceFeature
        user={props.user}
        device={device}
        deviceFeature={deviceFeature}
        rowName={rowName}
        intl={props.intl}
      />
    );
  }

  return createElement(elementType, { ...props, rowName });
};

export default DeviceRow;
