export class DemoHttpClient {
  getDemoFile = async () => {
    if (this.responses) {
      return this.responses;
    }
    this.responses = await (await import('../config/demo')).default;
    return this.responses;
  };
  setToken(refreshToken, accessToken) {}

  async get(url, query) {
    await this.getDemoFile();
    const key = `get ${url}`;
    if (!this.responses[key]) {
      console.error(`${key} not found in demo.js`);
      throw new Error(`${key} not found in demo.js`);
    }
    return Promise.resolve(this.responses[key]);
  }

  async post(url, query) {
    await this.getDemoFile();
    const key = `post ${url}`;
    if (!this.responses[key]) {
      console.error(`${key} not found in demo.js`);
      throw new Error(`${key} not found in demo.js`);
    }
    return Promise.resolve(this.responses[key]);
  }

  async patch(url, query) {
    await this.getDemoFile();
    const key = `patch ${url}`;
    if (!this.responses[key]) {
      console.error(`${key} not found in demo.js`);
      throw new Error(`${key} not found in demo.js`);
    }
    return Promise.resolve(this.responses[key]);
  }
}
