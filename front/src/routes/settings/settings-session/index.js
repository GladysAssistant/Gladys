import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SessionPage from './SessionsPage';
import MobileSessionsPage from './MobileSessionsPage';
import { withMobileViewport } from '../../../components/mobile';
import actions from '../../../actions/session';

class SettingsSessions extends Component {
  componentWillMount() {
    this.props.getSessions();
  }

  // On a phone the sessions are rows with a confirmed revocation
  // (docs/specs/mobile-pages/settings-pages.md, B): same props, same actions
  render({ isMobile, ...props }, {}) {
    if (isMobile) {
      return <MobileSessionsPage {...props} />;
    }
    return <SessionPage {...props} />;
  }
}

export default connect(
  'user,session,sessions,sessionsGetStatus,sessionsRevokeStatus',
  actions
)(withMobileViewport(SettingsSessions));
