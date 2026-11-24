const { expect } = require('chai');
const { createFfmpegStderrTail } = require('../../../services/rtsp-camera/utils/ffmpegStderrTail');

const CAMERA_URL = 'rtsp://admin:p%40ss@192.168.1.10:554/live';

describe('rtsp-camera ffmpegStderrTail', () => {
  it('should keep the last 3 lines, whatever the line breaks', () => {
    const stderrTail = createFfmpegStderrTail(CAMERA_URL);
    const finishedLines = stderrTail.push('line 1\nline 2\r\n\n  line 3  \rline');
    expect(finishedLines).to.deep.equal(['line 1', 'line 2', 'line 3']);
    expect(stderrTail.push(' 4\n')).to.deep.equal(['line 4']);
    expect(stderrTail.getReason()).to.equal('line 2 — line 3 — line 4');
  });
  it('should keep a last line without line break', () => {
    const stderrTail = createFfmpegStderrTail(CAMERA_URL);
    expect(stderrTail.push(Buffer.from('Stream mapping:\nConversion failed!'))).to.deep.equal(['Stream mapping:']);
    expect(stderrTail.getReason()).to.equal('Stream mapping: — Conversion failed!');
    expect(stderrTail.getReason()).to.equal('Stream mapping: — Conversion failed!');
  });
  it('should return an empty reason when ffmpeg wrote nothing', () => {
    const stderrTail = createFfmpegStderrTail(CAMERA_URL);
    expect(stderrTail.push('')).to.deep.equal([]);
    expect(stderrTail.getReason()).to.equal('');
  });
  it('should hide the camera URL, even split between two chunks', () => {
    const stderrTail = createFfmpegStderrTail(CAMERA_URL);
    expect(stderrTail.push(`[rtsp @ 0x55] ${CAMERA_URL.slice(0, 18)}`)).to.deep.equal([]);
    expect(stderrTail.push(`${CAMERA_URL.slice(18)}: Connection refused\n`)).to.deep.equal([
      '[rtsp @ 0x55] CAMERA_URL: Connection refused',
    ]);
  });
  it('should hide the credentials of a URL written differently, and the password alone', () => {
    const stderrTail = createFfmpegStderrTail(CAMERA_URL);
    stderrTail.push("Input #0, rtsp, from 'rtsp://admin:p%40ss@192.168.1.10/live':\n");
    stderrTail.push('Unauthorized for user admin with p@ss and p%40ss\n');
    stderrTail.push('Opening "rtsps://other:pwd@cam.local/stream" failed\n');
    expect(stderrTail.getReason()).to.equal(
      'Input #0, rtsp, from \'rtsp://***@192.168.1.10/live\': — Unauthorized for user admin with *** and *** — Opening "rtsps://***@cam.local/stream" failed',
    );
  });
  it('should hide a password containing "@" in a URL', () => {
    const stderrTail = createFfmpegStderrTail('rtsp://admin:p@ss@cam/live');
    stderrTail.push('rtsp://admin:p@ss@cam: Connection refused\n');
    expect(stderrTail.getReason()).to.equal('rtsp://***@cam: Connection refused');
  });
  it('should hide the password as written when its percent-encoding is malformed', () => {
    const stderrTail = createFfmpegStderrTail('rtsp://admin:bad%E0pass@cam/live');
    stderrTail.push('wrong password bad%E0pass\n');
    expect(stderrTail.getReason()).to.equal('wrong password ***');
  });
  it('should still hide the whole URL and its credentials when Node cannot parse it', () => {
    const stderrTail = createFfmpegStderrTail('rtsp://admin:pass@[bad/live');
    stderrTail.push('rtsp://admin:pass@[bad/live: Invalid argument\nrtsp://admin:pass@[bad: Invalid argument\n');
    expect(stderrTail.getReason()).to.equal('CAMERA_URL: Invalid argument — rtsp://***@[bad: Invalid argument');
  });
  it('should hide nothing more when the camera has no URL', () => {
    const stderrTail = createFfmpegStderrTail(undefined);
    stderrTail.push('Connection refused\n');
    expect(stderrTail.getReason()).to.equal('Connection refused');
  });
  it('should hide nothing more when the URL has no password', () => {
    const stderrTail = createFfmpegStderrTail('rtsp://192.168.1.10/live');
    stderrTail.push('rtsp://192.168.1.10/other: 404 Not Found\n');
    expect(stderrTail.getReason()).to.equal('rtsp://192.168.1.10/other: 404 Not Found');
  });
  it('should cut a long line after it has been redacted', () => {
    const stderrTail = createFfmpegStderrTail(CAMERA_URL);
    const finishedLines = stderrTail.push(`${'x'.repeat(490)} ${CAMERA_URL} refused\n`);
    expect(finishedLines).to.deep.equal([`${'x'.repeat(490)} CAMERA_URL refused`]);
    expect(stderrTail.getReason()).to.equal(`${'x'.repeat(490)} CAMERA_UR`);
  });
  it('should skip a line too long to be kept, up to its end, even when the URL is cut', () => {
    const stderrTail = createFfmpegStderrTail(CAMERA_URL);
    stderrTail.push('before\n');
    expect(stderrTail.push(`${'x'.repeat(4000)} ${CAMERA_URL.slice(0, 20)}`)).to.deep.equal([]);
    expect(stderrTail.push('still the same line')).to.deep.equal([]);
    expect(stderrTail.push(`${CAMERA_URL.slice(20)} refused\nafter\n`)).to.deep.equal(['after']);
    expect(stderrTail.getReason()).to.equal('before — after');
  });
  it('should not keep the start of a line too long to be kept when the process closes', () => {
    const stderrTail = createFfmpegStderrTail(CAMERA_URL);
    stderrTail.push(`${'x'.repeat(4001)}`);
    expect(stderrTail.getReason()).to.equal('');
  });
});
