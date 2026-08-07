const { expect, assert } = require('chai');
const { fake } = require('sinon');
const nock = require('nock');
const proxyquire = require('proxyquire').noCallThru();
const { BadParameters } = require('../../../utils/coreErrors');

const getDashboard = (resizeImageBufferMock) => {
  const Dashboard = proxyquire('../../../lib/dashboard', {
    './dashboard.getPhoto': proxyquire('../../../lib/dashboard/dashboard.getPhoto', {
      '../../utils/resizeImage': { resizeImageBuffer: resizeImageBufferMock },
    }),
  });
  return new Dashboard();
};

const resizedJpegDataUri = (outputBuffer) => `image/jpeg;base64,${outputBuffer.toString('base64')}`;

describe('dashboard.getPhoto', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should fetch an image, resize it and return a JPEG data URI', async () => {
    const outputBuffer = Buffer.from('resized-image');
    const dashboard = getDashboard(fake.resolves(resizedJpegDataUri(outputBuffer)));

    nock('http://192.168.1.10')
      .get('/photos/vacation.jpg')
      .reply(200, Buffer.from('fake-image'), { 'Content-Type': 'image/jpeg' });

    const image = await dashboard.getPhoto('http://192.168.1.10/photos/vacation.jpg');
    expect(image).to.equal(resizedJpegDataUri(outputBuffer));
  });

  it('should reject invalid URLs', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    const promise = dashboard.getPhoto('not-a-valid-url');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject unsupported protocols', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    const promise = dashboard.getPhoto('ftp://192.168.1.10/photo.jpg');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject non-image content types', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    nock('http://192.168.1.10')
      .get('/file.txt')
      .reply(200, 'hello', { 'Content-Type': 'text/plain' });

    const promise = dashboard.getPhoto('http://192.168.1.10/file.txt');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject responses without a content-type', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    nock('http://192.168.1.10')
      .get('/photos/no-content-type.jpg')
      .reply(200, Buffer.from('fake-image'));

    const promise = dashboard.getPhoto('http://192.168.1.10/photos/no-content-type.jpg');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject application/octet-stream responses', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    nock('http://192.168.1.10')
      .get('/photos/unknown.bin')
      .reply(200, Buffer.from('fake-image'), { 'Content-Type': 'application/octet-stream' });

    const promise = dashboard.getPhoto('http://192.168.1.10/photos/unknown.bin');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject loopback addresses', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    const promise = dashboard.getPhoto('http://127.0.0.1/photo.jpg');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject IPv6 loopback addresses', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    const promise = dashboard.getPhoto('http://[::1]/photo.jpg');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject the cloud metadata link-local address', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    const promise = dashboard.getPhoto('http://169.254.169.254/latest/meta-data/');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject a hostname resolving to a loopback address', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    const promise = dashboard.getPhoto('http://localhost/photo.jpg');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject a hostname that cannot be resolved', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    const promise = dashboard.getPhoto('http://this-host-does-not-exist.gladys.invalid/photo.jpg');
    await assert.isRejected(promise, BadParameters);
  });

  it('should accept a private LAN address so a NAS stays reachable', async () => {
    const outputBuffer = Buffer.from('resized-image');
    const dashboard = getDashboard(fake.resolves(resizedJpegDataUri(outputBuffer)));

    nock('http://10.0.0.5')
      .get('/photos/nas.png')
      .reply(200, Buffer.from('fake-image'), { 'Content-Type': 'image/png' });

    const image = await dashboard.getPhoto('http://10.0.0.5/photos/nas.png');
    expect(image).to.equal(resizedJpegDataUri(outputBuffer));
  });

  it('should not follow redirects', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    nock('http://192.168.1.10')
      .get('/photos/redirect.jpg')
      .reply(302, '', { Location: 'http://169.254.169.254/latest/meta-data/' });

    const promise = dashboard.getPhoto('http://192.168.1.10/photos/redirect.jpg');
    await assert.isRejected(promise);
  });

  it('should reject images that exceed the source size limit', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    const imageBuffer = Buffer.alloc(25 * 1024 * 1024 + 1);
    nock('http://192.168.1.10')
      .get('/photos/huge.jpg')
      .reply(200, imageBuffer, { 'Content-Type': 'image/jpeg' });

    const promise = dashboard.getPhoto('http://192.168.1.10/photos/huge.jpg');
    await assert.isRejected(promise);
  });

  it('should reject invalid image data', async () => {
    const dashboard = getDashboard(fake.rejects(new Error('Invalid image')));
    nock('http://192.168.1.10')
      .get('/photos/invalid.jpg')
      .reply(200, Buffer.from('not-an-image'), { 'Content-Type': 'image/jpeg' });

    const promise = dashboard.getPhoto('http://192.168.1.10/photos/invalid.jpg');
    await assert.isRejected(promise, BadParameters);
  });
});
