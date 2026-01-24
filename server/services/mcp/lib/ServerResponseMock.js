class ServerResponseMock {
  constructor(cb) {
    this.statusCode = 200;
    this.headers = {};
    this.body = null;
    this.headersSent = false;
    this.cb = cb;
    this.listeners = {};
  }

  status(statusCode) {
    this.statusCode = statusCode;

    return this;
  }

  writeHead(statusCode, headers) {
    this.statusCode = statusCode;
    this.headers = headers;

    return this;
  }

  json(jsonBody) {
    this.body = jsonBody;

    this.sendResponse();
  }

  end(body) {
    if (body) {
      this.body = JSON.parse(body);
    }

    this.sendResponse();
  }

  sendResponse() {
    this.listeners.close?.();

    return this.cb({
      status: this.statusCode,
      headers: this.headers,
      body: this.body,
    });
  }

  on(event, cb) {
    this.listeners[event] = cb;
  }

  flushHeaders() {
    return this.headers;
  }

  write(chunk, encoding, cb) {
    this.body = JSON.parse(new TextDecoder().decode(chunk));

    if (cb) {
      cb();
    }

    return true;
  }
}

module.exports = {
  ServerResponseMock,
};
