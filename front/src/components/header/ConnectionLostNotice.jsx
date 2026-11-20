import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import config from '../../config';
import { isUrlInArray } from '../../utils/url';
import { isGladysReachable } from '../../utils/connectionError';
import { isPageReloadable } from '../../utils/reloadablePage';
import { setConnectionNoticeShown } from '../../utils/connectionNotice';
import { PAGES_WITHOUT_HEADER } from './index';
import style from './style.css';

// A connection that drops and comes back within this delay is not worth a notice: a phone
// waking up, a Wi-Fi roaming, the reconnection of the socket
const GRACE_DELAY_MS = 4 * 1000;
// While the notice is displayed, Gladys is asked whether it is there at this pace
const CHECK_INTERVAL_MS = 5 * 1000;
// Once Gladys answers again, how long the session is given to get its live connection back
// by itself before the page is reloaded for it
const RECONNECT_ALLOWANCE_MS = 20 * 1000;
// Set when the page was reloaded by the notice, removed once the app is healthy again: the
// notice never reloads twice for the same trouble (a proxy that lets the pages through and
// not the websocket would otherwise reload forever)
const AUTO_RELOAD_KEY = 'gladys-connection-notice-reloaded';

const hasReloadedAlready = () => {
  try {
    return window.sessionStorage.getItem(AUTO_RELOAD_KEY) !== null;
  } catch (e) {
    // no storage, no memory of a reload: never reload by itself
    return true;
  }
};

const rememberReload = () => {
  try {
    window.sessionStorage.setItem(AUTO_RELOAD_KEY, '1');
    return true;
  } catch (e) {
    return false;
  }
};

const forgetReload = () => {
  try {
    window.sessionStorage.removeItem(AUTO_RELOAD_KEY);
  } catch (e) {
    // nothing was remembered
  }
};

// Displayed on every signed-in page while the app cannot do its job: the live connection
// (the websocket of the session, local or Gladys Plus) is lost, or the session check at load
// got no answer. Without it the app looks alive and is not: values stop moving, switches
// seem to work, and nothing says that Gladys is restarting or the Wi-Fi is gone.
//
// The notice does not take the lost connection as the cause: it asks Gladys, when it
// appears and then every few seconds, and says what is true —
//
// - Gladys does not answer: "Gladys is unreachable", with "Retry";
// - Gladys answers and the page is still cut from it (a session that does not reconnect, a
//   proxy that does not let the websocket through, a page that loaded nothing because
//   Gladys was down): "Live updates are interrupted", with "Reload". A page that can be
//   reloaded without losing anything (utils/reloadablePage.js: a dashboard, on a wall
//   tablet nobody is in front of) is reloaded by the notice itself, once.
//
// It only listens to the session, which owns the reconnection: `websocket.connected` with
// `connected: true` removes the notice whatever it was saying, when the lost connection was
// its only cause. A session check that got no answer stays until the page is reloaded or a
// check succeeds: the live connection coming back does not bring what the page failed to load.
//
// Unlike the other notices of the header it does not live in the navigation rail: the rail
// is a closed drawer on a phone and does not exist on a full-screen dashboard, the two
// places where a wall tablet or a phone most needs to be told.
class ConnectionLostNotice extends Component {
  state = {
    // the live connection has been lost for longer than the grace delay
    websocketLost: false,
    // what Gladys said the last time it was asked: null until it was
    reachable: null,
    // a check asked by the user is running
    checking: false,
    // the user pressed "Retry" and Gladys still did not answer
    stillUnreachable: false
  };

  // since when Gladys has been answering without the page getting back to it
  reachableSince = null;

  // a check started by the timer is running
  checkInProgress = false;

  // the memory of a reload was dropped for the current healthy period
  reloadForgotten = false;

  // An arrow function, and not a bound method: the dispatcher removes listeners by their
  // source text, and every bound function has the same one
  handleWebsocketConnected = ({ connected }) => {
    this.websocketConnected = connected;
    if (connected) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
      this.setState({ websocketLost: false });
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

  // Something is wrong, on a page of someone who is signed in. The pages of someone who is
  // not say it themselves (the sign-in has its own sentence), and a session that was closed
  // has nothing to reconnect.
  isActive = (props = this.props, state = this.state) => {
    if (!state.websocketLost && !props.gladysUnreachable) {
      return false;
    }
    const { session } = props;
    return !isUrlInArray(props.currentUrl, PAGES_WITHOUT_HEADER) && Boolean(session) && session.isConnected();
  };

  // Asks Gladys whether it is there, and acts on the answer. `byUser` is "Retry" / "Reload".
  check = async ({ byUser = false } = {}) => {
    // one question at a time for the timer; a press on the button always gets its own
    // answer, unless it is already waiting for one
    if (byUser ? this.state.checking : this.checkInProgress) {
      return;
    }
    if (byUser) {
      this.setState({ checking: true, stillUnreachable: false });
    } else {
      this.checkInProgress = true;
    }
    // a press and the timer may ask at the same time: only the last question asked is
    // answered, an older answer would bring back what a newer one already said
    this.probeCount = (this.probeCount || 0) + 1;
    const probe = this.probeCount;
    const { session, currentUrl } = this.props;
    const reachable = await isGladysReachable();
    if (!byUser) {
      this.checkInProgress = false;
    }
    // the notice left, or belongs to another session, while Gladys was being asked
    if (this.unmounted || session !== this.props.session || !this.isActive()) {
      return;
    }
    if (probe !== this.probeCount) {
      if (byUser) {
        this.setState({ checking: false });
      }
      return;
    }
    // "Retry" reloads the page it was pressed on: after a move to another page meanwhile,
    // reloading would lose what was typed there
    if (byUser && reachable && currentUrl !== this.props.currentUrl) {
      this.setState({ reachable, checking: false, stillUnreachable: false });
      return;
    }
    if (reachable && this.reachableSince === null) {
      this.reachableSince = Date.now();
    } else if (!reachable) {
      this.reachableSince = null;
    }
    if (reachable && (byUser || this.shouldReloadByItself())) {
      // the reload re-reads everything: the pages that do not refresh on a reconnection
      // too. "checking" is left on, the button stays disabled until the page is replaced.
      if (!byUser && !rememberReload()) {
        this.setState({ reachable });
        return;
      }
      window.location.reload();
      return;
    }
    // "still not answering" stays for as long as it is true, whoever asks next. Only the
    // press that is waiting ends its wait: the timer answering first leaves the button
    // waiting, or a second press would start a second question.
    this.setState(({ stillUnreachable, checking }) => ({
      reachable,
      checking: byUser ? false : checking,
      stillUnreachable: !reachable && (byUser || stillUnreachable)
    }));
  };

  // Gladys answers and the page is still cut from it: reload it, if nothing can be lost and
  // if that was not tried already. A page that loaded while Gladys was down has nothing to
  // wait for; a lost live connection is first left to the session, which may be about to
  // get it back.
  shouldReloadByItself = () => {
    // Gladys Plus: the hosted front answering says nothing of the instance, and the socket
    // of Gladys Plus reconnects by itself — the user decides
    if (config.gatewayMode || !isPageReloadable() || hasReloadedAlready()) {
      return false;
    }
    return this.props.gladysUnreachable || Date.now() - this.reachableSince >= RECONNECT_ALLOWANCE_MS;
  };

  retry = () => this.check({ byUser: true });

  startChecking = () => {
    clearInterval(this.checkInterval);
    this.reachableSince = null;
    this.check();
    this.checkInterval = setInterval(this.check, CHECK_INTERVAL_MS);
  };

  stopChecking = () => {
    clearInterval(this.checkInterval);
    this.checkInterval = null;
    this.reachableSince = null;
    this.setState({ reachable: null, checking: false, stillUnreachable: false });
  };

  // The app works again — its live connection is up and it knows its user: a next trouble
  // may reload the page again
  forgetReloadIfHealthy = () => {
    const { user, gladysUnreachable } = this.props;
    const healthy = Boolean(this.websocketConnected && !gladysUnreachable && user && user.id);
    if (healthy && !this.reloadForgotten) {
      forgetReload();
    }
    this.reloadForgotten = healthy;
  };

  componentDidMount() {
    this.listenTo(this.props.session);
    setConnectionNoticeShown(this.isActive());
    if (this.isActive()) {
      this.startChecking();
    }
  }

  componentWillReceiveProps(nextProps) {
    // signing out swaps the session of the store: the notice of the previous one goes
    // with it
    if (nextProps.session !== this.props.session) {
      this.stopListeningTo(this.props.session);
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
      this.websocketConnected = undefined;
      this.setState({ websocketLost: false });
      this.listenTo(nextProps.session);
    }
  }

  componentDidUpdate(previousProps, previousState) {
    const wasActive = this.isActive(previousProps, previousState);
    const isActive = this.isActive();
    setConnectionNoticeShown(isActive);
    if (isActive && !wasActive) {
      this.startChecking();
    } else if (!isActive && this.checkInterval) {
      // on the interval it owns, not on the previous props: signing out empties the
      // session object in place, so the previous props already read as inactive
      this.stopChecking();
    }
    this.forgetReloadIfHealthy();
  }

  componentWillUnmount() {
    this.unmounted = true;
    setConnectionNoticeShown(false);
    this.stopListeningTo(this.props.session);
    clearTimeout(this.graceTimer);
    clearInterval(this.checkInterval);
  }

  render({ gladysUnreachable }, { reachable, checking, stillUnreachable }) {
    if (!this.isActive()) {
      return null;
    }
    // A lost connection says nothing before Gladys was asked. A session check that got no
    // answer does: Gladys was unreachable a moment ago.
    if (reachable === null && !gladysUnreachable) {
      return null;
    }
    const interrupted = reachable === true;
    let textId = 'header.connectionNoticeText';
    if (interrupted) {
      textId = 'header.connectionNoticeInterruptedText';
    } else if (stillUnreachable) {
      textId = 'header.connectionNoticeStillUnreachable';
    }
    let buttonId = interrupted ? 'header.connectionNoticeReload' : 'header.connectionNoticeRetry';
    if (checking) {
      buttonId = 'header.connectionNoticeChecking';
    }
    return (
      <div
        class={cx(style.connectionNotice, { [style.connectionNoticeInterrupted]: interrupted })}
        role="status"
        data-cy="connection-lost-notice"
        data-state={interrupted ? 'interrupted' : 'unreachable'}
      >
        <i class={cx('fe', interrupted ? 'fe-refresh-cw' : 'fe-wifi-off', style.connectionNoticeIcon)} />
        <div class={style.connectionNoticeBody}>
          <div class={style.connectionNoticeTitle} data-cy="connection-lost-notice-title">
            <Text id={interrupted ? 'header.connectionNoticeInterruptedTitle' : 'header.connectionNoticeTitle'} />
          </div>
          <div class={style.connectionNoticeText} data-cy="connection-lost-notice-text">
            <Text id={textId} />
          </div>
        </div>
        {/* aria-disabled, not disabled: a disabled button loses the keyboard focus, which
            would fall back to the top of the page each time Gladys is asked */}
        <button
          type="button"
          class={style.connectionNoticeButton}
          onClick={this.retry}
          aria-disabled={checking ? 'true' : 'false'}
          data-cy="connection-lost-notice-retry"
        >
          <Text id={buttonId} />
        </button>
      </div>
    );
  }
}

export default ConnectionLostNotice;
