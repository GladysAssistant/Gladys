import axios from 'axios';
import config from '../../config';

const MAX_RETRY = 3;

export class HttpClient {
  constructor(session) {
    this.session = session;
    this.localApiUrl = config.localApiUrl || window.location.origin;
  }

  getAxiosHeaders() {
    const headers = {};
    if (this.session.getAccessToken()) {
      headers.authorization = `Bearer ${this.session.getAccessToken()}`;
    }
    return headers;
  }

  async refreshAccessToken() {
    const { data } = await axios({
      baseURL: this.localApiUrl,
      url: '/api/v1/access_token',
      method: 'post',
      data: {
        refresh_token: this.session.getRefreshToken()
      }
    });
    this.session.setAccessToken(data.access_token);
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
      if (e.response && e.response.status === 401) {
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

  async delete(url, body) {
    return this.executeQuery('delete', url);
  }
}
