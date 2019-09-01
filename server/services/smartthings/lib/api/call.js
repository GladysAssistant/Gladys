const axios = require('axios');

/**
 * @description Build HTTP commons request.
 * @param {string} url - URL to call.
 * @param {string} token - Bearer token.
 * @param {string} method - HTTP method to use.
 * @param {any} data - Body to send.
 * @returns {any} The HTTP response.
 * @example
 * call('/devices', 'my-bearer-token', 'post', { name: 'my-device' });
 */
async function call(url, token, method = 'get', data = undefined) {
  return axios.request({
    baseURL: 'https://api.smartthings.com/v1',
    headers: {
      Bearer: token,
    },
    url,
    method,
    data,
  });
}

module.exports = {
  call,
};
