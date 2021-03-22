const { assert } = require('chai');
const { basePath } = require('../../../../services/zigbee2mqtt/utils/basePath');

describe('zigbee2mqtt basePath', () => {
  it('should return default basePath', () => {
    delete process.env.SQLITE_FILE_PATH;
    const result = basePath();
    return assert.deepEqual(result, '/var/lib/gladysassistant');
  });
  it('should return basePath from SQLITE_FILE_PATH', () => {
    process.env.SQLITE_FILE_PATH = '/var/lib/dummy_directory/gladys.db';
    const result = basePath();
    return assert.deepEqual(result, '/var/lib/dummy_directory');
  });
});
