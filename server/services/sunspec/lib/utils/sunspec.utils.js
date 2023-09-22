/**
 * @description Trim the input string.
 * @param {string} value - The value to trim.
 * @returns {string} The value without space character.
 * @example trimString('SunSpec      ')
 */
function trimString(value) {
  return value.replace(/^[\s\uFEFF\xA0\0]+|[\s\uFEFF\xA0\0]+$/g, '');
}

/**
 * @description Read a string from data buffer.
 * @param {Buffer} data - The sunspec register data buffer.
 * @param {number} offset - The sunspec offset.
 * @param {number} length - The sunspec length.
 * @returns {string} The string.
 * @example readString(Buffer, 1, 2)
 */
function readString(data, offset, length) {
  return trimString(data.subarray(offset * 2, (offset + length) * 2).toString());
}

/**
 * @description Read an integer from data buffer.
 * @param {Buffer} data - The sunspec register data buffer.
 * @param {number} offset - The sunspec offset.
 * @returns {number} The integer.
 * @example readUInt16(Buffer, 1)
 */
function readUInt16(data, offset) {
  return data.readUInt16BE(offset * 2);
}

/**
 * @description Read an integer from data buffer.
 * @param {Buffer} data - The sunspec register data buffer.
 * @param {number} offset - The sunspec offset.
 * @returns {number} The integer.
 * @example readInt16(Buffer, 1)
 */
function readInt16(data, offset) {
  return data.readInt16BE(offset * 2);
}

/**
 * @description Read an integer from data buffer.
 * @param {Buffer} data - The sunspec register data buffer.
 * @param {number} offset - The sunspec offset.
 * @returns {number} The integer.
 * @example readUInt32(Buffer, 1)
 */
function readUInt32(data, offset) {
  return data.readUInt32BE(offset * 2);
}

module.exports = {
  readString,
  readInt16,
  readUInt16,
  readUInt32,
  trimString,
};
