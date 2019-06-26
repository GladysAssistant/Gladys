// import BinaryDeviceFeature from './device-features/BinaryDeviceFeature';
import SensorDeviceFeature from './device-features/SensorDeviceFeature';
// import MultilevelDeviceFeature from './device-features/MultiLevelDeviceFeature';

const DeviceRow = ({ children, ...props }) => {
  if (props.deviceFeature.display === 0) {
    return null;
  }

  // if device is a sensor, we display the sensor deviceFeature
  if (props.deviceFeature.read_only) {
    return <SensorDeviceFeature deviceFeature={props.deviceFeature} />;
  }

  // else, it's not a sensor
  // TODO: not working for now
  // if it's a binary
  /*if (props.deviceFeature.type === 'binary') {
    return (
      <BinaryDeviceFeature
        device={props.device}
        deviceFeature={props.deviceFeature}
        roomIndex={props.roomIndex}
        deviceIndex={props.deviceIndex}
        deviceFeatureIndex={props.deviceFeatureIndex}
        updateValue={props.updateValue}
      />
    );
  }*/

  // if not, we return nothing
  return null;
};

export default DeviceRow;
