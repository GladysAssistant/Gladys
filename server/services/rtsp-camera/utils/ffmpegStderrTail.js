const CAMERA_URL_PLACEHOLDER = 'CAMERA_URL';
const SECRET_PLACEHOLDER = '***';
// Number of lines kept to explain why ffmpeg failed: the reason is in its last lines
const MAX_REASON_LINES = 3;
// A kept line is cut to this length, after it has been redacted
const MAX_LINE_LENGTH = 500;
// A line still not finished at this length is not kept: we skip it up to its end
const MAX_PENDING_LINE_LENGTH = 4000;
// "scheme://user:password@": whatever the URL, the credentials it carries are hidden
const URL_CREDENTIALS_REGEX = /([a-z][a-z0-9+.-]*:\/\/)[^\s/'"]*@/gi;

/**
 * @description List the strings of the camera URL that must never be logged, with what replaces them.
 * The longest ones come first, so that the whole URL is replaced before the password it contains.
 * @param {string} cameraUrl - The URL of the camera, which can contain its credentials.
 * @returns {Array} The [secret, placeholder] pairs.
 * @example
 * getSecrets('rtsp://admin:pass@192.168.1.10/live');
 */
function getSecrets(cameraUrl) {
  const secrets = [];
  if (!cameraUrl) {
    return secrets;
  }
  secrets.push([cameraUrl, CAMERA_URL_PLACEHOLDER]);
  let password = '';
  try {
    ({ password } = new URL(cameraUrl));
  } catch (e) {
    // Not a URL Node can parse: only the whole URL and the generic credentials pattern are hidden
  }
  if (password) {
    secrets.push([password, SECRET_PLACEHOLDER]);
    try {
      secrets.push([decodeURIComponent(password), SECRET_PLACEHOLDER]);
    } catch (e) {
      // A malformed percent-encoding: the password is hidden as written in the URL
    }
  }
  return secrets.sort((a, b) => b[0].length - a[0].length);
}

/**
 * @description Keep the last lines ffmpeg writes on stderr, without the credentials of the camera.
 * Each line is redacted as a whole before it is cut or dropped, so that a cut can never leave
 * a part of the URL or of the password behind.
 * @param {string} cameraUrl - The URL of the camera, which can contain its credentials.
 * @returns {object} `push(data)` adds a chunk of stderr and returns its finished lines, redacted;
 * `getReason()` returns the last lines, redacted, joined in one string.
 * @example
 * const stderrTail = createFfmpegStderrTail('rtsp://admin:pass@192.168.1.10/live');
 * stderrTail.push('[rtsp @ 0x55] rtsp://admin:pass@192.168.1.10/live: Connection refused\n');
 * stderrTail.getReason(); // "[rtsp @ 0x55] CAMERA_URL: Connection refused"
 */
function createFfmpegStderrTail(cameraUrl) {
  const secrets = getSecrets(cameraUrl);
  const lastLines = [];
  let pendingLine = '';
  let skippingLongLine = false;

  const redact = (line) =>
    secrets
      .reduce((redacted, [secret, placeholder]) => redacted.split(secret).join(placeholder), line)
      .replace(URL_CREDENTIALS_REGEX, `$1${SECRET_PLACEHOLDER}@`)
      .trim();

  const keepLine = (line) => {
    const redactedLine = redact(line);
    if (redactedLine.length === 0) {
      return null;
    }
    lastLines.push(redactedLine.slice(0, MAX_LINE_LENGTH));
    if (lastLines.length > MAX_REASON_LINES) {
      lastLines.shift();
    }
    return redactedLine;
  };

  const push = (data) => {
    // ffmpeg rewrites its progress line with "\r": it ends a line too
    const lines = `${pendingLine}${data}`.split(/\r\n|\r|\n/);
    pendingLine = lines.pop();
    const finishedLines = [];
    lines.forEach((line) => {
      if (skippingLongLine) {
        // The end of a line too long to be kept
        skippingLongLine = false;
        return;
      }
      const redactedLine = keepLine(line);
      if (redactedLine !== null) {
        finishedLines.push(redactedLine);
      }
    });
    if (pendingLine.length > MAX_PENDING_LINE_LENGTH) {
      pendingLine = '';
      skippingLongLine = true;
    }
    return finishedLines;
  };

  const getReason = () => {
    // The last line can end without a line break
    if (!skippingLongLine && pendingLine.length > 0) {
      keepLine(pendingLine);
      pendingLine = '';
    }
    return lastLines.join(' — ');
  };

  return {
    push,
    getReason,
  };
}

module.exports = {
  createFfmpegStderrTail,
};
