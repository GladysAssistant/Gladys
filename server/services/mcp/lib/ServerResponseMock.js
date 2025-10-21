class ServerResponseMock {
  constructor(cb) {
    this.status = 200;
    this.headers = {};
    this.body = null;
    this.cb = cb;
  }

  writeHead(status, headers) {
    this.status = status;
    this.headers = headers;

    return this;
  }

  end(body) {
    this.body = body;

    if (this.status !== 200) {
      console.log(this.status);
      console.log(this.headers);
      console.log(this.body);
    }

    return this.cb({
      status: this.status,
      headers: this.headers,
      ...(this.body && { body: JSON.parse(this.body) })
    });
  }

  on() {
    // No-op for now
  }

  flushHeaders() {
    // No-op for now
  }

}

module.exports = {
  ServerResponseMock,
};
