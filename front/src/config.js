const local = {
  gladysGatewayApiUrl: process.env.GLADYS_GATEWAY_API_URL || 'https://api.gladysgateway.com',
  localApiUrl: process.env.LOCAL_API_URL || 'http://localhost:1443',
  webSocketUrl: process.env.WEBSOCKET_URL || 'ws://localhost:1443',
  gatewayMode: process.env.GATEWAY_MODE === 'true',
  demoMode: process.env.DEMO_MODE === 'true',
  demoRequestTime: process.env.DEMO_REQUEST_TIME || 0,
  enedisForceUsagePoints: process.env.ENEDIS_FORCE_USAGE_POINTS
};

const prod = {
  gladysGatewayApiUrl: process.env.GLADYS_GATEWAY_API_URL || 'https://api.gladysgateway.com',
  localApiUrl: process.env.LOCAL_API_URL || window.location.origin,
  webSocketUrl: process.env.WEBSOCKET_URL,
  gatewayMode: process.env.GATEWAY_MODE === 'true',
  demoMode: process.env.DEMO_MODE === 'true',
  demoRequestTime: process.env.DEMO_REQUEST_TIME || 0,
  enedisForceUsagePoints: process.env.ENEDIS_FORCE_USAGE_POINTS
};

const config = process.env.NODE_ENV === 'production' ? prod : local;

export default config;
