import cx from 'classnames';

import style from './kit.css';

/**
 * @description The switch of the phone pages (52 × 32px in a 60 × 44px target): a real button
 * with role="switch". `label` (a string) names it when the row it sits in is not its label.
 */
const MobileSwitch = ({ checked, onChange, disabled, label, dataCy, ...props }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked ? 'true' : 'false'}
    aria-label={label}
    class={style.switchButton}
    onClick={() => onChange(!checked)}
    disabled={disabled}
    data-cy={dataCy}
    {...props}
  >
    <span class={cx(style.switchTrack, { [style.switchTrackOn]: checked })}>
      <span class={style.switchKnob} />
    </span>
  </button>
);

export default MobileSwitch;
