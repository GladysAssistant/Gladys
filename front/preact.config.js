require('dotenv').config();

const { GLADYS_GATEWAY_API_URL, LOCAL_API_URL, DEMO_MODE, WEBSOCKET_URL } = process.env;
const webpack = require('webpack');

const asyncPlugin = require('preact-cli-plugin-fast-async');

module.exports = function(config) {
  asyncPlugin(config);
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.GLADYS_GATEWAY_API_URL': JSON.stringify(GLADYS_GATEWAY_API_URL),
      'process.env.LOCAL_API_URL': JSON.stringify(LOCAL_API_URL),
      'process.env.DEMO_MODE': JSON.stringify(DEMO_MODE),
      'process.env.WEBSOCKET_URL': JSON.stringify(WEBSOCKET_URL)
    })
  );
};
