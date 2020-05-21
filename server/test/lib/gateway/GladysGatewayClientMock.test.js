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
    getUsersInstance: fake.resolves([
      {
        id: '55b440f0-99fc-4ef8-bfe6-cd13adb4071e',
        name: 'Tony',
        rsa_public_key:
          'e1:6d:44:cb:f7:89:89:14:79:36:49:c1:65:3a:cc:ab:88:c7:20:93:55:c8:cf:a6:dd:d0:7e:b9:49:6f:56:f7',
        ecdsa_public_key:
          '85:22:77:36:a0:02:cd:0b:18:9d:bc:d7:df:ea:18:4d:c7:f1:70:b7:8e:7a:7d:e7:da:21:9e:55:62:67:54:3f',
        gladys_4_user_id: 'df033006-ee42-4b94-a324-3f558171c493',
        connected: false,
      },
    ]),
  };
};

module.exports = GladysGatewayClientMock;
