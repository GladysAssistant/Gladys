import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './kit.css';

/**
 * @description Where the user is in a flow of several screens (onboarding, contract wizard):
 * "Step 2 of 4 · Preferences" above a segmented progress bar. `current` starts at 1.
 */
const MobileSteps = ({ current, total, label }) => (
  <div class={style.steps} role="group" aria-roledescription="progress">
    <div class={style.stepsLabel} data-cy="mobile-steps-label">
      <Text id="mobileKit.stepOf" fields={{ current, total }} />
      {label && ' · '}
      {label}
    </div>
    <div class={style.stepsTrack} aria-hidden="true">
      {Array.from({ length: total }, (unused, index) => (
        <span key={index} class={cx(style.stepsSegment, { [style.stepsSegmentDone]: index < current })} />
      ))}
    </div>
  </div>
);

export default MobileSteps;
