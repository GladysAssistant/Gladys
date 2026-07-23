const { expect } = require('chai');
const nock = require('nock');
const axios = require('axios');

const oauth = require('../../../../../services/melcloud-home/lib/auth/melcloud-home.oauth');
const {
  MELCLOUD_HOME_AUTH_ENDPOINT,
} = require('../../../../../services/melcloud-home/lib/utils/melcloud-home.constants');

const AUTH_HOST = MELCLOUD_HOME_AUTH_ENDPOINT;

const LOGIN_FORM_HTML = `
  <html><body>
    <form action="/login?x=1&amp;y=2" method="post" name="cognitoSignInForm">
      <input type="hidden" name="_csrf" value="csrf-token" />
      <input id="signInFormUsername" name="username" type="text" />
      <input type="hidden" class="no-name-input" />
      <input type="submit" name="signInSubmitButton" value="Sign in" />
    </form>
  </body></html>`;

describe('MELCloudHome oauth', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('generatePkce', () => {
    it('should generate a verifier and a challenge', () => {
      const { codeVerifier, codeChallenge } = oauth.generatePkce();
      expect(codeVerifier)
        .to.be.a('string')
        .with.length.greaterThan(0);
      expect(codeChallenge).to.not.include('=');
    });
  });

  describe('parseLoginForm', () => {
    it('should extract the action (HTML-decoded) and inputs', () => {
      const { action, fields } = oauth.parseLoginForm(LOGIN_FORM_HTML);
      expect(action).to.equal('/login?x=1&y=2');
      // eslint-disable-next-line no-underscore-dangle
      expect(fields._csrf).to.equal('csrf-token');
      expect(fields.username).to.equal('');
    });

    it('should return a null action when there is no form', () => {
      expect(oauth.parseLoginForm('<html>no form</html>').action).to.equal(null);
    });
  });

  describe('createCookieJar', () => {
    it('should store cookies per host and ignore malformed ones', () => {
      const jar = oauth.createCookieJar();
      jar.update('https://a.example.com/x', undefined);
      jar.update('https://a.example.com/x', ['k=v; Path=/', 'malformed']);
      expect(jar.serialize('https://a.example.com/x')).to.equal('k=v');
      expect(jar.serialize('https://b.example.com/x')).to.equal('');
    });
  });

  describe('followChain', () => {
    const buildClient = () => axios.create({ maxRedirects: 0, validateStatus: (s) => s >= 200 && s < 400 });

    it('should immediately capture the code from a melcloudhome:// url', async () => {
      const result = await oauth.followChain(buildClient(), oauth.createCookieJar(), 'melcloudhome://?code=abc');
      expect(result).to.deep.equal({ code: 'abc' });
    });

    it('should follow redirects and the /Redirect interstitial up to the code', async () => {
      nock(AUTH_HOST)
        .get('/callback')
        .reply(302, '', { Location: `${AUTH_HOST}/Redirect?RedirectUri=%2Ffinal` });
      nock(AUTH_HOST)
        .get('/Redirect')
        .query(true)
        .reply(200, 'interstitial');
      nock(AUTH_HOST)
        .get('/final')
        .reply(302, '', { Location: 'melcloudhome://?code=THECODE' });

      const result = await oauth.followChain(buildClient(), oauth.createCookieJar(), `${AUTH_HOST}/callback`);
      expect(result.code).to.equal('THECODE');
    });

    it('should return the terminal HTML page', async () => {
      nock(AUTH_HOST)
        .get('/page')
        .reply(200, '<html>form</html>');
      const result = await oauth.followChain(buildClient(), oauth.createCookieJar(), `${AUTH_HOST}/page`);
      expect(result.html).to.include('form');
    });

    it('should give up after too many hops', async () => {
      nock(AUTH_HOST)
        .persist()
        .get('/loop')
        .reply(302, '', { Location: `${AUTH_HOST}/loop` });
      const result = await oauth.followChain(buildClient(), oauth.createCookieJar(), `${AUTH_HOST}/loop`);
      expect(result).to.deep.equal({});
    });
  });

  describe('login', () => {
    const mockHappyPath = () => {
      nock(AUTH_HOST)
        .post('/connect/par')
        .reply(201, { request_uri: 'urn:req:123' });
      nock(AUTH_HOST)
        .get('/connect/authorize')
        .query(true)
        .reply(302, '', { Location: `${AUTH_HOST}/account/login`, 'Set-Cookie': ['idsrv=1; Path=/', 'malformed'] });
      nock(AUTH_HOST)
        .get('/account/login')
        .reply(200, LOGIN_FORM_HTML);
      nock(AUTH_HOST)
        .post('/login')
        .query(true)
        .reply(302, '', { Location: `${AUTH_HOST}/after` });
      nock(AUTH_HOST)
        .get('/after')
        .reply(302, '', { Location: `${AUTH_HOST}/Redirect?RedirectUri=%2Ffinal` });
      nock(AUTH_HOST)
        .get('/Redirect')
        .query(true)
        .reply(200, 'interstitial');
      nock(AUTH_HOST)
        .get('/final')
        .reply(302, '', { Location: 'melcloudhome://?code=auth-code' });
    };

    it('should perform the full PKCE flow and return tokens', async () => {
      mockHappyPath();
      nock(AUTH_HOST)
        .post('/connect/token')
        .reply(200, { access_token: 'access', refresh_token: 'refresh', expires_in: 3600 });

      const tokens = await oauth.login('user@example.com', 'password');
      expect(tokens).to.deep.equal({ access_token: 'access', refresh_token: 'refresh', expires_in: 3600 });
    });

    it('should throw when the login form is never reached', async () => {
      nock(AUTH_HOST)
        .post('/connect/par')
        .reply(201, { request_uri: 'urn:req:123' });
      nock(AUTH_HOST)
        .get('/connect/authorize')
        .query(true)
        .reply(302, '', { Location: 'melcloudhome://?code=too-early' });

      let error;
      try {
        await oauth.login('user@example.com', 'password');
      } catch (e) {
        error = e;
      }
      expect(error.message).to.include('unable to reach the login form');
    });

    it('should throw when the login form cannot be parsed', async () => {
      nock(AUTH_HOST)
        .post('/connect/par')
        .reply(201, { request_uri: 'urn:req:123' });
      nock(AUTH_HOST)
        .get('/connect/authorize')
        .query(true)
        .reply(200, '<html>no form</html>');

      let error;
      try {
        await oauth.login('user@example.com', 'password');
      } catch (e) {
        error = e;
      }
      expect(error.message).to.include('unable to parse the login form');
    });

    it('should throw when credentials are rejected (no redirect)', async () => {
      nock(AUTH_HOST)
        .post('/connect/par')
        .reply(201, { request_uri: 'urn:req:123' });
      nock(AUTH_HOST)
        .get('/connect/authorize')
        .query(true)
        .reply(302, '', { Location: `${AUTH_HOST}/account/login` });
      nock(AUTH_HOST)
        .get('/account/login')
        .reply(200, LOGIN_FORM_HTML);
      nock(AUTH_HOST)
        .post('/login')
        .query(true)
        .reply(200, LOGIN_FORM_HTML);

      let error;
      try {
        await oauth.login('user@example.com', 'wrong');
      } catch (e) {
        error = e;
      }
      expect(error.message).to.include('login failed');
    });

    it('should throw when no authorization code is returned', async () => {
      nock(AUTH_HOST)
        .post('/connect/par')
        .reply(201, { request_uri: 'urn:req:123' });
      nock(AUTH_HOST)
        .get('/connect/authorize')
        .query(true)
        .reply(302, '', { Location: `${AUTH_HOST}/account/login` });
      nock(AUTH_HOST)
        .get('/account/login')
        .reply(200, LOGIN_FORM_HTML);
      nock(AUTH_HOST)
        .post('/login')
        .query(true)
        .reply(302, '', { Location: `${AUTH_HOST}/done` });
      nock(AUTH_HOST)
        .get('/done')
        .reply(200, 'no code here');

      let error;
      try {
        await oauth.login('user@example.com', 'password');
      } catch (e) {
        error = e;
      }
      expect(error.message).to.include('no authorization code');
    });
  });

  describe('exchangeCode', () => {
    it('should exchange an authorization code for tokens', async () => {
      nock(AUTH_HOST)
        .post('/connect/token')
        .reply(200, { access_token: 'access' });
      const tokens = await oauth.exchangeCode('code', 'verifier');
      expect(tokens.access_token).to.equal('access');
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      nock(AUTH_HOST)
        .post('/connect/token')
        .reply(200, { access_token: 'new-access' });
      const tokens = await oauth.refresh('refresh-token');
      expect(tokens.access_token).to.equal('new-access');
    });
  });
});
