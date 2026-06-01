import axios from 'axios';
import config from '../config';

const MAX_RETRY = 3;
const DEFAULT_API_SCOPES = ['dashboard:read', 'dashboard:write'];

export class HttpClient {
  constructor(session, apiScopes = DEFAULT_API_SCOPES) {
    this.session = session;
    this.localApiUrl = config.localApiUrl || window.location.origin;
    this.apiScopes = apiScopes;
    this.pendingRequests = new Map(); // Cache for pending requests
    this.session.setRefreshAccessTokenFunction(this.refreshAccessToken.bind(this));
  }

  getAxiosHeaders() {
    const headers = {};
    if (this.session.getAccessToken()) {
      headers.authorization = `Bearer ${this.session.getAccessToken()}`;
    }
    return headers;
  }

  setApiScopes(scopes) {
    this.apiScopes = scopes;
  }

  resetApiScopes() {
    this.apiScopes = DEFAULT_API_SCOPES;
  }

  async refreshAccessToken() {
    const { data } = await axios({
      baseURL: this.localApiUrl,
      url: '/api/v1/access_token',
      method: 'post',
      data: {
        refresh_token: this.session.getRefreshToken(),
        scope: this.apiScopes
      }
    });
    this.session.setAccessToken(data.access_token);
    // reconnect websocket
    this.session.connect();
  }

  async executeQuery(method, url, query, body, retryCount = 0) {
    if (retryCount > MAX_RETRY) {
      this.session.reset();
      throw new Error('MAX_RETRY_EXCEEDED');
    }
    try {
      const { data } = await axios({
        baseURL: this.localApiUrl,
        url,
        method,
        params: query,
        data: body,
        headers: this.getAxiosHeaders()
      });
      return data;
    } catch (e) {
      if (e.response && e.response.status === 401 && e.response.data.message !== 'TABLET_IS_LOCKED') {
        await this.refreshAccessToken();
        return this.executeQuery(method, url, query, body, retryCount + 1);
      }
      throw e;
    }
  }

  getCacheKey(url, query) {
    // Create a unique key based on the URL and query parameters
    const queryKey = query ? JSON.stringify(query) : '';
    return `${url}?${queryKey}`;
  }

  async get(url, query) {
    const cacheKey = this.getCacheKey(url, query);

    // Check if the request is already in progress
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Execute the request and store the promise in the cache
    const requestPromise = this.executeQuery('get', url, query);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Remove the request from the cache once it is completed
      this.pendingRequests.delete(cacheKey);
    }
  }

  async post(url, body) {
    return this.executeQuery('post', url, {}, body);
  }

  /**
   * @description POST binary data (e.g. audio/webm).
   * @param {string} url - API path.
   * @param {Blob|ArrayBuffer|Uint8Array} body - Raw request body.
   * @param {string} [contentType='application/octet-stream'] - Content-Type header.
   * @param {object} [options={}] - Request options.
   * @param {AbortSignal} [options.signal] - Abort signal to cancel the request.
   * @param {number} [options.retryCount=0] - Internal retry counter.
   * @returns {Promise<object>} Parsed JSON response.
   */
  async postBinary(url, body, contentType = 'application/octet-stream', options = {}) {
    const { signal, retryCount = 0 } = options;
    if (retryCount > MAX_RETRY) {
      this.session.reset();
      throw new Error('MAX_RETRY_EXCEEDED');
    }
    try {
      const { data } = await axios({
        baseURL: this.localApiUrl,
        url,
        method: 'post',
        data: body,
        signal,
        headers: {
          ...this.getAxiosHeaders(),
          'Content-Type': contentType
        }
      });
      return data;
    } catch (e) {
      if (e.response && e.response.status === 401 && e.response.data.message !== 'TABLET_IS_LOCKED') {
        await this.refreshAccessToken();
        return this.postBinary(url, body, contentType, { signal, retryCount: retryCount + 1 });
      }
      throw e;
    }
  }

  async patch(url, body) {
    return this.executeQuery('patch', url, {}, body);
  }

  async delete(url) {
    return this.executeQuery('delete', url);
  }
}
