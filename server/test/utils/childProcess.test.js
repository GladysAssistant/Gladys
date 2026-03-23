const { expect } = require('chai');
const { execFile } = require('../../utils/childProcess');

describe('childProcess', () => {
  describe('execFile', () => {
    it('should execute a command successfully', async () => {
      const result = await execFile('echo', ['hello']);
      expect(result.trim()).to.equal('hello');
    });

    it('should reject when command fails', async () => {
      try {
        await execFile('tar', ['-tzvf', '/nonexistent/file.tar.gz']);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.code).to.not.equal(0);
      }
    });
  });
});
