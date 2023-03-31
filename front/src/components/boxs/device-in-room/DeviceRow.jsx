import { createElement } from 'preact';
import { DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

import BinaryDeviceFeature from './device-features/BinaryDeviceFeature';
import ColorDeviceFeature from './device-features/ColorDeviceFeature';
import SensorDeviceFeature from './device-features/sensor-value/SensorDeviceFeature';
import LightTemperatureDeviceFeature from './device-features/LightTemperatureDeviceFeature';
import MultiLevelDeviceFeature from './device-features/MultiLevelDeviceFeature';
import NumberDeviceFeature from './device-features/NumberDeviceFeature';
import CoverDeviceFeature from './device-features/CoverDeviceFeature';
import ThermostatDeviceFeature from './device-features/ThermostatDeviceFeature';
import AirConditioningModeDeviceFeature from './device-features/AirConditioningModeDeviceFeature';

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
  [DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE]: ThermostatDeviceFeature,
  [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE]: AirConditioningModeDeviceFeature,
  [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE]: ThermostatDeviceFeature
};

const DeviceRow = ({ children, ...props }) => {
  // if device is a sensor, we display the sensor deviceFeature
  if (props.deviceFeature.read_only) {
    return <SensorDeviceFeature user={props.user} deviceFeature={props.deviceFeature} />;
  }

  const elementType = ROW_TYPE_BY_FEATURE_TYPE[props.deviceFeature.type];

  if (!elementType) {
    // if no related components, we return nothing
    return null;
  }

  return createElement(elementType, props);
};

export default DeviceRow;
