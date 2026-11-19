import { ERROR_MESSAGES, WEBSOCKET_MESSAGE_TYPES } from '../../../server/utils/constants';
import config from '../config';
import { Dispatcher } from './Dispatcher';
import { hasPasswordFields, omitPasswordFields } from './omitPasswordFields';

// Delay before the first reconnection attempt, doubled after each failed attempt
const RECONNECT_FIRST_DELAY_MS = 1000;
// ...up to this cap: a Gladys that takes minutes to come back (update, reboot of the machine)
// is found again within half a minute, without hammering the network in the meantime
const RECONNECT_MAX_DELAY_MS = 30 * 1000;
// A connection that is still not open after this long is given up and tried again: on a
// machine that is rebooting nothing answers, and the browser would wait far longer by itself
const CONNECTION_TIMEOUT_MS = 10 * 1000;

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
    this.resetCount += 1;
    this.user = null;
    this.profilePicture = null;
    this.initialized = false;
    localStorage.clear();
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
        this.dispatcher.dispatch('websocket.connected', { connected: true });
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
    this.closeSocket();
    this.accessTokenRefused = e.reason === ERROR_MESSAGES.INVALID_ACCESS_TOKEN;
    this.markConnectionLost();
    this.scheduleReconnect();
  }

  // Lets go of the current socket, if any, so that nothing it does afterwards (its closing
  // included) is taken for the connection of the session
  closeSocket() {
    clearTimeout(this.connectionTimer);
    this.connectionTimer = null;
    const ws = this.ws;
    this.ws = null;
    this.wsAccessToken = null;
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
      this.dispatcher.dispatch('websocket.connected', { connected: false });
    }
  }

  clearReconnectTimer() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  // Plans the next attempt: after 1 second, then 2, 4... up to 30 seconds, for as long as it
  // takes.
  scheduleReconnect() {
    this.clearReconnectTimer();
    let delay = Math.min(RECONNECT_FIRST_DELAY_MS * 2 ** Math.min(this.reconnectAttempts, 10), RECONNECT_MAX_DELAY_MS);
    if (this.accessTokenRefused) {
      // Gladys is there and answers: the token is the usual expired one, or one from before a
      // restart, and it is renewed right away. Refused again with a new token, it waits like
      // any other attempt.
      if (this.accessTokenRefusals === 0) {
        delay = 0;
      }
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
      if (status === 401 || status === 403) {
        // Gladys refuses to renew the token (session revoked or expired, tablet locked):
        // trying again would get the same answer. The next API call fails the same way and
        // sends the user where they have to go (login, locked page), and connect() is called
        // again once a token is there.
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

export { Session };
