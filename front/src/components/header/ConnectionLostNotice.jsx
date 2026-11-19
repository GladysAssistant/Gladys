import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import { isUrlInArray } from '../../utils/url';
import { canReloadApp } from '../../utils/connectionError';
import { PAGES_WITHOUT_HEADER } from './index';
import style from './style.css';

// A connection that drops and comes back within this delay is not worth a notice: a phone
// waking up, a Wi-Fi roaming, the reconnection of the socket
const GRACE_DELAY_MS = 4 * 1000;

// Displayed above every signed-in page while Gladys cannot be reached: the live connection
// (the websocket of the session, local or Gladys Plus) is lost, or the session check at
// load got no answer. Without it the app looks alive and is not: values stop moving,
// switches seem to work, and nothing says that Gladys is restarting or the Wi-Fi is gone.
//
// It only listens: `websocket.connected` is dispatched by the session, which owns the
// reconnection. The notice leaves as soon as the connection is back (after a failed session
// check: as soon as the check, run again, succeeds), and "Retry" reloads the app once
// Gladys answers again.
//
// Unlike the other notices of the header it does not live in the navigation rail: the rail
// is a closed drawer on a phone and does not exist on a full-screen dashboard, the two
// places where a wall tablet or a phone most needs to be told.
class ConnectionLostNotice extends Component {
  state = {
    websocketLost: false,
    checking: false,
    stillUnreachable: false
  };

  // An arrow function, and not a bound method: the dispatcher removes listeners by their
  // source text, and every bound function has the same one
  handleWebsocketConnected = ({ connected }) => {
    if (connected) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
      this.setState({ websocketLost: false, stillUnreachable: false });
      // The session check that got no answer left the app without its user: now that
      // Gladys is back it is run again, and clears the notice itself once it succeeds.
      // The session is already initialized, so this only loads what is missing.
      if (this.props.gladysUnreachable) {
        this.props.checkSession();
      }
      return;
    }
    // every failed attempt of a reconnection may dispatch the loss again: the delay runs
    // from the first one
    if (!this.graceTimer && !this.state.websocketLost) {
      this.graceTimer = setTimeout(() => {
        this.graceTimer = null;
        this.setState({ websocketLost: true });
      }, GRACE_DELAY_MS);
    }
  };

  listenTo = session => {
    if (session && session.dispatcher) {
      session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
    }
  };

  stopListeningTo = session => {
    if (session && session.dispatcher) {
      session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
    }
  };

  retry = async () => {
    if (this.state.checking) {
      return;
    }
    this.setState({ checking: true, stillUnreachable: false });
    const session = this.props.session;
    const reachable = await canReloadApp(this.props.httpClient);
    if (this.unmounted || session !== this.props.session) {
      return;
    }
    if (reachable) {
      // the reload re-reads everything: the pages that do not refresh on a reconnection
      // too. "checking" is left on, the button stays disabled until the page is replaced.
      window.location.reload();
      return;
    }
    this.setState({ checking: false, stillUnreachable: true });
  };

  componentDidMount() {
    this.listenTo(this.props.session);
  }

  componentWillReceiveProps(nextProps) {
    // signing out swaps the session of the store: the notice of the previous one goes
    // with it
    if (nextProps.session !== this.props.session) {
      this.stopListeningTo(this.props.session);
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
      this.setState({ websocketLost: false, checking: false, stillUnreachable: false });
      this.listenTo(nextProps.session);
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.stopListeningTo(this.props.session);
    clearTimeout(this.graceTimer);
  }

  render({ session, currentUrl, gladysUnreachable }, { websocketLost, checking, stillUnreachable }) {
    if (!websocketLost && !gladysUnreachable) {
      return null;
    }
    // the pages of someone who is not signed in say it themselves (the sign-in has its
    // own sentence), and a session that was closed has nothing to reconnect
    if (isUrlInArray(currentUrl, PAGES_WITHOUT_HEADER) || !session || !session.isConnected()) {
      return null;
    }
    return (
      <div class={style.connectionNotice} role="alert" data-cy="connection-lost-notice">
        <i class={cx('fe fe-wifi-off', style.connectionNoticeIcon)} />
        <div class={style.connectionNoticeBody}>
          <div class={style.connectionNoticeTitle}>
            <Text id="header.connectionNoticeTitle" />
          </div>
          <div class={style.connectionNoticeText} data-cy="connection-lost-notice-text">
            <Text id={stillUnreachable ? 'header.connectionNoticeStillUnreachable' : 'header.connectionNoticeText'} />
          </div>
        </div>
        <button
          type="button"
          class={style.connectionNoticeButton}
          onClick={this.retry}
          disabled={checking}
          data-cy="connection-lost-notice-retry"
        >
          <Text id={checking ? 'header.connectionNoticeChecking' : 'header.connectionNoticeRetry'} />
        </button>
      </div>
    );
  }
}

export default ConnectionLostNotice;
