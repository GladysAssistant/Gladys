const { expect } = require('chai');
const { formatFfmpegError } = require('../../../services/rtsp-camera/utils/formatFfmpegError');

describe('rtsp-camera formatFfmpegError', () => {
  it('should extract a concise reason from dyld stderr', () => {
    const error = Object.assign(new Error('Command failed: ffmpeg -i http://example.com'), {
      signal: 'SIGABRT',
      code: null,
    });
    const stderr = `dyld[23876]: Library not loaded: /opt/homebrew/opt/x265/lib/libx265.215.dylib
  Referenced from: /opt/homebrew/Cellar/ffmpeg/8.1/bin/ffmpeg
  Reason: tried: '/opt/homebrew/opt/x265/lib/libx265.215.dylib' (no such file), '/opt/homebrew/Cellar/x265/4.2/lib/libx265.215.dylib' (no such file)`;

    const message = formatFfmpegError(error, stderr);

    expect(message).to.equal(
      'ffmpeg failed (signal=SIGABRT): dyld[23876]: Library not loaded: /opt/homebrew/opt/x265/lib/libx265.215.dylib — Referenced from: /opt/homebrew/Cellar/ffmpeg/8.1/bin/ffmpeg',
    );
    expect(message).to.not.include('tried:');
    expect(message).to.not.include('Command failed');
  });

  it('should include exit code when no signal is present', () => {
    const error = Object.assign(new Error('Command failed: ffmpeg'), {
      code: 1,
    });
    const message = formatFfmpegError(error, 'Connection refused');

    expect(message).to.equal('ffmpeg failed (code=1): Connection refused');
  });

  it('should skip ffmpeg banner lines in stderr', () => {
    const error = new Error('Command failed: ffmpeg');
    const stderr = `ffmpeg version 6.0 Copyright (c) 2000-2023
configuration: --enable-gpl
libavutil 58. 2.100
built with gcc
[rtsp @ 0x123] Unable to open stream`;

    const message = formatFfmpegError(error, stderr);

    expect(message).to.equal('ffmpeg failed: [rtsp @ 0x123] Unable to open stream');
  });

  it('should fall back to error message when stderr is empty', () => {
    const error = new Error('broken url');
    const message = formatFfmpegError(error, '');

    expect(message).to.equal('ffmpeg failed: broken url');
  });

  it('should use error.stderr when stderr argument is missing', () => {
    const error = Object.assign(new Error('Command failed'), {
      stderr: 'Server returned 404 Not Found',
    });
    const message = formatFfmpegError(error);

    expect(message).to.equal('ffmpeg failed: Server returned 404 Not Found');
  });

  it('should fall back to stringified error when message is empty', () => {
    const message = formatFfmpegError('unexpected failure');

    expect(message).to.equal('ffmpeg failed: unexpected failure');
  });

  it('should fall back when stderr only contains filtered banner lines', () => {
    const error = new Error('Command failed: ffmpeg -i cam');
    const message = formatFfmpegError(error, 'ffmpeg version 6.0\nconfiguration: --enable-gpl');

    expect(message).to.equal('ffmpeg failed: Command failed: ffmpeg -i cam');
  });

  it('should truncate very long reasons', () => {
    const error = new Error('Command failed');
    const stderr = `Error: ${'x'.repeat(500)}`;
    const message = formatFfmpegError(error, stderr);

    expect(message.length).to.be.lessThan(450);
    expect(message).to.match(/…$/);
  });
});
