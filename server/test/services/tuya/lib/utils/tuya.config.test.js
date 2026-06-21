const { expect } = require('chai');
const { buildConfigHash } = require('../../../../../services/tuya/lib/utils/tuya.config');

describe('tuya.config.buildConfigHash', () => {
  it('returns a stable hash for a complete configuration', () => {
    const hash1 = buildConfigHash({
      endpoint: 'eu',
      accessKey: 'access',
      secretKey: 'secret',
      appAccountId: 'uid-1',
    });
    const hash2 = buildConfigHash({
      endpoint: 'eu',
      accessKey: 'access',
      secretKey: 'secret',
      appAccountId: 'uid-1',
    });
    expect(hash1)
      .to.be.a('string')
      .with.lengthOf(64);
    expect(hash1).to.equal(hash2);
  });

  it('produces different hashes for different configurations', () => {
    const hashA = buildConfigHash({ endpoint: 'eu', accessKey: 'a', secretKey: 's', appAccountId: 'u' });
    const hashB = buildConfigHash({ endpoint: 'us', accessKey: 'a', secretKey: 's', appAccountId: 'u' });
    expect(hashA).to.not.equal(hashB);
  });

  it('falls back to empty strings on missing fields', () => {
    const hashEmpty = buildConfigHash({});
    const hashAllEmpty = buildConfigHash({ endpoint: '', accessKey: '', secretKey: '', appAccountId: '' });
    expect(hashEmpty).to.equal(hashAllEmpty);
  });

  it('uses the default empty config when called with no argument', () => {
    const hashDefault = buildConfigHash();
    const hashEmpty = buildConfigHash({});
    expect(hashDefault).to.equal(hashEmpty);
  });

  it('treats each missing field independently', () => {
    const hashNoEndpoint = buildConfigHash({ accessKey: 'a', secretKey: 's', appAccountId: 'u' });
    const hashNoAccess = buildConfigHash({ endpoint: 'eu', secretKey: 's', appAccountId: 'u' });
    const hashNoSecret = buildConfigHash({ endpoint: 'eu', accessKey: 'a', appAccountId: 'u' });
    const hashNoUid = buildConfigHash({ endpoint: 'eu', accessKey: 'a', secretKey: 's' });
    const allDistinct = new Set([hashNoEndpoint, hashNoAccess, hashNoSecret, hashNoUid]);
    expect(allDistinct.size).to.equal(4);
  });
});
