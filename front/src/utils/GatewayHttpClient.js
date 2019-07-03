const func = {
  get: 'sendRequestGet',
  post: 'sendRequestPost',
  patch: 'sendRequestPatch'
};

export class GatewayHttpClient {
  constructor(session) {
    this.session = session;
    this.session.dispatcher.addListener('GLADYS_GATEWAY_CONNECTED', this.emptyQueue.bind(this));
    this.queue = [];
  }

  async emptyQueue() {
    this.queue.forEach(func => {
      func();
    });
  }

  async callApi(method, url, data) {
    try {
      const result = await this.session.gatewayClient[func[method]](url, data);
      return result;
    } catch (e) {
      const error = {
        response: e
      };
      throw error;
    }
  }

  async callApiWhenReady(method, url, data) {
    if (this.session.connected) {
      return this.callApi(method, url, data);
    }
    return new Promise(async (resolve, reject) => {
      this.queue.push(async () => {
        try {
          const data = await this.callApi(method, url, data);
          resolve(data);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async get(url, query) {
    return this.callApiWhenReady('get', url, query);
  }

  async post(url, body) {
    return this.callApiWhenReady('post', url, body);
  }

  async patch(url, body) {
    return this.callApiWhenReady('patch', url, body);
  }
}
