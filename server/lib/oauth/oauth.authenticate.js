const OAuthServer = require('oauth2-server');
const UnauthorizedRequestError = require('oauth2-server/lib/errors/unauthorized-request-error');

/**
 * @description Authenticates a request.
 * @param {*} req - Request object.
 * @param {*} res - Response object.
 * @param {Function} successCallback - Callback if success.
 * @param {Function} errorCallback - Callback if error, if "undefined" is OAuth2 default workflow.
 * @returns {Promise} A Promise that resolves to the access token object returned from Model#getAccessToken().
 * In case of an error, the promise rejects with one of the error types derived from OAuthError.
 * @example
 * oauthManager.authenticate(req, res);
 */
async function authenticate(req, res, successCallback, errorCallback = undefined) {
  const request = new OAuthServer.Request(req);
  const response = new OAuthServer.Response(res);

  return this.oauthServer
    .authenticate(request, response)
    .then(() => {
      return successCallback(req, res);
    })
    .catch((e) => {
      if (errorCallback) {
        return errorCallback(e);
      }

      res.set(response.headers);

      res.status(e.code);

      if (e instanceof UnauthorizedRequestError) {
        return res.send();
      }
      return res.send({ error: e.name, error_description: e.message });
    });
}

module.exports = {
  authenticate,
};
