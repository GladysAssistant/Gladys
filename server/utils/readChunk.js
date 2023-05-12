const { promisify } = require('util');
const fs = require('fs');
const { Buffer } = require('buffer');
const pify = require('pify');

const fsReadP = pify(fs.read, { multiArgs: true });
const fsOpenP = promisify(fs.open);
const fsCloseP = promisify(fs.close);

/**
 * @description Read one chunk of a file.
 * @param {string} filePath - The path of the file to read.
 * @param {object} options - Options.
 * @param {number} options.length - Length to read.
 * @param {number} options.startPosition - Where to start.
 * @returns {Promise} Return the chunk of the file.
 * @example const data = await readChunk('./file.txt', {length: 10, startPosition: 10});
 */
async function readChunk(filePath, { length, startPosition }) {
  const fileDescriptor = await fsOpenP(filePath, 'r');

  try {
    // eslint-disable-next-line prefer-const
    let [bytesRead, buffer] = await fsReadP(fileDescriptor, {
      buffer: Buffer.alloc(length),
      length,
      position: startPosition,
    });

    if (bytesRead < length) {
      buffer = buffer.slice(0, bytesRead);
    }

    return buffer;
  } finally {
    await fsCloseP(fileDescriptor);
  }
}

module.exports = {
  readChunk,
};
