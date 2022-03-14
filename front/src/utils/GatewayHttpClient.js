import pLimit from 'p-limit';

export class GatewayHttpClient {
  constructor(session) {
    this.session = session;
    this.session.dispatcher.addListener('GLADYS_GATEWAY_CONNECTED', this.emptyQueue.bind(this));
    // we only allow max 5 concurrent API call to Gladys Plus
    // to avoid overloading the user instance
    this.limiter = pLimit(5);
    this.queue = [];
  }

  async emptyQueue() {
    this.queue.forEach(func => {
      func();
    });
    this.queue = [];
  }

  async callApi(func, url, data) {
    try {
      const result = await this.limiter(() => this.session.gatewayClient[func](url, data));
      return result;
    } catch (e) {
      const error = {
        response: {
          status: e.status,
          data: e
        }
      };
      throw error;
    }
  }

  async callApiWhenReady(func, url, data) {
    if (this.session.ready) {
      return this.callApi(func, url, data);
    }
    return new Promise(async (resolve, reject) => {
      this.queue.push(async () => {
        try {
          const response = await this.callApi(func, url, data);
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async get(url, query) {
    return this.callApiWhenReady('sendRequestGet', url, query);
  }

  async post(url, body) {
    return this.callApiWhenReady('sendRequestPost', url, body);
  }

  async patch(url, body) {
    return this.callApiWhenReady('sendRequestPatch', url, body);
  }

  async delete(url) {
    return this.callApiWhenReady('sendRequestDelete', url);
  }
}
