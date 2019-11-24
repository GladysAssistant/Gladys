const SCOPES = ['r:devices:*', 'w:devices:*', 'i:deviceprofiles', 'x:devices:*'];

const VARIABLES = {
  SMT_PUBLIC_KEY: 'SMARTTHINGS_PUBLIC_KEY',
  SMT_SECRET_KEY: 'SMARTTHINGS_SECRET_KEY',
  SMT_CALLBACK_OAUTH: 'SMARTTHINGS_CALLBACK_OAUTH',
};

module.exports = {
  SCOPES,
  VARIABLES,
};
