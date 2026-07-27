const MAX_REASON_LENGTH = 400;

/**
 * @description Build a concise ffmpeg failure reason from stderr / error message.
 * @param {Error} error - Error thrown by child_process.
 * @param {string} [stderr] - Stderr output from ffmpeg.
 * @returns {string} Concise human-readable failure reason.
 * @example
 * formatFfmpegError(error, stderr);
 */
function formatFfmpegError(error, stderr) {
  const details = [];
  if (error && error.signal) {
    details.push(`signal=${error.signal}`);
  } else if (error && error.code !== null && error.code !== undefined) {
    details.push(`code=${error.code}`);
  }

  const raw = (stderr || (error && error.stderr) || (error && error.message) || String(error)).toString();
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith('ffmpeg version'))
    .filter((line) => !line.startsWith('configuration:'))
    .filter((line) => !line.startsWith('libav'))
    .filter((line) => !/^built with /i.test(line))
    .filter((line) => !/^Command failed:/i.test(line));

  let reason = lines.slice(0, 2).join(' — ');
  if (!reason) {
    reason = (error && error.message) || String(error);
  }

  reason = reason.replace(/\s+/g, ' ').trim();
  if (reason.length > MAX_REASON_LENGTH) {
    reason = `${reason.slice(0, MAX_REASON_LENGTH)}…`;
  }

  const suffix = details.length ? ` (${details.join(', ')})` : '';
  return `ffmpeg failed${suffix}: ${reason}`;
}

module.exports = {
  formatFfmpegError,
};
