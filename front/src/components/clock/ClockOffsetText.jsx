import { Text } from 'preact-i18n';
import { describeClockOffset } from '../../utils/clock';

// "Gladys's clock is 3 hours ahead of this device.", shared by the sidebar
// notice and the clock card of the System settings.
const ClockOffsetText = ({ offset }) => {
  const { direction, unit, count } = describeClockOffset(offset);
  return <Text id={`clock.${direction}.${unit}`} plural={count} fields={{ count }} />;
};

export default ClockOffsetText;
