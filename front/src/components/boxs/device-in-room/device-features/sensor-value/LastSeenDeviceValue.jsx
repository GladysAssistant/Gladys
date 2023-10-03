import { Text } from 'preact-i18n';

import RelativeTime from '../../../../device/RelativeTime';

const LastSeenDeviceValue = ({ deviceFeature, user }) => {
  const { last_value_changed: lastValueChanged } = deviceFeature;

  if (lastValueChanged) {
    return <RelativeTime datetime={lastValueChanged} language={user ? user.language : null} futureDisabled />;
  }

  return <Text id="dashboard.boxes.devicesInRoom.noValue" />;
};

export default LastSeenDeviceValue;
