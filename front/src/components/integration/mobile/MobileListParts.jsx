import { Text } from 'preact-i18n';
import cx from 'classnames';

import { MobilePill, MobileNotice, kitStyle } from '../../mobile';
import { getBatteryTone } from './utils';
import style from './style.css';

/**
 * @description The battery of a device as a pill: its level in figures, and the color of the
 * desktop badge.
 */
const BatteryPill = ({ level }) => (
  <MobilePill tone={getBatteryTone(level)} data-cy="integration-device-battery">
    <i class="fe fe-battery" aria-hidden="true" />
    <Text id="global.percentValue" fields={{ value: level }} />
  </MobilePill>
);

/**
 * @description The list of a tab while it loads: the spinner of the desktop card, over the rows
 * already there or over an empty block.
 */
const MobileListLoader = ({ loading, empty, children }) => (
  <div class={cx('dimmer', { active: loading })}>
    <div class="loader" />
    <div class={cx('dimmer-content', { [style.loading]: loading && empty })}>{children}</div>
  </div>
);

/**
 * @description A notice that waits for something (a scan running): a spinner in place of its
 * icon.
 */
const MobileWaitingNotice = ({ children, ...props }) => (
  <div class={kitStyle.notice} role="status" {...props}>
    <span class={style.noticeSpinner} aria-hidden="true" />
    <div class={kitStyle.noticeBody}>{children}</div>
  </div>
);

/**
 * @description A long explanation of the desktop card (an alert with links), kept as it is
 * written inside a notice of the kit.
 */
const MobileTextNotice = ({ children, ...props }) => (
  <MobileNotice {...props}>
    <div class={style.noticeText}>{children}</div>
  </MobileNotice>
);

/**
 * @description A progress bar (a synchronization running): the native element, so its value
 * needs no inline style.
 */
const MobileProgress = ({ value, label }) => (
  <progress class={style.progress} value={value} max="100" aria-label={label} />
);

export { BatteryPill, MobileListLoader, MobileWaitingNotice, MobileTextNotice, MobileProgress };
