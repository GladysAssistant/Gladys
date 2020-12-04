const axios = require('axios');

const DEFAULT_TIMEOUT = 60 * 1000;
/**
 * @public
 * @description Make an HTTP request
 * @param {string} method - The method of the request.
 * @param {string} url - The URL to call.
 * @param {string} [body] - Optional body.
 * @param {string} [headers] - Options headers.
 * @example
 * request('post', 'http://localhost:3000', '{}');
 */
async function request(method, url, body, headers) {
  const options = {
    method,
    url,
    timeout: DEFAULT_TIMEOUT,
    headers: { 'user-agent': `GladysAssistant/${this.system.gladysVersion}` },
  };
  if (body) {
    options.data = body;
  }
  if (headers) {
    options.headers = Object.assign(options.headers, headers);
  }
  // @ts-ignore
  const { data } = await axios.request(options);
  return data;
}

module.exports = {
  request,
};
