import { Text } from 'preact-i18n';
import { DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';

const ScheduleDeviceValue = ({ deviceFeature, user }) => {
  const { type, last_value: lastValue } = deviceFeature;
  const lastValueTime = lastValue ? new Date(lastValue) : null;
  let formattedTime;
  if (type === DEVICE_FEATURE_TYPES.SCHEDULE.TIME_DAY_HOUR) {
    formattedTime = lastValueTime
      ? lastValueTime.toLocaleString(user.language, {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      : null;
  } else if (type === DEVICE_FEATURE_TYPES.SCHEDULE.TIME_HOUR) {
    formattedTime = lastValueTime
      ? lastValueTime.toLocaleString(user.language, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      : null;
  }
  return (
    <div>
      {!formattedTime && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {formattedTime && <span>{formattedTime}</span>}
    </div>
  );
};

export default ScheduleDeviceValue;
