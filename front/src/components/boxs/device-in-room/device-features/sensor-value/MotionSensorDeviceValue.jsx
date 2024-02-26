import { Text } from 'preact-i18n';

import RelativeTime from '../../../../device/RelativeTime';

const MotionSensorDeviceValue = ({ deviceFeature, user }) => {
  const { last_value: lastValue, last_value_changed: lastValueChanged } = deviceFeature;
  if (lastValue) {
    return (
      <span class="badge badge-info">
        <Text id="dashboard.boxes.devicesInRoom.motionDetected" />
      </span>
    );
  } else if (lastValueChanged) {
    return <RelativeTime datetime={lastValueChanged} language={user ? user.language : null} futureDisabled />;
  }

  return <Text id="dashboard.boxes.devicesInRoom.noValue" />;
};

export default MotionSensorDeviceValue;
