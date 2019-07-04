const local = {
  gladysGatewayApiUrl: process.env.GLADYS_GATEWAY_API_URL || 'https://api.gladysgateway.com',
  localApiUrl: process.env.LOCAL_API_URL || 'http://localhost:1443',
  webSocketUrl: process.env.WEBSOCKET_URL || 'ws://localhost:1443',
  gatewayMode: process.env.GATEWAY_MODE === 'true',
  demoMode: process.env.DEMO_MODE === 'true'
};

const prod = {
  gladysGatewayApiUrl: process.env.GLADYS_GATEWAY_API_URL || 'https://api.gladysgateway.com',
  localApiUrl: process.env.LOCAL_API_URL,
  webSocketUrl: process.env.WEBSOCKET_URL,
  gatewayMode: process.env.GATEWAY_MODE === 'true',
  demoMode: process.env.DEMO_MODE === 'true'
};

const config = process.env.NODE_ENV === 'production' ? prod : local;

export default config;
