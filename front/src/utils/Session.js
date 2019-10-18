import { ERROR_MESSAGES } from '../../../server/utils/constants';
import config from '../../config';
import { Dispatcher } from './Dispatcher';

class Session {
  constructor() {
    this.user = null;
    this.profilePicture = null;
    this.initialized = false;
    this.dispatcher = new Dispatcher();
    this.websocketConnected = false;
    this.ws = null;
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
    this.user = null;
    this.profilePicture = null;
    this.initialized = false;
    localStorage.clear();
  }

  isConnected() {
    return this.user !== null;
  }

  connect() {
    console.log('Trying to connect...');
    const websocketUrl = config.webSocketUrl || window.location.origin.replace('http', 'ws');
    this.ws = new WebSocket(websocketUrl);
    this.ws.onopen = () => {
      console.log('Connected!');
      this.websocketConnected = true;
      this.ws.send(
        JSON.stringify({
          type: 'authenticate.request',
          payload: {
            accessToken: this.user.access_token
          }
        })
      );
      this.ws.onmessage = e => {
        const { data } = e;
        const { type, payload } = JSON.parse(data);
        this.dispatcher.dispatch(type, payload);
      };
    };
    this.ws.onerror = e => {
      console.log('Error', e);
    };
    this.ws.onclose = e => {
      console.log(e);
      console.log('disconnected');
      this.websocketConnected = false;
      if (e.reason === ERROR_MESSAGES.INVALID_ACCESS_TOKEN) {
        delete this.user.access_token;
        this.saveUser(this.user);
      } else {
        setTimeout(() => {
          this.connect();
        }, 1000);
      }
    };
  }

  getUser() {
    if (this.user) {
      return this.user;
    }
    const data = localStorage.getItem('user');
    if (data) {
      this.user = JSON.parse(data);
    }
    return this.user;
  }

  getRefreshToken() {
    if (this.user) {
      return this.user.refresh_token;
    }
    return null;
  }

  getAccessToken() {
    if (this.user) {
      return this.user.access_token;
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
    const mergedUser = Object.assign({}, this.user, user);
    this.user = mergedUser;
    localStorage.setItem('user', JSON.stringify(mergedUser));
  }

  saveProfilePicture(profilePicture) {
    this.profilePicture = profilePicture;
    localStorage.setItem('profile_picture', profilePicture);
  }
}

export { Session };
