export class GatewayHttpClient {
  constructor(session) {
    this.session = session;
  }

  async get(url, query) {
    return this.session.gatewayClient.sendRequestGet(url, query);
  }

  async post(url, body) {
    return this.session.gatewayClient.sendRequestPost(url, body);
  }

  async patch(url, body) {
    return this.session.gatewayClient.sendRequestPatch(url, body);
  }
}
