import { Text } from 'preact-i18n';
import cx from 'classnames';

import { CONTAMINATION_STATE } from '../../../../../../../server/utils/constants';

// A contaminated sensing chamber blinds the detector: the badge turns orange as soon as dirt
// is detected, and red when the detector can no longer be trusted and must be cleaned or
// replaced.
const SmokeSensorContaminationDeviceValue = props => {
  const { last_value: lastValue = null } = props.deviceFeature;
  const valued = lastValue !== null;
  const critical = lastValue === CONTAMINATION_STATE.CRITICAL;
  const contaminated = lastValue === CONTAMINATION_STATE.LOW || lastValue === CONTAMINATION_STATE.WARNING;
  const normal = lastValue === CONTAMINATION_STATE.NORMAL;

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
        <Text id={`deviceFeatureValue.category.smoke-sensor.contamination-state.${lastValue}`}>
          <Text
            id={`deviceFeatureValue.category.smoke-sensor.contamination-state.unknown`}
            fields={{ value: lastValue }}
          />
        </Text>
      )}
    </span>
  );
};

export default SmokeSensorContaminationDeviceValue;
