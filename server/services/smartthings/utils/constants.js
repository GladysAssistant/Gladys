const SCOPES = ['r:devices:*', 'w:devices:*', 'i:deviceprofiles', 'x:devices:*'];

const VARIABLES = {
  SMT_PUBLIC_KEY: 'SMT_PUBLIC_KEY',
  SMT_SECRET_KEY: 'SMT_SECRET_KEY',
  SMT_TOKEN_CALLBACK_URL: 'SMT_TOKEN_CALLBACK_URL',
  SMT_STATE_CALLBACK_URL: 'SMT_STATE_CALLBACK_URL',
};

module.exports = {
  SCOPES,
  VARIABLES,
};
