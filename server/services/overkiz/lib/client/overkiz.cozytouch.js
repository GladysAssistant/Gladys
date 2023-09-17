const axios = require('axios');
const url = require('url');
const logger = require('../../../../utils/logger');
const { PasswordNotMatchingError } = require('../../../../utils/coreErrors');

const client = axios.create({
  timeout: 10000,
});

class CozytouchLoginHandler {
  constructor(server, username, password) {
    this.server = server;
    this.username = username;
    this.password = password;
  }

  async login() {
    logger.info(`Login to Cozytouch ${this.server}`);

    let params = new url.URLSearchParams({
      username: `GA-PRIVATEPERSON/${this.username}`,
      password: this.password,
      grant_type: 'password',
    });
    let response = await client.post(`${this.server.configuration.COZYTOUCH_ATLANTIC_API}/token`, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${this.server.configuration.COZYTOUCH_CLIENT_ID}`,
      },
    });
    this.access_token = response.data.access_token;

    response = await client.get(`${this.server.configuration.COZYTOUCH_ATLANTIC_API}/magellan/accounts/jwt`, {
      headers: {
        Authorization: `Bearer ${this.access_token}`,
      },
    });
    this.jwt = response.data;

    params = new url.URLSearchParams({
      jwt: this.jwt,
    });
    response = await client.post(`${this.server.endpoint}/login`, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.success === false) {
      throw new PasswordNotMatchingError();
    }

    this.cookie = response.headers['set-cookie'][0].split(' ')[0].slice(0, -1);
  }
}

module.exports = {
  CozytouchLoginHandler,
};
