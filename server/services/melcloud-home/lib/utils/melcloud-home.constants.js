const GLADYS_VARIABLES = {
  USERNAME: 'MELCLOUD_HOME_USERNAME',
  PASSWORD: 'MELCLOUD_HOME_PASSWORD',
  REFRESH_TOKEN: 'MELCLOUD_HOME_REFRESH_TOKEN',
};

// MELCloud Home is the new Mitsubishi Electric platform (melcloudhome.com).
// It is a completely different API from the legacy MELCloud (app.melcloud.com):
// authentication is OAuth 2.0 (Authorization Code + PKCE) and the API is a
// backend-for-frontend (BFF) returning JSON with camelCase fields.
const MELCLOUD_HOME_AUTH_ENDPOINT = 'https://auth.melcloudhome.com';
const MELCLOUD_HOME_API_ENDPOINT = 'https://mobile.bff.melcloudhome.com';

const OAUTH = {
  CLIENT_ID: 'homemobile',
  // The client authenticates at the token endpoint with an empty secret.
  // "homemobile:" base64-encoded.
  BASIC_AUTH: 'Basic aG9tZW1vYmlsZTo=',
  REDIRECT_URI: 'melcloudhome://',
  SCOPE: 'openid profile email offline_access IdentityServerApi',
  RESPONSE_TYPE: 'code',
  CODE_CHALLENGE_METHOD: 'S256',
  // Refresh the access token this many seconds before it actually expires.
  TOKEN_REFRESH_BUFFER_SECONDS: 60,
  // Fallback lifetime if the token response does not include expires_in.
  DEFAULT_EXPIRES_IN_SECONDS: 3600,
};

const STATUS = {
  NOT_INITIALIZED: 'not_initialized',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  DISCOVERING_DEVICES: 'discovering',
};

// Air-to-air operation modes, as delivered over the REST API (string values).
const ATA_OPERATION_MODE = {
  HEAT: 'Heat',
  DRY: 'Dry',
  COOL: 'Cool',
  FAN: 'Fan',
  AUTOMATIC: 'Automatic',
};

module.exports = {
  GLADYS_VARIABLES,
  MELCLOUD_HOME_AUTH_ENDPOINT,
  MELCLOUD_HOME_API_ENDPOINT,
  OAUTH,
  STATUS,
  ATA_OPERATION_MODE,
};
