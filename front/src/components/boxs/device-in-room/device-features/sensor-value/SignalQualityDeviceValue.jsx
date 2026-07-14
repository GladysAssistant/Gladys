import { Text } from 'preact-i18n';
import SvgIcon from '../../../../icons/SvgIcon';
import { getSignalQualityIcon, getSignalQualityLevel } from '../../../../../utils/signalQuality';

const SignalQualityDeviceValue = ({ deviceFeature }) => {
  const { last_value: lastValue, min, max } = deviceFeature;

  if (lastValue == null) {
    return <Text id="dashboard.boxes.devicesInRoom.noValue" />;
  }

  const level = getSignalQualityLevel(lastValue, min, max);
  return (
    <div class="d-flex flex-row-reverse">
      <SvgIcon icon={getSignalQualityIcon(level)} />
    </div>
  );
};

export default SignalQualityDeviceValue;
