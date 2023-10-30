const { Error400 } = require('../../../utils/httpErrors');

const SESSION_ID_REGEX = /^camera-[a-zA-Z0-9-_]+$/;

// Session_id usually looks like "camera-7835d25d-b8ce-4824-a235-23637f778f83-39-50-13"
const validateSessionId = (sessionId) => {
  if (!SESSION_ID_REGEX.test(sessionId)) {
    throw new Error400('Invalid session id');
  }
};

const AUTHORIZED_FILENAMES = ['index.m3u8', 'index.m3u8.key', 'key_info_file.txt'];
const HLS_CHUNK_REGEX = /^index[0-9]+.ts$/;

const validateFilename = (filename) => {
  if (AUTHORIZED_FILENAMES.includes(filename)) {
    return;
  }

  if (!HLS_CHUNK_REGEX.test(filename)) {
    throw new Error400('Invalid filename');
  }
};

module.exports = {
  validateSessionId,
  validateFilename,
};
