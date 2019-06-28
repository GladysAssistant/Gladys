export class GatewayHttpClient {
  constructor(session) {
    this.session = session;
  }

  async get(url, query) {
    try {
      const result = await this.session.gatewayClient.sendRequestGet(url, query);
      return result;
    } catch (e) {
      const error = {
        response: e
      };
      throw error;
    }
  }

  async post(url, body) {
    try {
      const result = await this.session.gatewayClient.sendRequestPost(url, body);
      return result;
    } catch (e) {
      throw {
        response: e
      };
    }
  }

  async patch(url, body) {
    try {
      const result = await this.session.gatewayClient.sendRequestPatch(url, body);
      return result;
    } catch (e) {
      throw {
        response: e
      };
    }
  }
}
