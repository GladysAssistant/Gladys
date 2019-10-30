require('dotenv').config();

const { GLADYS_GATEWAY_API_URL, LOCAL_API_URL, DEMO_MODE, WEBSOCKET_URL, GATEWAY_MODE, STRIPE_API_KEY } = process.env;
const webpack = require('webpack');

const asyncPlugin = require('preact-cli-plugin-fast-async');

module.exports = function(config) {
  asyncPlugin(config);
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.GLADYS_GATEWAY_API_URL': JSON.stringify(GLADYS_GATEWAY_API_URL),
      'process.env.LOCAL_API_URL': JSON.stringify(LOCAL_API_URL),
      'process.env.DEMO_MODE': JSON.stringify(DEMO_MODE),
      'process.env.WEBSOCKET_URL': JSON.stringify(WEBSOCKET_URL),
      'process.env.GATEWAY_MODE': JSON.stringify(GATEWAY_MODE),
      'process.env.STRIPE_API_KEY': JSON.stringify(STRIPE_API_KEY)
    })
  );

  config.resolve.alias.react = 'preact/compat';
  config.resolve.alias['react-dom/test-utils'] = 'preact/test-utils';
  config.resolve.alias['react-dom'] = 'preact/compat';
};
