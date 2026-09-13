import { Text } from 'preact-i18n';
import cx from 'classnames';

import { SMOKE_CHAMBER_CONTAMINATION } from '../../../../../../../server/utils/constants';

// A contaminated smoke chamber blinds the detector: the badge turns orange as soon as dirt is
// detected, and red when the detector can no longer be trusted and must be cleaned or replaced.
const SmokeSensorChamberContaminationDeviceValue = props => {
  const { last_value: lastValue = null } = props.deviceFeature;
  const valued = lastValue !== null;
  const critical = lastValue === SMOKE_CHAMBER_CONTAMINATION.CRITICAL;
  const contaminated =
    lastValue === SMOKE_CHAMBER_CONTAMINATION.LIGHT || lastValue === SMOKE_CHAMBER_CONTAMINATION.MEDIUM;
  const normal = lastValue === SMOKE_CHAMBER_CONTAMINATION.NORMAL;

  return (
    <span
      class={cx('badge', {
        'bg-danger': critical,
        'bg-warning': contaminated,
        'bg-success': normal,
        'bg-primary': valued && !critical && !contaminated && !normal,
        'bg-secondary': !valued
      })}
    >
      {!valued && <Text id="dashboard.boxes.devicesInRoom.noValue" />}
      {valued && (
        <Text id={`deviceFeatureValue.category.smoke-sensor.chamber-contamination.${lastValue}`}>
          <Text
            id={`deviceFeatureValue.category.smoke-sensor.chamber-contamination.unknown`}
            fields={{ value: lastValue }}
          />
        </Text>
      )}
    </span>
  );
};

export default SmokeSensorChamberContaminationDeviceValue;
