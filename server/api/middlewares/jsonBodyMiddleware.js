const express = require('express');

// Prefix of the host API of external integrations (integration -> core).
const HOST_API_PREFIX = '/api/integration/v1/';

// The express default (100 kB) is sized for the frontend, where a request
// carries one object. It is the wrong bound for the host API of external
// integrations, which is batch by construction: `POST /discovered_device`
// publishes the COMPLETE list of discovered devices (up to
// MAX_DISCOVERED_DEVICES = 200, each with all its features), and
// `POST /camera/image` carries a base64 image bounded at
// MAX_CAMERA_IMAGE_SIZE = 150 kB (~200 kB once base64-encoded).
// Under the default bound, an integration exposing many features per device
// (a Shelly Pro 3EM has 24) blew past 100 kB at ~13 devices: the core
// answered a PayloadTooLargeError, the integration could not split the call
// (a second publish REPLACES the first one) and the user simply saw no
// device at all.
const DEFAULT_JSON_BODY_LIMIT = '100kb';
const HOST_API_JSON_BODY_LIMIT = '5mb';

const defaultJsonBodyParser = express.json({ limit: DEFAULT_JSON_BODY_LIMIT });
const hostApiJsonBodyParser = express.json({ limit: HOST_API_JSON_BODY_LIMIT });

/**
 * @description Parse the JSON body, with a bigger bound on the host API of
 * external integrations than on the routes serving the frontend.
 * @param {object} req - Express request.
 * @param {object} res - Express response.
 * @param {Function} next - Express next middleware.
 * @returns {any} The result of the JSON body parser.
 * @example
 * app.use(jsonBodyMiddleware);
 */
function jsonBodyMiddleware(req, res, next) {
  if (req.path.startsWith(HOST_API_PREFIX)) {
    return hostApiJsonBodyParser(req, res, next);
  }
  return defaultJsonBodyParser(req, res, next);
}

module.exports = jsonBodyMiddleware;
