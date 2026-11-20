import { ERROR_MESSAGES, WEBSOCKET_MESSAGE_TYPES } from '../../../server/utils/constants';
import config from '../config';
import { Dispatcher } from './Dispatcher';
import { hasPasswordFields, omitPasswordFields } from './omitPasswordFields';

// Delay before the first reconnection attempt, doubled after each failed attempt
const RECONNECT_FIRST_DELAY_MS = 1000;
// ...up to this cap. It is what a page waits, at most, once Gladys answers again after a long
// stop (an update, a reboot of the machine): for a client next to its server an attempt that
// fails is one refused connection, so it can stay short.
const RECONNECT_MAX_DELAY_MS = 10 * 1000;
// Every delay is spread by this share, more or less: all the screens of a house lose Gladys at
// the same instant, and would otherwise come back, renew their token and reload their widgets
// in the same second, on a machine that has just started.
const RECONNECT_JITTER = 0.2;
// After Gladys refused to renew the access token, the next attempt waits this long: the app
// has been told, and is taking the user where they have to go (see SESSION_REFUSED_EVENT)
const RECONNECT_AFTER_REFUSAL_DELAY_MS = 30 * 1000;
// A connection that is still not open after this long is given up and tried again: on a
// machine that is rebooting nothing answers, and the browser would wait far longer by itself
const CONNECTION_TIMEOUT_MS = 10 * 1000;
// The close code of a socket whose access token was refused (server/api/websockets/index.js)
const INVALID_ACCESS_TOKEN_CLOSE_CODE = 4000;

// Dispatched when Gladys refuses to renew the access token: the session was revoked or has
// expired, or the tablet is locked. The app answers by running its session check again, which
// sends the user to the sign-in page or to the keypad (components/app.jsx).
const SESSION_REFUSED_EVENT = 'session.refused';
// Dispatched when the session is closed on purpose (sign-out, session refused): its connection
// is not lost, and will not come back by itself. For what displays the state of the connection.
const SESSION_CLOSED_EVENT = 'session.closed';

class Session {
  constructor() {
    this.user = null;
    this.profilePicture = null;
    this.initialized = false;
    this.dispatcher = new Dispatcher();
    // true while the current socket is authenticated
    this.websocketConnected = false;
    // true from the moment the connection is known to be down ('websocket.connected' false
    // was dispatched) until it is authenticated again
    this.connectionLost = false;
    this.ws = null;
    // the access token the current socket authenticates with
    this.wsAccessToken = null;
    // true once the current socket has sent its access token
    this.wsAuthenticationSent = false;
    // number of reconnection attempts since the last authenticated connection
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.connectionTimer = null;
    // the server refused the access token of the last socket: get a new one before the next
    this.accessTokenRefused = false;
    // number of access tokens refused in a row
    this.accessTokenRefusals = 0;
    // how many times the session was closed: what was started before must not go on after
    this.resetCount = 0;
    this.reconnectNow = this.reconnectNow.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
  }

  setRefreshAccessTokenFunction(func) {
    this.refreshAccessToken = func;
  }

  init() {
    if (this.initialized) {
      return null;
    }
    const user = this.getUser();
    if (user && this.user.access_token) {
      this.connect();
      this.initialized = true;
    }
  }

  reset() {
    // a closed session keeps nothing running: neither its socket, which would stay
    // authenticated on the server, nor a reconnection in progress
    this.stopListeningToBrowser();
    this.clearReconnectTimer();
    this.closeSocket();
    this.websocketConnected = false;
    this.connectionLost = false;
    this.reconnectAttempts = 0;
    this.accessTokenRefused = false;
    this.accessTokenRefusals = 0;
    // what was started before (a renewal of the access token waiting for its answer, above
    // all) compares this count, and leaves the session alone when it has changed: a session
    // that was closed must not get a token back, nor a socket
    this.resetCount += 1;
    this.user = null;
    this.profilePicture = null;
    this.initialized = false;
    localStorage.clear();
    // the same session object may be signed in again later (the session check resets it
    // without replacing it): whoever displays a lost connection must forget it
    this.dispatch(SESSION_CLOSED_EVENT);
  }

  // A listener that throws must never stop what the session was doing — the reconnection
  // above all, which would leave the page without live data for good
  dispatch(event, details) {
    try {
      this.dispatcher.dispatch(event, details);
    } catch (e) {
      console.error(e);
    }
  }

  isConnected() {
    return this.user !== null;
  }

  // Opens the websocket and authenticates on it. From then on the session keeps it open: a
  // connection that closes, or that cannot be opened, is tried again until it is back (see
  // scheduleReconnect), which is what brings a page back to life after Gladys restarted.
  // Calling it again is safe: a socket that is already using the current access token is kept,
  // any other one is replaced.
  connect() {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      return;
    }
    this.clearReconnectTimer();
    if (this.ws && this.wsAccessToken === accessToken) {
      // already connecting or connected with this token (a page whose requests all refreshed
      // the token at the same time ends up here several times in a row)
      return;
    }
    if (this.ws && this.websocketConnected) {
      // the socket being replaced was live: what happens until the new one is authenticated
      // is missed, so the components showing live data are told, and reload afterwards
      this.markConnectionLost();
    }
    this.closeSocket();
    this.listenToBrowser();
    this.accessTokenRefused = false;

    const websocketUrl = config.webSocketUrl || window.location.origin.replace('http', 'ws');
    const ws = new WebSocket(websocketUrl);
    this.ws = ws;
    this.wsAccessToken = accessToken;
    this.wsAuthenticationSent = false;
    this.connectionTimer = setTimeout(() => {
      // still not open: give this attempt up, as if the socket had closed by itself
      this.onSocketClosed(ws, {});
    }, CONNECTION_TIMEOUT_MS);
    ws.onopen = () => {
      // a socket that was replaced has nothing more to say
      if (ws !== this.ws) {
        return;
      }
      clearTimeout(this.connectionTimer);
      ws.send(
        JSON.stringify({
          type: 'authenticate.request',
          payload: {
            accessToken
          }
        })
      );
      this.wsAuthenticationSent = true;
    };
    ws.onmessage = e => {
      if (ws !== this.ws) {
        return;
      }
      const { data } = e;
      const { type, payload } = JSON.parse(data);
      // Only dispatch connected websocket message in case we are authenticated
      if (type === WEBSOCKET_MESSAGE_TYPES.AUTHENTICATION.CONNECTED) {
        this.websocketConnected = true;
        this.connectionLost = false;
        this.reconnectAttempts = 0;
        this.accessTokenRefusals = 0;
        this.dispatch('websocket.connected', { connected: true });
      }
      this.dispatcher.dispatch(type, payload);
    };
    ws.onerror = e => {
      console.error('Error', e);
    };
    ws.onclose = e => {
      this.onSocketClosed(ws, e);
    };
  }

  // The socket closed without the session asking for it (Gladys stopped or restarted, the
  // network dropped, the access token was refused...), or could not be opened at all.
  onSocketClosed(ws, e) {
    // A socket the session closed itself, or already replaced, must not start anything
    if (ws !== this.ws) {
      return;
    }
    console.error(e);
    // Gladys closes a socket whose access token it refuses with a code and a reason of its
    // own. Something on the way (a reverse proxy, the browser) may drop them: a socket that
    // closes after it sent its token, and before Gladys accepted it, is taken for a refusal
    // too. If it was not one, renewing the token costs one request, and fails by itself when
    // Gladys is simply gone. Without this the same dead token would be sent again forever.
    const closedWhileAuthenticating = this.wsAuthenticationSent && !this.websocketConnected;
    this.accessTokenRefused =
      e.reason === ERROR_MESSAGES.INVALID_ACCESS_TOKEN ||
      e.code === INVALID_ACCESS_TOKEN_CLOSE_CODE ||
      closedWhileAuthenticating;
    this.closeSocket();
    // the next attempt is planned before anyone is told: whatever a listener does, the
    // reconnection goes on
    this.scheduleReconnect();
    this.markConnectionLost();
  }

  // Lets go of the current socket, if any, so that nothing it does afterwards (its closing
  // included) is taken for the connection of the session
  closeSocket() {
    clearTimeout(this.connectionTimer);
    this.connectionTimer = null;
    const ws = this.ws;
    this.ws = null;
    this.wsAccessToken = null;
    this.wsAuthenticationSent = false;
    this.websocketConnected = false;
    if (ws && ws.close) {
      ws.close();
    }
  }

  // Tells the components showing live data that the connection is down, once per outage:
  // the attempts that fail afterwards are the same outage
  markConnectionLost() {
    this.websocketConnected = false;
    if (!this.connectionLost) {
      this.connectionLost = true;
      this.dispatch('websocket.connected', { connected: false });
    }
  }

  clearReconnectTimer() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  // Plans the next attempt: after about 1 second, then 2, 4, 8 and every 10 seconds, for as
  // long as it takes. afterRefusedRenewal: Gladys has just refused to renew the access token.
  scheduleReconnect({ afterRefusedRenewal = false } = {}) {
    this.clearReconnectTimer();
    let delay;
    if (afterRefusedRenewal) {
      delay = RECONNECT_AFTER_REFUSAL_DELAY_MS;
    } else if (this.accessTokenRefused && this.accessTokenRefusals === 0) {
      // Gladys is there and answers: the token is the usual expired one, or one from before a
      // restart, and it is renewed right away. Refused again with a new token, it waits like
      // any other attempt.
      delay = 0;
    } else {
      const backoff = Math.min(
        RECONNECT_FIRST_DELAY_MS * 2 ** Math.min(this.reconnectAttempts, 10),
        RECONNECT_MAX_DELAY_MS
      );
      delay = Math.round(backoff * (1 - RECONNECT_JITTER + 2 * RECONNECT_JITTER * Math.random()));
    }
    if (this.accessTokenRefused) {
      this.accessTokenRefusals += 1;
    }
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => this.reconnect(), delay);
  }

  async reconnect() {
    this.clearReconnectTimer();
    // the session was closed in the meantime, or is already connecting again
    if (!this.user || this.ws) {
      return;
    }
    if (!this.accessTokenRefused) {
      this.connect();
      return;
    }
    const { resetCount } = this;
    try {
      // without a refresh token there is nothing to renew the access token with: Gladys could
      // only refuse
      if (!this.getRefreshToken()) {
        throw Object.assign(new Error('NO_REFRESH_TOKEN'), { response: { status: 401 } });
      }
      delete this.user.access_token;
      this.saveUser(this.user);
      // gets a new access token, then calls connect()
      await this.refreshAccessToken();
    } catch (e) {
      console.error(e);
      // the session was closed while the token was being renewed, or something else
      // connected in the meantime
      if (this.resetCount !== resetCount || this.ws || this.reconnectTimer) {
        return;
      }
      const status = e && e.response && e.response.status;
      if (status === 400 || status === 401 || status === 403) {
        // Gladys answers, and refuses to renew the token: the session was revoked or has
        // expired, or the tablet is locked. Trying again at once would get the same answer,
        // and nothing else tells the page: without a word it would stay as it is, frozen, for
        // good. The app is told, and takes the user to the sign-in page or to the keypad,
        // which closes this session or connects it again. Should the app not get that far
        // (Gladys gone again in the meantime), the next attempt asks once more, later.
        this.scheduleReconnect({ afterRefusedRenewal: true });
        this.dispatch(SESSION_REFUSED_EVENT);
        return;
      }
      // Gladys could not be reached (no answer, or the error page of a reverse proxy whose
      // backend is down): same outage, try again later
      this.scheduleReconnect();
    }
  }

  // The browser is back on the network, or the page is back on screen: no need to wait for
  // the end of the current delay to try again
  reconnectNow() {
    if (this.reconnectTimer) {
      this.reconnect();
      return;
    }
    if (this.ws && !this.websocketConnected) {
      // an attempt is under way, and may be hanging on a network that was not there (it would
      // only be given up after CONNECTION_TIMEOUT_MS): a new one is started on the network
      // that has just come back
      this.closeSocket();
      this.reconnect();
    }
  }

  onVisibilityChange() {
    if (!document.hidden) {
      this.reconnectNow();
    }
  }

  listenToBrowser() {
    // adding the same listener twice is a no-op
    window.addEventListener('online', this.reconnectNow);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  stopListeningToBrowser() {
    window.removeEventListener('online', this.reconnectNow);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  getUser() {
    if (this.user) {
      return this.user;
    }
    const data = localStorage.getItem('user');
    if (data) {
      const user = JSON.parse(data);
      if (hasPasswordFields(user)) {
        // older versions of the profile page stored the new password here
        this.saveUser(user);
      } else {
        this.user = user;
      }
    }
    return this.user;
  }

  setTabletModeCurrentHouseSelector(houseSelector) {
    if (houseSelector) {
      localStorage.setItem('current_house_selector', houseSelector);
    } else {
      localStorage.removeItem('current_house_selector');
    }
  }

  getTabletModeCurrentHouseSelector() {
    return localStorage.getItem('current_house_selector');
  }

  getRefreshToken() {
    const user = this.getUser();
    if (user) {
      return user.refresh_token;
    }
    return null;
  }

  getAccessToken() {
    const user = this.getUser();
    if (user) {
      return user.access_token;
    }
    return null;
  }

  setAccessToken(accessToken) {
    // a session that was closed has no user: a renewal answered too late must not create one
    if (!this.user) {
      return;
    }
    const newUser = Object.assign({}, this.user, {
      access_token: accessToken
    });
    this.saveUser(newUser);
  }

  getProfilePicture() {
    if (this.profilePicture) {
      return this.profilePicture;
    }
    const data = localStorage.getItem('profile_picture');
    if (data) {
      this.profilePicture = data;
    }

    return this.profilePicture;
  }

  saveUser(user) {
    const mergedUser = omitPasswordFields(Object.assign({}, this.user, user));
    this.user = mergedUser;
    localStorage.setItem('user', JSON.stringify(mergedUser));
  }

  saveProfilePicture(profilePicture) {
    this.profilePicture = profilePicture;
    localStorage.setItem('profile_picture', profilePicture);
  }
}

export { Session, SESSION_REFUSED_EVENT, SESSION_CLOSED_EVENT };
