const { expect } = require('chai');
const {
  generateRandomBytes,
  generateSessionKey,
  encrypt,
  nameAndPasswordEncrypt,
  checksum,
  periperalUuidToBuffer,
  extractCredentials,
} = require('../../../../../../services/awox/lib/handlers/mesh/awox.mesh.utils');

const { DEVICE_PARAMS } = require('../../../../../../services/awox/lib/handlers/mesh/awox.mesh.constants');
const { NoValuesFoundError } = require('../../../../../../utils/coreErrors');

describe('awox.mesh.utils.periperalUuidToBuffer', () => {
  it('Check buffer', () => {
    const peripheralUuid = 'a4c1380459d6';
    const result = periperalUuidToBuffer(peripheralUuid);

    const expected = Buffer.from([0xd6, 0x59, 0x04, 0x38, 0xc1, 0xa4]);

    expect(result).deep.eq(expected);
  });
});

describe('awox.mesh.utils.generateRandomBytes', () => {
  it('Check random', () => {
    const rand41 = generateRandomBytes();
    const rand42 = generateRandomBytes();

    expect(rand41).to.be.lengthOf(8);
    expect(rand42).to.be.lengthOf(8);

    expect(rand41).not.deep.eq(rand42);
  });

  it('Check length', () => {
    const rand2 = generateRandomBytes(2);
    const rand8 = generateRandomBytes(8);

    expect(rand2).to.be.lengthOf(2);
    expect(rand8).to.be.lengthOf(8);
  });
});

describe('awox.mesh.utils.generateSessionKey', () => {
  it('Generate session key', () => {
    const defaultMeshName = 'meshName';
    const defaultMeshPassword = 'meshPassword';
    const defaultSessionRandom = Buffer.from([0x9f, 0x10, 0xb9, 0xf2, 0x6c, 0xe3, 0xcd, 0xf9]);
    const defaultSessionResponse = Buffer.from([
      0x01,
      0x02,
      0x03,
      0x04,
      0x05,
      0x06,
      0x07,
      0x08,
      0x09,
      0x10,
      0x11,
      0x12,
      0x13,
      0x14,
      0x15,
      0x16,
    ]);
    const sessionKey = generateSessionKey(
      defaultMeshName,
      defaultMeshPassword,
      defaultSessionRandom,
      defaultSessionResponse,
    );

    const expected = Buffer.from([
      0x7b,
      0x81,
      0x0d,
      0x63,
      0xbc,
      0x65,
      0xd4,
      0x13,
      0x2a,
      0xf6,
      0xa2,
      0x7d,
      0x33,
      0xa8,
      0xf3,
      0x87,
    ]);
    expect(sessionKey).deep.eq(expected);
  });
});

describe('awox.mesh.utils.encrypt', () => {
  it('Encrypt from buffer', () => {
    const key = Buffer.from([0x0c, 0xaa, 0xbb, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8]);
    const toBeEncrypted = Buffer.from([
      0x01,
      0x02,
      0x03,
      0x04,
      0x05,
      0x06,
      0x07,
      0x08,
      0x09,
      0x10,
      0x11,
      0x12,
      0x13,
      0x14,
      0x15,
      0x16,
    ]);
    const encryption = encrypt(key, toBeEncrypted);

    const expected = Buffer.from([
      0xdd,
      0x4d,
      0x28,
      0xd5,
      0x72,
      0x4a,
      0xc1,
      0x9d,
      0x69,
      0x33,
      0xb3,
      0x93,
      0xde,
      0x4f,
      0xf0,
      0xfc,
    ]);
    expect(encryption).deep.eq(expected);
  });

  it('Encrypt from buffer 2nd try', () => {
    const key = Buffer.from([
      0x23,
      0x84,
      0xf9,
      0x0f,
      0x68,
      0xb9,
      0xed,
      0x5e,
      0x11,
      0x99,
      0x3d,
      0x2a,
      0xaa,
      0x0f,
      0xa2,
      0x80,
    ]);
    const toBeEncrypted = Buffer.from([
      0xa5,
      0x93,
      0x07,
      0x6f,
      0x00,
      0x42,
      0xe6,
      0x08,
      0x2c,
      0xdd,
      0x21,
      0xe3,
      0x79,
      0xf8,
      0x3e,
      0x4b,
    ]);
    const encryption = encrypt(key, toBeEncrypted);

    const expected = Buffer.from([
      0xd0,
      0xb0,
      0x87,
      0x5d,
      0x85,
      0x51,
      0x5b,
      0xdc,
      0xc5,
      0xa4,
      0x63,
      0xba,
      0x4d,
      0xcb,
      0x10,
      0x7b,
    ]);
    expect(encryption).deep.eq(expected);
  });

  it('Encrypt from buffer 3rd try', () => {
    const key = Buffer.from([
      0x8d,
      0x85,
      0x66,
      0x3c,
      0x51,
      0x98,
      0x21,
      0x87,
      0x0d,
      0x28,
      0xb9,
      0x0f,
      0x43,
      0x2b,
      0x03,
      0xf7,
    ]);
    const toBeEncrypted = Buffer.from([
      0x85,
      0xfd,
      0x61,
      0x6c,
      0x78,
      0xde,
      0xce,
      0x08,
      0x52,
      0x78,
      0x76,
      0x4c,
      0xab,
      0x4a,
      0xd3,
      0xd8,
    ]);
    const encryption = encrypt(key, toBeEncrypted);

    const expected = Buffer.from([
      0xf5,
      0xed,
      0x1e,
      0xc5,
      0xa7,
      0x42,
      0x3b,
      0x3e,
      0xfc,
      0x7f,
      0x86,
      0x5c,
      0x8d,
      0x92,
      0x5e,
      0x0b,
    ]);
    expect(encryption).deep.eq(expected);
  });
});

describe('awox.mesh.utils.nameAndPasswordEncrypt', () => {
  it('Encrypt name and password', () => {
    const defaultMeshName = 'veryBigName';
    const defaultMeshPassword = 'andMorelessLongPassword';
    const nameAndPasswordEncrypted = nameAndPasswordEncrypt(defaultMeshName, defaultMeshPassword);

    const expected = Buffer.from([
      0x17,
      0x0b,
      0x16,
      0x34,
      0x2d,
      0x1b,
      0x02,
      0x22,
      0x04,
      0x1e,
      0x16,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
    ]);
    expect(nameAndPasswordEncrypted).deep.eq(expected);
  });
});

describe('awox.mesh.utils.checksum', () => {
  it('Checksum', () => {
    const key = Buffer.from([
      0x4d,
      0x86,
      0xd0,
      0x0c,
      0x24,
      0x73,
      0x40,
      0x55,
      0x2a,
      0x3f,
      0x44,
      0x42,
      0x60,
      0x52,
      0x7f,
      0xb8,
    ]);
    const nonce = Buffer.from([0xd6, 0x59, 0x04, 0x80, 0x60, 0xa6, 0x00, 0x00]);
    const payload = Buffer.from([0xdc, 0x60, 0x01, 0xd6, 0x4d, 0x03, 0x7f, 0x7f, 0x64, 0xff, 0x00, 0xff, 0x00]);

    const commandPacket = checksum(key, nonce, payload);

    const expected = Buffer.from([
      0xfe,
      0x9b,
      0xc9,
      0x9d,
      0xc9,
      0x94,
      0xe9,
      0x75,
      0x40,
      0xb8,
      0x2f,
      0x1c,
      0x0d,
      0x33,
      0xe1,
      0x49,
    ]);

    expect(commandPacket).deep.eq(expected);
  });
});

describe('awox.mesh.utils.extractCredentials', () => {
  it('Extract with succes', () => {
    const device = {
      params: [
        {
          name: DEVICE_PARAMS.MESH_NAME,
          value: 'meshName',
        },
        {
          name: DEVICE_PARAMS.MESH_PASSWORD,
          value: 'meshPassword',
        },
      ],
    };
    const credentials = extractCredentials(device);
    const expected = {
      user: 'meshName',
      password: 'meshPassword',
    };

    expect(credentials).deep.eq(expected);
  });

  it('Extract error (no user)', () => {
    const device = {
      params: [
        {
          name: DEVICE_PARAMS.MESH_PASSWORD,
          value: 'meshPassword',
        },
      ],
    };

    try {
      extractCredentials(device);
      expect.fail();
    } catch (e) {
      expect(e).instanceOf(NoValuesFoundError);
    }
  });

  it('Extract error (no password)', () => {
    const device = {
      params: [
        {
          name: DEVICE_PARAMS.MESH_NAME,
          value: 'meshName',
        },
      ],
    };

    try {
      extractCredentials(device);
      expect.fail();
    } catch (e) {
      expect(e).instanceOf(NoValuesFoundError);
    }
  });
});
