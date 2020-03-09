const fs = require('fs');
const { fake } = require('sinon');

const GladysGatewayClientMock = function() {
  return {
    login: fake.resolves({
      two_factor_token: 'token',
    }),
    loginInstance: fake.resolves({}),
    createInstance: fake.resolves({
      instance: {
        id: '25239392-debf-40c9-9363-fc8d3b9ebbbe',
        refresh_token: 'token',
      },
      rsaPrivateKeyJwk: {},
      ecdsaPrivateKeyJwk: {},
      rsaPublicKeyJwk: {},
      ecdsaPublicKeyJwk: {},
    }),
    instanceConnect: fake.resolves({}),
    uploadBackup: fake.resolves({
      success: true,
    }),
    getBackups: fake.resolves([
      {
        id: '74dc8d58-3997-484a-a791-53e5b07279d7',
        account_id: 'b2d23f66-487d-493f-8acb-9c8adb400def',
        path: 'http://backup-url',
        size: 1000,
        created_at: '2018-10-16T02:21:25.901Z',
        updated_at: '2018-10-16T02:21:25.901Z',
        is_deleted: false,
      },
    ]),
    downloadBackup: (backupUrl, writeStream) => {
      const readStream = fs.createReadStream(backupUrl);
      readStream.pipe(writeStream);
      return new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    },
    getLatestGladysVersion: fake.resolves({
      name: 'v4.0.0-alpha',
      created_at: '2018-10-16T02:21:25.901Z',
    }),
    disconnect: fake.returns(null),
    newEventInstance: fake.returns(null),
    generateFingerprint: fake.resolves('fingerprint'),
  };
};

module.exports = GladysGatewayClientMock;
