const { promisify } = require('util');
const childProcess = require('child_process');
const fs = require('fs');
const logger = require('./logger');

const MAX_BUFFER_SIZE = 20 * 1024 * 1024; // 20 MB

/**
 * @description Execute a command and return results.
 * @param {string} command - The command to execute.
 * @returns {Promise} Resolve if command resolve.
 * @example
 * exec('ls');
 */
function exec(command) {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, { maxBuffer: MAX_BUFFER_SIZE }, (err, stdout, stderr) => {
      if (err) {
        logger.debug(`Exec: Fail to execute command ${command}`);
        logger.debug(err);
        logger.debug(stderr);
        return reject(err);
      }

      return resolve(stdout);
    });
  });
}

const execFileAsync = promisify(childProcess.execFile);

/**
 * @description Execute a file with arguments (no shell).
 * @param {string} file - The file to execute.
 * @param {Array<string>} args - The arguments to pass.
 * @param {object} [options] - Options for the child process. Only `cwd` is honoured.
 * @returns {Promise<string>} Resolve with stdout if command succeeds.
 * @example
 * execFile('tar', ['-tzvf', 'file.tar.gz']);
 */
async function execFile(file, args, options = {}) {
  // only the options this helper needs are forwarded. It exists so the backup
  // and restore chain never sees a shell: spreading whatever the caller passes
  // would let a later one hand over `shell: true` and undo exactly that.
  const { cwd } = options;
  try {
    const { stdout } = await execFileAsync(file, args, { maxBuffer: MAX_BUFFER_SIZE, ...(cwd ? { cwd } : {}) });
    return stdout;
  } catch (err) {
    logger.debug(`ExecFile: Fail to execute ${file} ${args.join(' ')}`);
    logger.debug(err);
    logger.debug(err.stderr);
    throw err;
  }
}

/**
 * @description Execute a file with arguments (no shell) and stream its stdout to a file.
 * This is the shell-free equivalent of `exec('command > file')`: the output goes
 * straight to disk, so it is not bounded by the exec buffer and a backup of any
 * size can be decompressed.
 * @param {string} file - The file to execute.
 * @param {Array<string>} args - The arguments to pass.
 * @param {string} outputPath - The path of the file stdout is written to.
 * @returns {Promise<void>} Resolve when the process exited and the file is flushed.
 * @example
 * spawnToFile('gzip', ['-dc', 'backup.gz'], 'backup.db');
 */
function spawnToFile(file, args, outputPath) {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outputPath);
    const child = childProcess.spawn(file, args);
    let stderr = '';
    let settled = false;
    let processClosed = false;
    let streamFinished = false;

    const fail = (err) => {
      if (settled) {
        return;
      }
      settled = true;
      logger.debug(`SpawnToFile: Fail to execute ${file} ${args.join(' ')}`);
      logger.debug(err);
      logger.debug(stderr);
      writeStream.destroy();
      child.kill();
      reject(err);
    };

    // both the process exit and the flush of the output file must be waited for,
    // in whatever order they happen
    const resolveWhenDone = () => {
      if (settled || !processClosed || !streamFinished) {
        return;
      }
      settled = true;
      resolve();
    };

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', fail);
    // `pipe()` does not forward the errors of its source, and a stream without
    // an `error` listener throws: an error on either stdio pipe must reject the
    // promise, not take the process down
    child.stdout.on('error', fail);
    child.stderr.on('error', fail);
    writeStream.on('error', fail);
    writeStream.on('finish', () => {
      streamFinished = true;
      resolveWhenDone();
    });
    child.on('close', (code) => {
      if (code !== 0) {
        fail(new Error(`Command "${file}" exited with code ${code}: ${stderr}`));
        return;
      }
      processClosed = true;
      resolveWhenDone();
    });

    child.stdout.pipe(writeStream);
  });
}

module.exports = {
  exec,
  execFile,
  spawnToFile,
};
