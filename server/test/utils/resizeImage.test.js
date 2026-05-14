const { expect } = require('chai');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// Create a mock for sharp
const createSharpMock = (outputBuffer) => {
  const sharpInstance = {};
  sharpInstance.resize = fake.returns(sharpInstance);
  sharpInstance.jpeg = fake.returns(sharpInstance);
  sharpInstance.toBuffer = fake.resolves(outputBuffer);
  const sharpMock = fake.returns(sharpInstance);
  sharpMock.instance = sharpInstance;
  return sharpMock;
};

describe('resizeImage', () => {
  it('should resize image with data URI prefix', async () => {
    const inputBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const outputBuffer = Buffer.from('resized-image-data');
    const sharpMock = createSharpMock(outputBuffer);

    const { resizeImage } = proxyquire('../../utils/resizeImage', {
      sharp: sharpMock,
    });

    const result = await resizeImage(`data:image/png;base64,${inputBase64}`);

    expect(result).to.equal(`data:image/jpeg;base64,${outputBuffer.toString('base64')}`);
    expect(sharpMock.calledOnce).to.equal(true);
    expect(sharpMock.instance.resize.calledOnce).to.equal(true);
    expect(sharpMock.instance.resize.firstCall.args).to.deep.equal([
      640,
      480,
      { fit: 'inside', withoutEnlargement: true },
    ]);
    expect(sharpMock.instance.jpeg.calledOnce).to.equal(true);
    expect(sharpMock.instance.jpeg.firstCall.args).to.deep.equal([{ quality: 80 }]);
  });

  it('should resize image without data URI prefix', async () => {
    const inputBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const outputBuffer = Buffer.from('resized-image-data');
    const sharpMock = createSharpMock(outputBuffer);

    const { resizeImage } = proxyquire('../../utils/resizeImage', {
      sharp: sharpMock,
    });

    const result = await resizeImage(inputBase64);

    expect(result).to.equal(`data:image/jpeg;base64,${outputBuffer.toString('base64')}`);
    expect(sharpMock.calledOnce).to.equal(true);
  });

  it('should use custom dimensions and quality', async () => {
    const inputBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const outputBuffer = Buffer.from('resized-image-data');
    const sharpMock = createSharpMock(outputBuffer);

    const { resizeImage } = proxyquire('../../utils/resizeImage', {
      sharp: sharpMock,
    });

    await resizeImage(`data:image/jpeg;base64,${inputBase64}`, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 90,
    });

    expect(sharpMock.instance.resize.firstCall.args).to.deep.equal([
      800,
      600,
      { fit: 'inside', withoutEnlargement: true },
    ]);
    expect(sharpMock.instance.jpeg.firstCall.args).to.deep.equal([{ quality: 90 }]);
  });

  it('should handle image/jpeg mime type', async () => {
    const inputBase64 = '/9j/4AAQSkZJRg==';
    const outputBuffer = Buffer.from('resized-jpeg-data');
    const sharpMock = createSharpMock(outputBuffer);

    const { resizeImage } = proxyquire('../../utils/resizeImage', {
      sharp: sharpMock,
    });

    const result = await resizeImage(`data:image/jpeg;base64,${inputBase64}`);

    expect(result).to.equal(`data:image/jpeg;base64,${outputBuffer.toString('base64')}`);
  });

  it('should export default dimensions', async () => {
    const { DEFAULT_MAX_WIDTH, DEFAULT_MAX_HEIGHT } = proxyquire('../../utils/resizeImage', {
      sharp: createSharpMock(Buffer.from('')),
    });

    expect(DEFAULT_MAX_WIDTH).to.equal(640);
    expect(DEFAULT_MAX_HEIGHT).to.equal(480);
  });

  it('should handle malformed data URI header (no mime type match)', async () => {
    const inputBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const outputBuffer = Buffer.from('resized-image-data');
    const sharpMock = createSharpMock(outputBuffer);

    const { resizeImage } = proxyquire('../../utils/resizeImage', {
      sharp: sharpMock,
    });

    // Malformed header without proper "data:" prefix - will have comma but no mime match
    const result = await resizeImage(`malformed-header;base64,${inputBase64}`);

    expect(result).to.equal(`data:image/jpeg;base64,${outputBuffer.toString('base64')}`);
    expect(sharpMock.calledOnce).to.equal(true);
  });
});
