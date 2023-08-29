const axios = require('axios');
const logger = require('../../../../utils/logger');

class API {
  constructor({ host, platformLoginHandler, polling }) {
    logger.info(`Connecting to Overkiz ${host}`);

    this.platformLoginHandler = platformLoginHandler;
    this.polling = polling;
    this.client = axios.create({
      baseURL: host,
      timeout: 10000,
    });
    this.client.interceptors.request.use((config) => {
      config.headers.common.Host = new URL(config.baseURL).hostname;
      config.headers.common.Cookie = `${this.platformLoginHandler.cookie}`;
      return config;
    });
  }

  async getSetup() {
    return this.get(`/setup`);
  }

  async getGateways() {
    return this.get(`/setup/gateways`);
  }

  async getDevices() {
    return this.get(`/setup/devices`);
  }

  async exec(payload) {
    return this.assumeLogin(async () => {
      const response = await this.client.post(`/exec/apply`, payload);
      return response.data.execId;
    });
  }

  async get(url) {
    return this.assumeLogin(async () => {
      const response = await this.client.get(url);
      return response.data;
    });
  }

  async assumeLogin(callback) {
    if (this.platformLoginHandler.cookie === undefined) {
      await this.platformLoginHandler.login();
    }
    try {
      return await callback.call();
    } catch (e) {
      if (e.isAxiosError && e.response && e.response.status === 401) {
        await this.platformLoginHandler.login();
        return callback.call();
      }
      throw e;
    }
  }
}

module.exports = {
  API,
};
