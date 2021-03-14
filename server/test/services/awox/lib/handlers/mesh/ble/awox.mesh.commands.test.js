const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');

let randomBytes = [];
let checksumBytes = [];

const awoxUtils = require('../../../../../../../services/awox/lib/handlers/mesh/awox.mesh.utils');

const generateRandomBytes = () => Buffer.from(randomBytes);
const checksum = (sessioncode, nonce, payload) => {
  if (checksumBytes.length > 0) {
    return Buffer.from(checksumBytes);
  }
  return awoxUtils.checksum(sessioncode, nonce, payload);
};

const { generatePairCommand, generateCommandPacket, decryptPacket, cryptPayload } = proxyquire(
  '../../../../../../../services/awox/lib/handlers/mesh/awox.mesh.commands',
  {
    './awox.mesh.utils': { ...awoxUtils, generateRandomBytes, checksum },
  },
);

describe('awox.mesh.commands.generateCommandPacket', () => {
  beforeEach(() => {
    randomBytes = [];
    checksumBytes = [];
  });

  it('Generate command', () => {
    // Force random bytes
    randomBytes = [0xe7, 0xc7, 0xf9];

    const sessioncode = Buffer.from([
      0x45,
      0x96,
      0xf2,
      0xb9,
      0xa6,
      0x31,
      0x52,
      0x74,
      0x4f,
      0xae,
      0x9b,
      0xd,
      0xe7,
      0x34,
      0xca,
      0x48,
    ]);
    const peripheralUuid = 'a4c1380459d6';
    const code = [0xd0];
    const message = [0x01];

    const commandPacket = generateCommandPacket(peripheralUuid, sessioncode, { code, message });

    const expected = Buffer.from([
      0xe7,
      0xc7,
      0xf9,
      0xeb,
      0x24,
      0xed,
      0x4e,
      0x2e,
      0xcc,
      0xdb,
      0xf2,
      0x6b,
      0xc9,
      0xa3,
      0x31,
      0x58,
      0xd,
      0x12,
      0x5e,
      0x59,
    ]);

    expect(commandPacket).deep.eq(expected);
  });

  it('Generate color command', () => {
    // Force random bytes
    randomBytes = [0x65, 0x2a, 0x87];

    const sessioncode = Buffer.from([
      0x74,
      0xdc,
      0xcf,
      0xb6,
      0x1f,
      0x1e,
      0xe8,
      0x38,
      0x25,
      0x2c,
      0x11,
      0x25,
      0x97,
      0x01,
      0xf4,
      0xb9,
    ]);
    const peripheralUuid = 'a4c1380459d6';
    const code = [0xe2];
    const message = [0x04, 0xff, 0x00, 0xff];

    const commandPacket = generateCommandPacket(peripheralUuid, sessioncode, { code, message });

    const expected = Buffer.from([
      0x65,
      0x2a,
      0x87,
      0x82,
      0x1e,
      0x6e,
      0xe3,
      0xb9,
      0x84,
      0xf5,
      0xab,
      0x92,
      0x78,
      0xd5,
      0xa6,
      0xc8,
      0x2c,
      0xd6,
      0x8a,
      0xb5,
    ]);

    expect(commandPacket).deep.eq(expected);
  });
});

describe('awox.mesh.utils.decryptPacket', () => {
  beforeEach(() => {
    randomBytes = [];
    checksumBytes = [];
  });

  it('Decrypt packet', () => {
    // Force checksum
    checksumBytes = [0xaa];

    const sessioncode = Buffer.from([
      0x45,
      0x96,
      0xf2,
      0xb9,
      0xa6,
      0x31,
      0x52,
      0x74,
      0x4f,
      0xae,
      0x9b,
      0xd,
      0xe7,
      0x34,
      0xca,
      0x48,
    ]);
    const peripheralUuid = 'a4c1380459d6';

    const commandPacket = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0xaa, 0x07]);
    const result = decryptPacket(peripheralUuid, sessioncode, commandPacket);
    expect(result).deep.eq(commandPacket);
  });

  it('Decrypt invalid packet', () => {
    // Force checksum
    checksumBytes = [0xff];

    const sessioncode = Buffer.from([
      0x45,
      0x96,
      0xf2,
      0xb9,
      0xa6,
      0x31,
      0x52,
      0x74,
      0x4f,
      0xae,
      0x9b,
      0xd,
      0xe7,
      0x34,
      0xca,
      0x48,
    ]);
    const peripheralUuid = 'a4c1380459d6';

    const commandPacket = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0xaa, 0x07]);

    try {
      decryptPacket(peripheralUuid, sessioncode, commandPacket);
      expect.fail();
    } catch (e) {
      expect(e.message).eq('AwoX Mesh: invalid checksum from received data');
    }
  });
});

describe('awox.mesh.commands.cryptPayload', () => {
  beforeEach(() => {
    randomBytes = [];
    checksumBytes = [];
  });

  it('Crypt Payload', () => {
    const code = Buffer.from([
      0xdd,
      0x89,
      0x83,
      0xd7,
      0xa0,
      0x36,
      0x94,
      0x25,
      0x79,
      0x77,
      0x37,
      0xba,
      0x44,
      0xd4,
      0x22,
      0x54,
    ]);
    const nonce = Buffer.from([0xd6, 0x59, 0x04, 0x38, 0x01, 0xf0, 0x64, 0xd3]);
    const payload = Buffer.from([
      0x00,
      0x00,
      0xe2,
      0x60,
      0x01,
      0x04,
      0xff,
      0x00,
      0xff,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
    ]);

    const commandPacket = cryptPayload(code, nonce, payload);

    const expected = Buffer.from([
      0xac,
      0x55,
      0xb0,
      0xfe,
      0x01,
      0xe4,
      0x63,
      0x0a,
      0x5f,
      0x48,
      0x99,
      0x4f,
      0x0c,
      0xf6,
      0x7e,
    ]);

    expect(commandPacket).deep.eq(expected);
  });
});

describe('awox.mesh.commands.generatePairCommand', () => {
  beforeEach(() => {
    randomBytes = [];
    checksumBytes = [];
  });

  it('Generate pair command', () => {
    const defaultMeshName = 'meshName';
    const defaultMeshPassword = 'meshPassword';
    const defaultSessionRandom = Buffer.from([0xaa, 0xbb]);

    const result = generatePairCommand(defaultMeshName, defaultMeshPassword, defaultSessionRandom);
    const expected = Buffer.from([0x0c, 0xaa, 0xbb, 0xd3, 0xdf, 0xa6, 0x90, 0xd7, 0x63, 0xd4, 0x44]);

    expect(result).deep.eq(expected);
  });
});
