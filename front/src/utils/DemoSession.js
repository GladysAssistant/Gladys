import { Dispatcher } from './Dispatcher';

class DemoSession {
  constructor() {
    this.user = null;
    this.profilePicture = null;
    this.initialized = false;
    this.dispatcher = new Dispatcher();
  }

  init() {}

  reset() {}

  isConnected() {
    return true;
  }

  connect() {}

  getUser() {
    return this.user;
  }

  getRefreshToken() {
    return null;
  }

  getAccessToken() {
    return null;
  }

  setAccessToken() {}

  getProfilePicture() {
    if (this.profilePicture) {
      return this.profilePicture;
    }
  }

  saveUser(user) {
    this.user = user;
  }

  saveProfilePicture(profilePicture) {
    this.profilePicture = profilePicture;
  }
}

export { DemoSession };
