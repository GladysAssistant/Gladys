const { expect } = require('chai');
const { execFile } = require('../../utils/childProcess');

describe('childProcess', () => {
  describe('execFile', () => {
    it('should execute a command successfully', async () => {
      const result = await execFile('echo', ['hello']);
      expect(result.trim()).to.equal('hello');
    });

    it('should reject when command fails', async () => {
      let error;
      try {
        await execFile('tar', ['-tzvf', '/nonexistent/file.tar.gz']);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an('error');
      expect(error.code).to.not.equal(0);
    });
  });
});
