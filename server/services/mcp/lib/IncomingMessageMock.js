
class IncomingMessageMock {
  constructor(method, headers, body) {
    this.method = method;
    this.headers = {
      ...headers,
      get: (key) => {
        return this.headers[key.toLowerCase()];
      },
      entries: () => {
        return Object.entries(this.headers);
      },
    };
    this.rawHeaders = Object.entries(headers).flatMap(([key, value]) => [key, value]);
    this.url = 'http://localhost/mock';
    this.body = body;
    this.listeners = {};
    this.reloadNavigation = false;
  }

  on(event, cb) {
    this.listeners[event] = cb;
  }

  json() {
    return JSON.parse(this.body);
  }

  destroy(error) {
    return this;
  }
}

module.exports = {
  IncomingMessageMock,
};
