import config from '../../config';
import gladysGatewayClient from '@gladysassistant/gladys-gateway-js';

export class GatewayHttpClient {
  constructor() {
    this.gatewayClient = gladysGatewayClient({
      serverUrl: config.serverUrl,
      cryptoLib: window.crypto
    });
  }

  async get(url, query) {
    return this.gatewayClient.request.get(url, query);
  }

  async post(url, body) {
    return this.gatewayClient.request.post(url, body);
  }

  async patch(url, body) {
    return this.gatewayClient.request.patch(url, body);
  }
}
