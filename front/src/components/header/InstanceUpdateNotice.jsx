import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { USER_ROLE } from '../../../../server/utils/constants';
import { getFrontVersion, isUpdateNoticeDismissed, dismissUpdateNotice } from '../../utils/instanceVersion';
import style from './style.css';

// Displayed on Gladys Plus when the hosted front is on a newer release than
// the local instance (Watchtower can take up to ~24h to pull it): explains
// why things may misbehave, and offers the one-click fix to the admin.
// Only mounted while the mismatch exists (see the header): the visibility
// listener below then lives exactly as long as this notice does.
class InstanceUpdateNotice extends Component {
  // Watchtower resolves the mismatch on its own, and the update button opens
  // another page: coming back to the tab is the moment the instance may just
  // have been updated, and the moment this notice must re-check itself
  // instead of keep warning.
  handleVisibilityChange = () => {
    if (!document.hidden) {
      this.props.refreshInstanceVersionState();
    }
  };

  componentDidMount() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  dismiss = () => {
    dismissUpdateNotice(this.props.instanceVersion);
    // the dismissal lives in localStorage: this empty setState only forces
    // the re-render that reads it back and hides the notice
    this.setState({});
  };

  render({ instanceVersion, user }) {
    if (isUpdateNoticeDismissed(instanceVersion)) {
      return null;
    }
    return (
      <div class={style.updateNoticeCard} data-cy="instance-update-notice">
        <Localizer>
          <button
            type="button"
            class={style.updateNoticeDismiss}
            onClick={this.dismiss}
            aria-label={<Text id="header.instanceUpdateNoticeDismiss" />}
          >
            <i class="fe fe-x" />
          </button>
        </Localizer>
        <div class={style.updateNoticeTitle}>
          <i class={cx('fe fe-arrow-up-circle', style.updateNoticeIcon)} />
          <span>
            <Text id="header.instanceUpdateNoticeTitle" />
          </span>
        </div>
        <div class={style.updateNoticeText}>
          <Text
            id="header.instanceUpdateNoticeText"
            fields={{ latestVersion: `v${getFrontVersion()}`, instanceVersion }}
          />
        </div>
        {user.role === USER_ROLE.ADMIN && (
          <a href="/dashboard/settings/system" class={style.updateNoticeCta}>
            <Text id="header.instanceUpdateNoticeButton" />
          </a>
        )}
      </div>
    );
  }
}

export default InstanceUpdateNotice;
