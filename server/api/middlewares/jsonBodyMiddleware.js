const express = require('express');

// Prefix of the host API of external integrations (integration -> core).
const HOST_API_PREFIX = '/api/integration/v1/';

// The express default (100 kB) is sized for the frontend, where a request
// carries one object. It is the wrong bound for the host API of external
// integrations, which is batch by construction: `POST /discovered_device`
// publishes the COMPLETE list of discovered devices (up to
// MAX_DISCOVERED_DEVICES = 2000, each with all its features), and
// `POST /camera/image` carries a base64 image bounded at
// MAX_CAMERA_IMAGE_SIZE = 150 kB (~200 kB once base64-encoded).
// Under the default bound, an integration exposing many features per device
// (a Shelly Pro 3EM has 24) blew past 100 kB at ~13 devices: the core
// answered a PayloadTooLargeError, the integration could not split the call
// (a second publish REPLACES the first one) and the user simply saw no
// device at all.
// The bound is sized so the device COUNT stays the binding limit, not the
// byte count: 2000 devices at the ~8 kB worst case of a feature-heavy
// device fit under 20 MB. It is only mounted behind the integration
// authentication (see below), so an unauthenticated caller never gets the
// core to buffer that much.
const DEFAULT_JSON_BODY_LIMIT = '100kb';
const HOST_API_JSON_BODY_LIMIT = '20mb';

const defaultJsonBodyParser = express.json({ limit: DEFAULT_JSON_BODY_LIMIT });
const hostApiJsonBodyParser = express.json({ limit: HOST_API_JSON_BODY_LIMIT });

/**
 * @description Parse the JSON body of the routes serving the frontend. The
 * host API of external integrations is deliberately left out: its bigger
 * bound is mounted per route, behind the integration authentication (see
 * integrationHostJsonBodyMiddleware), so that an unauthenticated caller
 * never gets the core to buffer anything on those paths.
 * @param {object} req - Express request.
 * @param {object} res - Express response.
 * @param {Function} next - Express next middleware.
 * @returns {any} The result of the JSON body parser.
 * @example
 * app.use(jsonBodyMiddleware);
 */
function jsonBodyMiddleware(req, res, next) {
  if (req.path.startsWith(HOST_API_PREFIX)) {
    return next();
  }
  return defaultJsonBodyParser(req, res, next);
}

/**
 * @description Parse the JSON body of the host API of external integrations,
 * with the bigger bound its batch endpoints need. Mounted after the
 * integration authentication: an unauthenticated request gets its 401
 * without a single byte of body being read.
 * @param {object} req - Express request.
 * @param {object} res - Express response.
 * @param {Function} next - Express next middleware.
 * @returns {any} The result of the JSON body parser.
 * @example
 * router.post(path, externalIntegrationAuthMiddleware, integrationHostJsonBodyMiddleware, controller);
 */
function integrationHostJsonBodyMiddleware(req, res, next) {
  return hostApiJsonBodyParser(req, res, next);
}

module.exports = {
  jsonBodyMiddleware,
  integrationHostJsonBodyMiddleware,
};
