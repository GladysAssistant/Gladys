const OAuthServer = require('oauth2-server');

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
    .then((success) => {
      return res.json(success);
    })
    .catch((err) => {
      return res.status(err.status || 500).send(err);
    });
}

module.exports = {
  token,
};
