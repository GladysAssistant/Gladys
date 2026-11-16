import pLimit from 'p-limit';
import { encodeGatewayBinaryBody } from './gatewayBinaryBody';

// With Gladys Plus, every API call travels through the socket of the Gateway, and an answer
// that is lost never comes back: the Gateway client sends the call without a timeout, and
// socket.io silently drops the answers still expected when the socket closes. A phone that
// freezes the web app in the background and kills its socket does exactly that. A call left
// pending forever keeps its slot in the limiter and its entry in the GET cache, so a handful
// of them was enough to freeze every later call until the app was reloaded. Every call
// therefore has to end, whatever happens to the connection.

// How long a call waits for the connection before giving up
const CONNECTION_TIMEOUT_MS = 30 * 1000;
// How long the answer of a call is expected once the call is sent. This is only the safety
// net of an answer lost on a connection that stays up (a closed connection ends its calls
// at once): it leaves room for the slowest endpoints (device discovery, uploads).
const REQUEST_TIMEOUT_MS = 60 * 1000;
// How many times a call is attempted when the connection keeps closing under it
const MAX_ATTEMPTS = 3;

const GATEWAY_CONNECTION_LOST = 'GATEWAY_CONNECTION_LOST';
const GATEWAY_CONNECTION_TIMEOUT = 'GATEWAY_CONNECTION_TIMEOUT';
const GATEWAY_REQUEST_TIMEOUT = 'GATEWAY_REQUEST_TIMEOUT';
const GATEWAY_SESSION_CLOSED = 'GATEWAY_SESSION_CLOSED';

class GatewayConnectionLostError extends Error {
  constructor(requestSent) {
    super(GATEWAY_CONNECTION_LOST);
    // false when the connection closed before the call left the browser
    this.requestSent = requestSent;
  }
}

export class GatewayHttpClient {
  constructor(session) {
    this.session = session;
    this.session.dispatcher.addListener('websocket.connected', this.onWebsocketConnected.bind(this));
    // Allow a maximum of 5 concurrent API calls
    this.limiter = pLimit(5);
    this.queue = []; // Calls waiting for the connection
    this.inFlightRequests = new Set(); // Calls sent, whose answer is expected
    this.pendingRequests = new Map(); // Cache for pending GET requests
  }

  onWebsocketConnected({ connected }) {
    if (connected) {
      this.emptyQueue();
    } else {
      this.abortInFlightRequests();
    }
  }

  emptyQueue() {
    const queue = this.queue;
    this.queue = [];
    queue.forEach(func => {
      func();
    });
  }

  // The session dispatches the disconnection right before socket.io drops the answers it
  // was waiting for: none of the calls sent on that connection will ever be answered
  abortInFlightRequests() {
    [...this.inFlightRequests].forEach(abort => {
      abort(new GatewayConnectionLostError(true));
    });
  }

  getCacheKey(url, query) {
    // Create a unique key based on the URL and query parameters
    const queryKey = query ? JSON.stringify(query) : '';
    return `${url}?${queryKey}`;
  }

  // A call sent on a dead socket is lost. So a call waits for the verdict when the connection
  // is being checked (the app is back from the background), and asks for a check when the
  // page is still in the background, where its socket may have been killed unnoticed.
  async waitForConnectionCheck() {
    if (this.session.connectionCheck || this.session.connectionMayBeDead()) {
      await this.session.checkConnection();
    }
  }

  // Resolves as soon as the session is connected and authenticated on the Gateway
  async waitForConnection() {
    await this.waitForConnectionCheck();
    if (this.session.ready) {
      return;
    }
    await new Promise((resolve, reject) => {
      let timeout = null;
      const onConnected = () => {
        clearTimeout(timeout);
        resolve();
      };
      timeout = setTimeout(() => {
        this.queue = this.queue.filter(func => func !== onConnected);
        // the socket may be connected without ever having been authenticated
        this.session.checkConnection();
        reject(new Error(GATEWAY_CONNECTION_TIMEOUT));
      }, CONNECTION_TIMEOUT_MS);
      this.queue.push(onConnected);
    });
  }

  // Sends one call, and settles when it is answered, when the connection closes, or after
  // the timeout: it never stays pending
  sendRequest(func, url, data, resetCount) {
    if (resetCount !== this.session.resetCount) {
      // The session was closed since this call was made (logout, session refused by the
      // instance): it must not run under the next login
      return Promise.reject(new Error(GATEWAY_SESSION_CLOSED));
    }
    if (!this.session.ready) {
      // the connection closed while this call was waiting for its slot in the limiter
      return Promise.reject(new GatewayConnectionLostError(false));
    }
    return new Promise((resolve, reject) => {
      let timeout = null;
      const settle = callback => value => {
        clearTimeout(timeout);
        this.inFlightRequests.delete(abort);
        callback(value);
      };
      const abort = settle(reject);
      timeout = setTimeout(async () => {
        // An answer that does not come can be the sign of a connection that is dead
        // without the socket knowing it yet: if so, the session reconnects, which aborts
        // this call as lost (a GET is then sent again) before the line below runs
        await this.session.checkConnection();
        abort(new Error(GATEWAY_REQUEST_TIMEOUT));
      }, REQUEST_TIMEOUT_MS);
      this.inFlightRequests.add(abort);
      this.session.gatewayClient[func](url, data).then(settle(resolve), settle(reject));
    });
  }

  async callApi(func, url, data, attempt = 1, resetCount = this.session.resetCount) {
    try {
      await this.waitForConnection();
      const result = await this.limiter(async () => {
        // a check may have started while this call was waiting for its slot
        await this.waitForConnectionCheck();
        return this.sendRequest(func, url, data, resetCount);
      });
      return result;
    } catch (e) {
      // A call lost with its connection is sent again once the connection is back, but only
      // when that is harmless: reading twice is, and so is sending a call that never left.
      // A POST / PATCH / DELETE that was sent may have been executed, so it fails instead.
      const canBeSentAgain = func === 'sendRequestGet' || e.requestSent === false;
      if (e instanceof GatewayConnectionLostError && canBeSentAgain && attempt < MAX_ATTEMPTS) {
        return this.callApi(func, url, data, attempt + 1, resetCount);
      }
      const error = {
        response: {
          status: e.status,
          data: e
        }
      };
      throw error;
    }
  }

  async get(url, query) {
    const cacheKey = this.getCacheKey(url, query);

    // Check if a GET request with the same parameters is already in progress
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // If no request is in progress, create a new one and cache it
    const requestPromise = this.callApi('sendRequestGet', url, query);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Remove the completed request from the cache
      this.pendingRequests.delete(cacheKey);
    }
  }

  async post(url, body) {
    return this.callApi('sendRequestPost', url, body);
  }

  /**
   * @description POST binary data to the local Gladys instance via the gateway WebSocket.
   * @param {string} url - API path.
   * @param {Blob|ArrayBuffer|Uint8Array} body - Raw request body.
   * @param {string} [contentType='application/octet-stream'] - Content-Type header.
   * @returns {Promise<object>} Parsed JSON response.
   */
  async postBinary(url, body, contentType = 'application/octet-stream') {
    const gatewayBody = await encodeGatewayBinaryBody(body, contentType);
    return this.callApi('sendRequestPost', url, gatewayBody);
  }

  async patch(url, body) {
    return this.callApi('sendRequestPatch', url, body);
  }

  async delete(url) {
    return this.callApi('sendRequestDelete', url);
  }
}
