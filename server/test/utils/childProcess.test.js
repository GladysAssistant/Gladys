const { expect } = require('chai');
const path = require('path');
const os = require('os');
const fse = require('fs-extra');
const { execFile, spawnToFile } = require('../../utils/childProcess');

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

    it('should run the command in the given working directory', async () => {
      const result = await execFile('pwd', [], { cwd: os.tmpdir() });
      expect(result.trim()).to.contain('tmp');
    });
  });

  describe('spawnToFile', () => {
    let workingFolder;

    beforeEach(async () => {
      workingFolder = await fse.mkdtemp(path.join(os.tmpdir(), 'gladys-spawn-to-file-'));
    });

    afterEach(async () => {
      await fse.remove(workingFolder);
    });

    it('should write the stdout of the command to the output file', async () => {
      const sourcePath = path.join(workingFolder, 'source.txt');
      const outputPath = path.join(workingFolder, 'output.txt');
      await fse.writeFile(sourcePath, 'gladys');
      await execFile('gzip', [sourcePath]);

      await spawnToFile('gzip', ['-dc', `${sourcePath}.gz`], outputPath);

      expect(await fse.readFile(outputPath, 'utf-8')).to.equal('gladys');
    });

    it('should reject when the command exits with a non-zero code', async () => {
      const notGzippedPath = path.join(workingFolder, 'not-a-gzip.gz');
      const outputPath = path.join(workingFolder, 'output.db');
      await fse.writeFile(notGzippedPath, 'this is not gzipped');

      let error;
      try {
        await spawnToFile('gzip', ['-dc', notGzippedPath], outputPath);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an('error');
      // the stderr of the command is reported back to the caller
      expect(error.message).to.contain('gzip');
    });

    it('should reject when the command cannot be spawned', async () => {
      const outputPath = path.join(workingFolder, 'output.db');

      let error;
      try {
        await spawnToFile('a-command-that-does-not-exist', ['-dc'], outputPath);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an('error');
      expect(error.code).to.equal('ENOENT');
    });

    it('should reject when the output file cannot be written', async () => {
      let error;
      try {
        await spawnToFile('echo', ['hello'], path.join(workingFolder, 'missing-folder', 'output.db'));
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an('error');
      expect(error.code).to.equal('ENOENT');
    });
  });
});
