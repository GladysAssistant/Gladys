import { Text } from 'preact-i18n';

// last_value_changed is refreshed on every state report, even when the sensor
// re-publishes "no motion", so it cannot be displayed as the time of the last motion.
const MotionSensorDeviceValue = ({ deviceFeature }) => {
  const { last_value: lastValue = null } = deviceFeature;
  if (lastValue === null) {
    return <Text id="dashboard.boxes.devicesInRoom.noValue" />;
  }

  if (lastValue) {
    return (
      <span class="badge badge-info">
        <Text id="dashboard.boxes.devicesInRoom.motionDetected" />
      </span>
    );
  }

  return (
    <span class="badge badge-secondary">
      <Text id="dashboard.boxes.devicesInRoom.noMotionDetected" />
    </span>
  );
};

export default MotionSensorDeviceValue;
