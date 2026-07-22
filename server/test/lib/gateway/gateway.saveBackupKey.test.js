const { assert: chaiAssert } = require('chai');
const sinon = require('sinon');

const { saveBackupKey } = require('../../../lib/gateway/gateway.saveBackupKey');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

const { fake, assert } = sinon;

describe('gateway.saveBackupKey', () => {
  let gateway;

  beforeEach(() => {
    gateway = {
      variable: {
        setValue: fake.resolves(null),
      },
    };
  });

  it('should save the backup key', async () => {
    await saveBackupKey.call(gateway, 'my-super-backup-key');
    assert.calledOnceWithExactly(
      gateway.variable.setValue,
      SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_KEY,
      'my-super-backup-key',
    );
  });

  it('should reject when the backup key is missing', async () => {
    const promise = saveBackupKey.call(gateway);
    await chaiAssert.isRejected(promise, 'BACKUP_KEY_REQUIRED');
    assert.notCalled(gateway.variable.setValue);
  });

  it('should reject when the backup key is an empty string', async () => {
    const promise = saveBackupKey.call(gateway, '');
    await chaiAssert.isRejected(promise, 'BACKUP_KEY_REQUIRED');
    assert.notCalled(gateway.variable.setValue);
  });

  it('should reject when the backup key is not a string', async () => {
    const promise = saveBackupKey.call(gateway, { key: 'my-super-backup-key' });
    await chaiAssert.isRejected(promise, 'BACKUP_KEY_REQUIRED');
    assert.notCalled(gateway.variable.setValue);
  });
});
