import { createElement } from 'preact';
import get from 'get-value';
import { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } from '../../../../../server/utils/constants';

import { getDeviceName } from '../../../utils/device';
import { TelevisionPushButtonFeatureTypes } from '../../../utils/consts';

import BinaryDeviceFeature from './device-features/BinaryDeviceFeature';
import ColorDeviceFeature from './device-features/ColorDeviceFeature';
import SensorDeviceFeature from './device-features/sensor-value/SensorDeviceFeature';
import LightTemperatureDeviceFeature from './device-features/LightTemperatureDeviceFeature';
import MultiLevelDeviceFeature from './device-features/MultiLevelDeviceFeature';
import NumberDeviceFeature from './device-features/NumberDeviceFeature';
import CoverDeviceFeature from './device-features/CoverDeviceFeature';
import SetpointDeviceFeature from './device-features/SetpointDeviceFeature';
import AirConditioningModeDeviceFeature from './device-features/AirConditioningModeDeviceFeature';
import ThermostatModeDeviceFeature from './device-features/ThermostatModeDeviceFeature';
import FanModeDeviceFeature from './device-features/FanModeDeviceFeature';
import FanLabeledSelectDeviceFeature from './device-features/FanLabeledSelectDeviceFeature';
import AirConditioningFanSpeedDeviceFeature from './device-features/AirConditioningFanSpeedDeviceFeature';
import AirConditioningSwingDeviceFeature from './device-features/AirConditioningSwingDeviceFeature';
import PilotWireModeDeviceFeature from './device-features/PilotWireModeDeviceFeature';
import LMHVolumeDeviceFeature from './device-features/LMHVolumeDeviceFeature';
import PushDeviceFeature from './device-features/PushDeviceFeature';
import VacuumCleanerDockDeviceFeature from './device-features/VacuumCleanerDockDeviceFeature';
import VacuumCleanerModeDeviceFeature from './device-features/VacuumCleanerModeDeviceFeature';
import VacuumCleanerCleanModeDeviceFeature from './device-features/VacuumCleanerCleanModeDeviceFeature';
import WaterHeaterModeDeviceFeature from './device-features/WaterHeaterModeDeviceFeature';
import TextSelectDeviceFeature from './device-features/TextSelectDeviceFeature';

const ROW_TYPE_BY_FEATURE_TYPE = {
  [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: BinaryDeviceFeature,
  [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: ColorDeviceFeature,
  [DEVICE_FEATURE_TYPES.SWITCH.DIMMER]: MultiLevelDeviceFeature,
  [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: MultiLevelDeviceFeature,
  [DEVICE_FEATURE_TYPES.LIGHT.HUE]: MultiLevelDeviceFeature,
  [DEVICE_FEATURE_TYPES.LIGHT.SATURATION]: MultiLevelDeviceFeature,
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
  [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.FAN_SPEED]: AirConditioningFanSpeedDeviceFeature,
  [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_HORIZONTAL]: AirConditioningSwingDeviceFeature,
  [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.SWING_VERTICAL]: AirConditioningSwingDeviceFeature,
  [DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE]: PilotWireModeDeviceFeature,
  [DEVICE_FEATURE_TYPES.LOCK.BINARY]: BinaryDeviceFeature,
  [DEVICE_FEATURE_TYPES.SIREN.LMH_VOLUME]: LMHVolumeDeviceFeature,
  [DEVICE_FEATURE_TYPES.SIREN.MELODY]: NumberDeviceFeature,
  [DEVICE_FEATURE_TYPES.SIREN.BINARY]: BinaryDeviceFeature,
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
  [DEVICE_FEATURE_TYPES.VACUUM_CLEANER.CLEAN_MODE]: VacuumCleanerCleanModeDeviceFeature,
  [DEVICE_FEATURE_TYPES.WATER_VALVE.AUTO_CLOSE_WHEN_WATER_SHORTAGE]: BinaryDeviceFeature
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
  },
  // `mode` and `target-temperature` are strings other categories already own, so routing them from
  // the type-keyed map would let declaration order decide the winner for every category. `binary`
  // and `boost` would resolve correctly there too; they are kept here so the whole category reads
  // in one place.
  [DEVICE_FEATURE_CATEGORIES.WATER_HEATER]: {
    [DEVICE_FEATURE_TYPES.WATER_HEATER.BINARY]: BinaryDeviceFeature,
    [DEVICE_FEATURE_TYPES.WATER_HEATER.MODE]: WaterHeaterModeDeviceFeature,
    [DEVICE_FEATURE_TYPES.WATER_HEATER.TARGET_TEMPERATURE]: SetpointDeviceFeature,
    [DEVICE_FEATURE_TYPES.WATER_HEATER.BOOST]: BinaryDeviceFeature
  },
  // Television remote-control orders (play, pause, channel up, ...) are write-only commands: they
  // are displayed as push buttons instead of falling back to a read-only sensor row.
  [DEVICE_FEATURE_CATEGORIES.TELEVISION]: TelevisionPushButtonFeatureTypes.reduce(
    (acc, type) => ({ ...acc, [type]: PushDeviceFeature }),
    {}
  ),
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: {
    [DEVICE_FEATURE_TYPES.THERMOSTAT.MODE]: ThermostatModeDeviceFeature
  },
  // A dynamic select: its options are string values discovered on the appliance by the
  // integration (installed TV apps, HDMI sources...), declared through supported_options
  [DEVICE_FEATURE_CATEGORIES.TEXT]: {
    [DEVICE_FEATURE_TYPES.TEXT.SELECT]: TextSelectDeviceFeature
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
