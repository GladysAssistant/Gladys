import config from '../config';

export class DemoHttpClient {
  getDemoFile = async () => {
    // Set a timer to see loaders
    if (config.demoRequestTime > 0) {
      await new Promise(r => setTimeout(r, config.demoRequestTime));
    }

    if (this.responses) {
      return this.responses;
    }
    this.responses = await (await import('../config/demo')).default;
    return this.responses;
  };
  setToken() {}

  async get(url) {
    await this.getDemoFile();
    const key = `get ${url}`;
    if (!this.responses[key]) {
      console.error(`${key} not found in demo.js`);
      throw new Error(`${key} not found in demo.js`);
    }
    return Promise.resolve(this.responses[key]);
  }

  async post(url) {
    await this.getDemoFile();
    const key = `post ${url}`;
    if (!this.responses[key]) {
      console.error(`${key} not found in demo.js`);
      throw new Error(`${key} not found in demo.js`);
    }
    return Promise.resolve(this.responses[key]);
  }

  async patch(url) {
    await this.getDemoFile();
    const key = `patch ${url}`;
    if (!this.responses[key]) {
      console.error(`${key} not found in demo.js`);
      throw new Error(`${key} not found in demo.js`);
    }
    return Promise.resolve(this.responses[key]);
  }

  async delete(url) {
    await this.getDemoFile();
    const key = `delete ${url}`;
    if (!this.responses[key]) {
      console.error(`${key} not found in demo.js`);
      throw new Error(`${key} not found in demo.js`);
    }
    return Promise.resolve(this.responses[key]);
  }
}
