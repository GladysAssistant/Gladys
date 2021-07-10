const OAuthServer = require('oauth2-server');
const UnauthorizedRequestError = require('oauth2-server/lib/errors/unauthorized-request-error');

/**
 * @description Authorizes a token request.
 * @param {*} req - Request object.
 * @param {*} res - Response object.
 * @returns {Promise} A Promise that resolves to the authorization code object returned from saveAuthorizationCode().
 * In case of an error, the promise rejects with one of the error types derived from OAuthError.
 * @example
 * oauthManager.authorize(req, res);
 */
async function authorize(req, res) {
  const request = new OAuthServer.Request(req);
  const response = new OAuthServer.Response(res);
  const { oauthServer } = this;

  return oauthServer
    .authorize(request, response)
    .then(() => {
      const { location } = response.headers;
      delete response.headers.location;
      return res.json({ uri: location, headers: response.headers });
    })
    .catch((e) => {
      res.set(response.headers);

      res.status(e.code);

      if (e instanceof UnauthorizedRequestError) {
        return res.send();
      }

      return res.send({ error: e.name, error_description: e.message });
    });
}

module.exports = {
  authorize,
};
