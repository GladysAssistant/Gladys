const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const nock = require('nock');
const proxyquire = require('proxyquire').noCallThru();
const { BadParameters } = require('../../../utils/coreErrors');
const { createPinnedLookup, isRestrictedAddress } = require('../../../lib/dashboard/dashboard.getPhoto');

const getDashboard = (resizeImageBufferMock, dnsMock) => {
  const stubs = { '../../utils/resizeImage': { resizeImageBuffer: resizeImageBufferMock } };

  if (dnsMock) {
    stubs.dns = dnsMock;
  }

  const Dashboard = proxyquire('../../../lib/dashboard', {
    './dashboard.getPhoto': proxyquire('../../../lib/dashboard/dashboard.getPhoto', stubs),
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

  it('should reject the unspecified IPv4 address', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    const promise = dashboard.getPhoto('http://0.0.0.0/photo.jpg');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject IPv6 link-local addresses', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    const promise = dashboard.getPhoto('http://[fe80::1]/photo.jpg');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject the unspecified IPv6 address', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    const promise = dashboard.getPhoto('http://[::]/photo.jpg');
    await assert.isRejected(promise, BadParameters);
  });

  it('should reject IPv4-mapped IPv6 loopback addresses', async () => {
    const dashboard = getDashboard(fake.resolves('image/jpeg;base64,'));
    const promise = dashboard.getPhoto('http://[::ffff:127.0.0.1]/photo.jpg');
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

  it('should fetch an image from a hostname resolving to an allowed address', async () => {
    const outputBuffer = Buffer.from('resized-image');
    const dashboard = getDashboard(fake.resolves(resizedJpegDataUri(outputBuffer)), {
      promises: { lookup: fake.resolves([{ address: '203.0.113.10', family: 4 }]) },
    });

    nock('http://photos.example.com')
      .get('/vacation.jpg')
      .reply(200, Buffer.from('fake-image'), { 'Content-Type': 'image/jpeg' });

    const image = await dashboard.getPhoto('http://photos.example.com/vacation.jpg');
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

describe('dashboard.getPhoto isRestrictedAddress', () => {
  it('should restrict anything that is not an IP address', () => {
    expect(isRestrictedAddress('not-an-ip')).to.equal(true);
  });

  it('should restrict the dotted IPv4-mapped loopback address', () => {
    expect(isRestrictedAddress('::ffff:127.0.0.1')).to.equal(true);
  });

  it('should restrict an IPv4-mapped address written with a single group', () => {
    // ::ffff:1 is ::ffff:0.0.0.1, in the unspecified 0.0.0.0/8 range
    expect(isRestrictedAddress('::ffff:1')).to.equal(true);
  });

  it('should allow an IPv4-mapped public address', () => {
    expect(isRestrictedAddress('::ffff:cb00:710a')).to.equal(false);
  });

  it('should not treat a regular IPv6 address starting with ::ffff as IPv4-mapped', () => {
    expect(isRestrictedAddress('::ffff:1:2:3')).to.equal(false);
  });

  it('should not treat an embedded dotted quad as IPv4-mapped', () => {
    // ::ffff:0:1.2.3.4 is ::ffff:0:102:304, not an IPv4-mapped address
    expect(isRestrictedAddress('::ffff:0:1.2.3.4')).to.equal(false);
  });

  it('should allow a 169.x address that is not link-local', () => {
    expect(isRestrictedAddress('169.1.1.1')).to.equal(false);
  });

  it('should allow public and LAN addresses', () => {
    expect(isRestrictedAddress('203.0.113.10')).to.equal(false);
    expect(isRestrictedAddress('192.168.1.10')).to.equal(false);
    expect(isRestrictedAddress('10.0.0.5')).to.equal(false);
    expect(isRestrictedAddress('172.16.0.1')).to.equal(false);
    expect(isRestrictedAddress('2001:db8::1')).to.equal(false);
  });
});

describe('dashboard.getPhoto pinned lookup', () => {
  const validatedAddresses = [
    { address: '203.0.113.10', family: 4 },
    { address: '2001:db8::1', family: 6 },
  ];

  // The socket must connect to the address validated before the request, so a domain that
  // rebinds to 169.254.169.254 in between never reaches the restricted target.
  it('should always answer with the validated addresses', (done) => {
    const lookup = createPinnedLookup(validatedAddresses);
    lookup('rebinding.example.com', { all: true }, (err, result) => {
      expect(err).to.equal(null);
      expect(result).to.deep.equal(validatedAddresses);
      done();
    });
  });

  it('should answer with a single address when all is not requested', (done) => {
    const lookup = createPinnedLookup(validatedAddresses);
    lookup('rebinding.example.com', {}, (err, address, family) => {
      expect(err).to.equal(null);
      expect(address).to.equal('203.0.113.10');
      expect(family).to.equal(4);
      done();
    });
  });

  it('should filter the validated addresses on the requested family', (done) => {
    const lookup = createPinnedLookup(validatedAddresses);
    lookup('rebinding.example.com', { family: 6, all: true }, (err, result) => {
      expect(err).to.equal(null);
      expect(result).to.deep.equal([{ address: '2001:db8::1', family: 6 }]);
      done();
    });
  });

  it('should support the legacy numeric family argument', (done) => {
    const lookup = createPinnedLookup(validatedAddresses);
    lookup('rebinding.example.com', 4, (err, address, family) => {
      expect(err).to.equal(null);
      expect(address).to.equal('203.0.113.10');
      expect(family).to.equal(4);
      done();
    });
  });

  it('should fail when no validated address matches the requested family', (done) => {
    const lookup = createPinnedLookup([{ address: '203.0.113.10', family: 4 }]);
    lookup('rebinding.example.com', { family: 6 }, (err) => {
      expect(err).to.be.an.instanceOf(BadParameters);
      done();
    });
  });

  it('should default to the validated addresses when no option is given', (done) => {
    const lookup = createPinnedLookup(validatedAddresses);
    lookup('rebinding.example.com', undefined, (err, address, family) => {
      expect(err).to.equal(null);
      expect(address).to.equal('203.0.113.10');
      expect(family).to.equal(4);
      done();
    });
  });
});
