const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

// Number of log lines we ask Docker to return. This is a hard cap to avoid
// loading several GB of logs in RAM on chatty containers. With ~200 bytes per
// line on average, 100k lines is roughly 20 MB.
const MAX_LOG_LINES = 100000;
// Cache logs snapshot for 10 minutes (downloads are usually quick)
const CACHE_TTL_MS = 10 * 60 * 1000;
// Maximum chunk size returned per request (256 KB)
// to stay well below Gladys Plus per-request size limit
const MAX_CHUNK_SIZE = 256 * 1024;

/**
 * @description Demultiplex a Docker logs buffer (non-TTY containers).
 * Docker streams logs as repeated frames:
 *   [STREAM_TYPE(1) | 0 | 0 | 0 | SIZE(4 BE)] + payload(SIZE).
 * For TTY containers, the buffer is raw text and is returned untouched.
 * @param {Buffer} buffer - Raw Docker logs buffer.
 * @returns {Buffer} Demultiplexed buffer.
 * @example
 * demuxDockerLogs(buffer);
 */
function demuxDockerLogs(buffer) {
  if (!buffer || buffer.length === 0) {
    return Buffer.alloc(0);
  }
  // Heuristic: Docker multiplexed frames start with stream type 1 (stdout) or 2 (stderr)
  // followed by 3 zero bytes. If first bytes don't match, assume TTY/raw.
  const looksMultiplexed =
    buffer.length >= 8 &&
    (buffer[0] === 0 || buffer[0] === 1 || buffer[0] === 2) &&
    buffer[1] === 0 &&
    buffer[2] === 0 &&
    buffer[3] === 0;
  if (!looksMultiplexed) {
    return buffer;
  }
  const parts = [];
  let offset = 0;
  while (offset + 8 <= buffer.length) {
    const size = buffer.readUInt32BE(offset + 4);
    offset += 8;
    if (offset + size > buffer.length) {
      // Truncated frame, stop here
      break;
    }
    parts.push(buffer.slice(offset, offset + size));
    offset += size;
  }
  return Buffer.concat(parts);
}

/**
 * @description Fetch the Gladys container logs as a Buffer.
 * Asks Docker for at most MAX_LOG_LINES lines so we never load the full
 * log history (potentially several GB) into RAM.
 * @returns {Promise<Buffer>} Demultiplexed logs buffer.
 * @example
 * await fetchGladysLogsBuffer.call(this);
 */
async function fetchGladysLogsBuffer() {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  const containerId = await this.getGladysContainerId();
  const raw = await this.getContainerLogs(containerId, {
    follow: false,
    tail: MAX_LOG_LINES,
    timestamps: true,
  });
  const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw || '');
  return demuxDockerLogs(buffer);
}

/**
 * @description Get a chunk of the Gladys container logs.
 * The full logs (capped to the last 20 MB) are fetched once and cached
 * in memory so they can be retrieved chunk by chunk by the client.
 * @param {object} options - Options.
 * @param {number} [options.offset=0] - Byte offset in the cached log buffer.
 * @param {number} [options.limit] - Maximum number of bytes to return (capped to MAX_CHUNK_SIZE).
 * @param {boolean} [options.refresh=false] - Force refreshing the cached buffer.
 * @returns {Promise<object>} Resolve with size, offset, length, content_base64 and encoding.
 * @example
 * await gladys.system.getGladysLogs({ offset: 0, limit: 65536, refresh: true });
 */
async function getGladysLogs({ offset = 0, limit = MAX_CHUNK_SIZE, refresh = false } = {}) {
  const safeOffset = Math.max(0, Number.isFinite(offset) ? Math.floor(offset) : 0);
  const safeLimit = Math.min(MAX_CHUNK_SIZE, Math.max(0, Number.isFinite(limit) ? Math.floor(limit) : MAX_CHUNK_SIZE));
  const now = Date.now();
  const cacheValid =
    this.gladysLogsCache && this.gladysLogsCache.buffer && now - this.gladysLogsCache.fetchedAt < CACHE_TTL_MS;
  if (refresh || !cacheValid) {
    logger.debug('Refreshing Gladys logs cache');
    const buffer = await fetchGladysLogsBuffer.call(this);
    this.gladysLogsCache = {
      buffer,
      fetchedAt: now,
    };
  }
  const { buffer } = this.gladysLogsCache;
  const size = buffer.length;
  const start = Math.min(safeOffset, size);
  const end = Math.min(start + safeLimit, size);
  const chunk = buffer.slice(start, end);
  return {
    size,
    offset: start,
    length: chunk.length,
    encoding: 'base64',
    content_base64: chunk.toString('base64'),
  };
}

module.exports = {
  getGladysLogs,
  demuxDockerLogs,
  MAX_LOG_LINES,
  MAX_CHUNK_SIZE,
  CACHE_TTL_MS,
};
