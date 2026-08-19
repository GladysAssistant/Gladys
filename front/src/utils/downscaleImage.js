// Quality-first client-side downscale for image uploads (dashboard assets).
//
// The ceiling is calibrated for the biggest real surface an asset can cover:
// a house-view card on a full-width dashboard is ~1200 CSS px wide, so 2560px
// on the long edge keeps it crisp on 2x retina and large wall panels. Sources
// already under the ceiling are uploaded untouched — the original bytes are
// the best possible quality.
const MAX_UPLOAD_DIMENSION = 2560;

// under this binary size an already-small-enough source is passed through
// as-is instead of being re-encoded (base64 of 2 MB ≈ 2.7 MB, safely under
// the server bound)
const KEEP_ORIGINAL_MAX_BYTES = 2 * 1024 * 1024;

// server-side bound on the base64 payload (dashboard.createAsset)
const SERVER_MAX_BASE64_LENGTH = 4 * 1024 * 1024;

// the server allowlist: any other source type (iOS HEIC, non-standard
// image/jpg, empty type…) must go through the canvas re-encode — the
// passthrough would 400 on upload
const PASSTHROUGH_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// 0.9 is visually transparent for both WebP and JPEG at these resolutions
const ENCODE_QUALITY = 0.9;

// if the encoded payload still exceeds the server bound (pathological
// sources), step the ceiling down instead of failing the upload
const DIMENSION_STEPS = [MAX_UPLOAD_DIMENSION, 2048, 1600, 1280];

const loadImage = file =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('INVALID_IMAGE'));
    };
    image.src = objectUrl;
  });

const readFileAsBase64 = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('INVALID_IMAGE'));
    reader.readAsDataURL(file);
  });

// WebP keeps the alpha channel of the illustration PNGs while compressing
// far better; detected on a real canvas encode since Image support alone
// doesn't imply encoder support
const canEncodeWebp = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// Progressive halving: browsers resample a single drawImage pass with a
// small kernel, which aliases hard on big ratios (4000px -> 1600px). Halving
// step by step until the last pass keeps edges and fine lines clean.
const drawScaled = (image, targetWidth, targetHeight) => {
  let source = image;
  let width = image.naturalWidth || image.width;
  let height = image.naturalHeight || image.height;
  while (width / 2 >= targetWidth && height / 2 >= targetHeight) {
    const half = document.createElement('canvas');
    half.width = Math.round(width / 2);
    half.height = Math.round(height / 2);
    const context = half.getContext('2d');
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, half.width, half.height);
    source = half;
    width = half.width;
    height = half.height;
  }
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, targetWidth, targetHeight);
  return canvas;
};

/**
 * @description Prepare an image file for upload as a dashboard asset:
 * downscaled to the retina ceiling with high-quality resampling, re-encoded
 * to WebP (alpha preserved) when the browser can, and guaranteed to fit the
 * server payload bound.
 * @param {File} file - The image file picked by the user.
 * @returns {Promise<object>} Resolves with { contentType, data } (base64).
 * @example
 * const { contentType, data } = await prepareImageUpload(file);
 */
export async function prepareImageUpload(file) {
  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const longEdge = Math.max(sourceWidth, sourceHeight);

  // small enough already, in a type the server accepts: the untouched
  // original is the best quality
  if (
    longEdge <= MAX_UPLOAD_DIMENSION &&
    file.size <= KEEP_ORIGINAL_MAX_BYTES &&
    PASSTHROUGH_CONTENT_TYPES.includes(file.type)
  ) {
    return { contentType: file.type, data: await readFileAsBase64(file) };
  }

  // WebP when possible; PNG keeps the alpha of illustration sources
  // otherwise (JPEG would fill transparency with black)
  const webp = canEncodeWebp();
  const contentType = webp ? 'image/webp' : file.type === 'image/png' ? 'image/png' : 'image/jpeg';

  let data = null;
  for (let i = 0; i < DIMENSION_STEPS.length; i += 1) {
    const scale = Math.min(1, DIMENSION_STEPS[i] / longEdge);
    const canvas = drawScaled(image, Math.round(sourceWidth * scale), Math.round(sourceHeight * scale));
    data = canvas.toDataURL(contentType, ENCODE_QUALITY).split(',')[1];
    if (data.length <= SERVER_MAX_BASE64_LENGTH) {
      return { contentType, data };
    }
  }
  // even the smallest step exceeds the server bound (pathological source):
  // fail here so the upload error UI shows, instead of a doomed request
  throw new Error('IMAGE_TOO_LARGE');
}
