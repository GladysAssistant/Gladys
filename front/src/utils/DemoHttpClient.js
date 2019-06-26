import responses from '../config/demo.json';

export class DemoHttpClient {
  setToken(refreshToken, accessToken) {}

  async get(url, query) {
    const key = `get ${url}`;
    if (!responses[key]) {
      console.log(`${key} not found in demo.json`);
      throw new Error(`${key} not found in demo.json`);
    }
    return Promise.resolve(responses[key]);
  }

  async post(url, query) {
    const key = `post ${url}`;
    if (!responses[key]) {
      console.log(`${key} not found in demo.json`);
      throw new Error(`${key} not found in demo.json`);
    }
    return Promise.resolve(responses[key]);
  }

  async patch(url, query) {
    const key = `patch ${url}`;
    if (!responses[key]) {
      console.log(`${key} not found in demo.json`);
      throw new Error(`${key} not found in demo.json`);
    }
    return Promise.resolve(responses[key]);
  }
}
