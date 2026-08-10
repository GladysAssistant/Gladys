import { Text } from 'preact-i18n';

import RelativeTime from '../../../../device/RelativeTime';

// A doorbell ring is a momentary event: the integration reports a short 1 -> 0
// pulse (like a motion sensor). We show "Ringing" while the value is active,
// otherwise the time of the last ring. A ring that is never reset is caught by
// the standard outdated-state mechanism (last_value_is_too_old), so DOORBELL is
// intentionally NOT in DEVICE_FEATURES_WITHOUT_EXPIRATION.
const DoorbellRingDeviceValue = ({ deviceFeature, user }) => {
  const { last_value: lastValue, last_value_changed: lastValueChanged } = deviceFeature;
  if (lastValue) {
    return (
      <span class="badge badge-info">
        <Text id="dashboard.boxes.devicesInRoom.doorbellRinging" />
      </span>
    );
  } else if (lastValueChanged) {
    return <RelativeTime datetime={lastValueChanged} language={user ? user.language : null} futureDisabled />;
  }

  return <Text id="dashboard.boxes.devicesInRoom.noValue" />;
};

export default DoorbellRingDeviceValue;
