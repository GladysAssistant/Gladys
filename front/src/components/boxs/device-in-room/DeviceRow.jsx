import BinaryDeviceFeature from './device-features/BinaryDeviceFeature';
import ColorDeviceFeature from './device-features/ColorDeviceFeature';
import SensorDeviceFeature from './device-features/SensorDeviceFeature';
import MultilevelDeviceFeature from './device-features/MultiLevelDeviceFeature';

const DeviceRow = ({ children, ...props }) => {
  // if device is a sensor, we display the sensor deviceFeature
  if (props.deviceFeature.read_only) {
    return <SensorDeviceFeature user={props.user} deviceFeature={props.deviceFeature} />;
  }

  // else, it's not a sensor
  // if it's a binary
  if (props.deviceFeature.type === 'binary') {
    return (
      <BinaryDeviceFeature
        x={props.x}
        y={props.y}
        device={props.device}
        deviceFeature={props.deviceFeature}
        roomIndex={props.roomIndex}
        deviceIndex={props.deviceIndex}
        deviceFeatureIndex={props.deviceFeatureIndex}
        updateValue={props.updateValue}
      />
    );
  }
  if (props.deviceFeature.type === 'color') {
    return (
      <ColorDeviceFeature
        x={props.x}
        y={props.y}
        device={props.device}
        deviceFeature={props.deviceFeature}
        roomIndex={props.roomIndex}
        deviceIndex={props.deviceIndex}
        deviceFeatureIndex={props.deviceFeatureIndex}
        updateValue={props.updateValue}
      />
    );
  }
  if (props.deviceFeature.type === 'dimmer') {
    return (
      <MultilevelDeviceFeature
        x={props.x}
        y={props.y}
        device={props.device}
        deviceFeature={props.deviceFeature}
        roomIndex={props.roomIndex}
        deviceIndex={props.deviceIndex}
        deviceFeatureIndex={props.deviceFeatureIndex}
        updateValue={props.updateValue}
      />
    );
  }
  // if not, we return nothing
  return null;
};

export default DeviceRow;
