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

  it('should default to image/jpeg when content-type is missing', async () => {
    const outputBuffer = Buffer.from('resized-image');
    const dashboard = getDashboard(fake.resolves(resizedJpegDataUri(outputBuffer)));

    nock('http://192.168.1.10')
      .get('/photos/no-content-type.jpg')
      .reply(200, Buffer.from('fake-image'));

    const image = await dashboard.getPhoto('http://192.168.1.10/photos/no-content-type.jpg');
    expect(image).to.equal(resizedJpegDataUri(outputBuffer));
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
