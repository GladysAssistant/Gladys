import config from '../config';

/**
 * A response of the demo can be a plain value or a function of the query
 * parameters: charts, history and device filters need to answer the request
 * that was actually made, like a real server would.
 */
const resolveResponse = (response, query) => (typeof response === 'function' ? response(query) : response);

const serializeQuery = query =>
  Object.entries(query)
    .map(([param, value], index) => `${index === 0 ? '?' : '&'}${param}=${value}`)
    .join('');

const parseQueryString = queryString => {
  const params = {};
  if (!queryString) {
    return params;
  }
  queryString.split('&').forEach(pair => {
    const [param, value] = pair.split('=');
    params[decodeURIComponent(param)] = decodeURIComponent(value || '');
  });
  return params;
};

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

  async get(url, query) {
    await this.getDemoFile();
    const [path, urlQueryString] = url.split('?');
    // Query parameters, wherever they come from: some pages pass them as an
    // object, some build the URL themselves
    const params = { ...parseQueryString(urlQueryString), ...query };

    // From the most specific key to the least: a fixture can answer one exact
    // request, and the route itself answers all the others (which is what a
    // fixture written as a function does, from `params`)
    const requestedKey = `get ${url}${query ? serializeQuery(query) : ''}`;
    const key = [requestedKey, `get ${url}`, `get ${path}`].find(candidate => this.responses[candidate] !== undefined);

    if (!key) {
      console.error(`${requestedKey} not found in the demo fixtures`);
      throw new Error(`${requestedKey} not found in the demo fixtures`);
    }
    return Promise.resolve(resolveResponse(this.responses[key], params));
  }

  async post(url, body) {
    await this.getDemoFile();
    const key = `post ${url}`;
    if (!this.responses[key]) {
      console.error(`${key} not found in the demo fixtures`);
      throw new Error(`${key} not found in the demo fixtures`);
    }
    return Promise.resolve(resolveResponse(this.responses[key], body));
  }

  async patch(url, body) {
    await this.getDemoFile();
    const key = `patch ${url}`;
    if (!this.responses[key]) {
      console.error(`${key} not found in the demo fixtures`);
      throw new Error(`${key} not found in the demo fixtures`);
    }
    return Promise.resolve(resolveResponse(this.responses[key], body));
  }

  async delete(url) {
    await this.getDemoFile();
    const key = `delete ${url}`;
    if (!this.responses[key]) {
      console.error(`${key} not found in the demo fixtures`);
      throw new Error(`${key} not found in the demo fixtures`);
    }
    return Promise.resolve(resolveResponse(this.responses[key]));
  }
}
