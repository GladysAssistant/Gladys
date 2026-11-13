import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import { USER_ROLE } from '../../../../server/utils/constants';
import ClockOffsetText from '../clock/ClockOffsetText';
import style from './style.css';

// Displayed on every page while the clock of the server running Gladys is
// significantly off the clock of this device (see utils/clock.js): scheduled
// scenes, history and energy all depend on it, and nothing else tells the
// user why they misbehave. The admin gets the way to diagnose and fix it.
// Only mounted while the gap exists (see the header): the visibility
// listener below then lives exactly as long as this notice does.
class ClockOffsetNotice extends Component {
  // the clock is fixed on the server, outside of this tab: coming back to
  // the tab is the moment to check whether the notice still holds
  handleVisibilityChange = () => {
    if (!document.hidden) {
      this.props.refreshClockOffsetState();
    }
  };

  componentDidMount() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  render({ clockOffset, user }) {
    return (
      <div class={cx(style.updateNoticeCard, style.subscriptionNoticeCard)} data-cy="clock-offset-notice">
        <div class={style.updateNoticeTitle}>
          <i class={cx('fe fe-clock', style.subscriptionNoticeIcon)} />
          <span>
            <Text id="header.clockNoticeTitle" />
          </span>
        </div>
        <div class={style.updateNoticeText}>
          <ClockOffsetText offset={clockOffset} /> <Text id="header.clockNoticeText" />
        </div>
        {user.role === USER_ROLE.ADMIN ? (
          <a href="/dashboard/settings/system" class={style.updateNoticeCta}>
            <Text id="header.clockNoticeButton" />
          </a>
        ) : (
          <div class={style.updateNoticeText}>
            <Text id="header.clockNoticeContactAdmin" />
          </div>
        )}
      </div>
    );
  }
}

export default ClockOffsetNotice;
