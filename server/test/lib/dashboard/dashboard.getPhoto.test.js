const { expect, assert } = require('chai');
const nock = require('nock');
const { BadParameters } = require('../../../utils/coreErrors');

const Dashboard = require('../../../lib/dashboard');

describe('dashboard.getPhoto', () => {
  const dashboard = new Dashboard();

  afterEach(() => {
    nock.cleanAll();
  });

  it('should fetch an image and return a data URI', async () => {
    const imageBuffer = Buffer.from('fake-image');
    nock('http://192.168.1.10')
      .get('/photos/vacation.jpg')
      .reply(200, imageBuffer, { 'Content-Type': 'image/jpeg' });

    const image = await dashboard.getPhoto('http://192.168.1.10/photos/vacation.jpg');
    expect(image).to.equal(`image/jpeg;base64,${imageBuffer.toString('base64')}`);
  });

  it('should reject invalid URLs', async () => {
    const promise = dashboard.getPhoto('not-a-valid-url');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject unsupported protocols', async () => {
    const promise = dashboard.getPhoto('ftp://192.168.1.10/photo.jpg');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject non-image content types', async () => {
    nock('http://192.168.1.10')
      .get('/file.txt')
      .reply(200, 'hello', { 'Content-Type': 'text/plain' });

    const promise = dashboard.getPhoto('http://192.168.1.10/file.txt');
    await assert.isRejected(promise, BadParameters);
  });

  it('should default to image/jpeg when content-type is missing', async () => {
    const imageBuffer = Buffer.from('fake-image');
    nock('http://192.168.1.10')
      .get('/photos/no-content-type.jpg')
      .reply(200, imageBuffer);

    const image = await dashboard.getPhoto('http://192.168.1.10/photos/no-content-type.jpg');
    expect(image).to.equal(`image/jpeg;base64,${imageBuffer.toString('base64')}`);
  });

  it('should reject images that exceed the axios size limit', async () => {
    const imageBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);
    nock('http://192.168.1.10')
      .get('/photos/huge.jpg')
      .reply(200, imageBuffer, { 'Content-Type': 'image/jpeg' });

    const promise = dashboard.getPhoto('http://192.168.1.10/photos/huge.jpg');
    await assert.isRejected(promise);
  });
});
