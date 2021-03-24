const OAuthServer = require('oauth2-server');
const UnauthorizedRequestError = require('oauth2-server/lib/errors/unauthorized-request-error');

/**
 * @description Retrieves a new token for an authorized token request.
 * @param {*} req - Request object.
 * @param {*} res - Response object.
 * @returns {Promise} A Promise that resolves to the token object returned from Model#saveToken().
 * In case of an error, the promise rejects with one of the error types derived from OAuthError.
 * @example
 * oauthManager.token(req, res);
 */
async function token(req, res) {
  const request = new OAuthServer.Request(req);
  const response = new OAuthServer.Response(res);

  return this.oauthServer
    .token(request, response)
    .then(() => {
      res.set(response.headers);
      return res.status(response.status).send(response.body);
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
  token,
};
