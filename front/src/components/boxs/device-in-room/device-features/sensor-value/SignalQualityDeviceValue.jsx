import { Text } from 'preact-i18n';

const SignalQualityDeviceValue = ({ deviceFeature }) => {
  const { last_value: lastValue, min, max } = deviceFeature;

  if (lastValue == null) {
    return <Text id="dashboard.boxes.devicesInRoom.noValue" />;
  }

  const ratio = Math.round(((lastValue - min) * 5) / (max - min));
  return (
    <div class="d-flex flex-row-reverse">
      <div class={`gi gi-antenna-bars-${ratio}`} />
    </div>
  );
};

export default SignalQualityDeviceValue;
