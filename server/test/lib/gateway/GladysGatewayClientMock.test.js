const fs = require('fs');
const { fake } = require('sinon');

class GladysGatewayClientMock {}

GladysGatewayClientMock.prototype.login = fake.resolves({
  two_factor_token: 'token',
});

// AUTHENTICATION
GladysGatewayClientMock.prototype.loginInstance = fake.resolves({});
GladysGatewayClientMock.prototype.createInstance = fake.resolves({
  instance: {
    id: '25239392-debf-40c9-9363-fc8d3b9ebbbe',
    refresh_token: 'token',
  },
  rsaPrivateKeyJwk: {},
  ecdsaPrivateKeyJwk: {},
  rsaPublicKeyJwk: {},
  ecdsaPublicKeyJwk: {},
});
GladysGatewayClientMock.prototype.instanceConnect = fake.resolves({});

// BACKUPS
GladysGatewayClientMock.prototype.uploadBackup = fake.resolves({
  success: true,
});

GladysGatewayClientMock.prototype.getBackups = fake.resolves([
  {
    id: '74dc8d58-3997-484a-a791-53e5b07279d7',
    account_id: 'b2d23f66-487d-493f-8acb-9c8adb400def',
    path: 'http://backup-url',
    size: 1000,
    created_at: '2018-10-16T02:21:25.901Z',
    updated_at: '2018-10-16T02:21:25.901Z',
    is_deleted: false,
  },
]);

GladysGatewayClientMock.prototype.downloadBackup = (backupUrl, writeStream) => {
  const readStream = fs.createReadStream(backupUrl);
  readStream.pipe(writeStream);
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
};

GladysGatewayClientMock.prototype.getLatestGladysVersion = fake.resolves({
  name: 'v4.0.0-alpha',
  created_at: '2018-10-16T02:21:25.901Z',
});

GladysGatewayClientMock.prototype.disconnect = fake.returns(null);

module.exports = GladysGatewayClientMock;
