import axios from 'axios';
import config from '../config';

const MAX_RETRY = 3;
const DEFAULT_API_SCOPES = ['dashboard:read', 'dashboard:write'];

export class HttpClient {
  constructor(session, apiScopes = DEFAULT_API_SCOPES) {
    this.session = session;
    this.localApiUrl = config.localApiUrl || window.location.origin;
    this.apiScopes = apiScopes;
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

  async get(url, query) {
    return this.executeQuery('get', url, query);
  }

  async post(url, body) {
    return this.executeQuery('post', url, {}, body);
  }

  async patch(url, body) {
    return this.executeQuery('patch', url, {}, body);
  }

  async delete(url) {
    return this.executeQuery('delete', url);
  }
}
