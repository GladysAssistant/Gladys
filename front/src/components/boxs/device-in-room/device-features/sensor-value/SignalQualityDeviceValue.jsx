import { Text } from 'preact-i18n';

const SIGNAL_QUALITY_ICONS = {
  off: 'signal-zero',
  0: 'signal-zero',
  1: 'signal-zero',
  2: 'signal-low',
  3: 'signal-medium',
  4: 'signal-high',
  5: 'signal',
};

const SignalQualityDeviceValue = ({ deviceFeature }) => {
  const { last_value: lastValue, min, max } = deviceFeature;

  if (lastValue == null) {
    return <Text id="dashboard.boxes.devicesInRoom.noValue" />;
  }

  const ratio = Math.round(((lastValue - min) * 5) / (max - min));
  const iconName = SIGNAL_QUALITY_ICONS[ratio] || SIGNAL_QUALITY_ICONS.off;

  return (
    <div class="d-flex flex-row-reverse">
      <i class={`icon-${iconName}`} />
    </div>
  );
};

export default SignalQualityDeviceValue;
