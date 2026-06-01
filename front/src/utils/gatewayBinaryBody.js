/** @description Marker on JSON bodies sent through the Gladys Gateway WebSocket API. */
export const GLADYS_GATEWAY_BINARY_BODY = 'gladys_binary_body';

/**
 * @description Encode a binary payload for POST through GatewayHttpClient (WebSocket JSON).
 * @param {Blob|ArrayBuffer|Uint8Array} body - Raw audio bytes.
 * @param {string} contentType - MIME type for the audio.
 * @returns {Promise<object>} JSON-serializable body for sendRequestPost.
 */
export async function encodeGatewayBinaryBody(body, contentType) {
  let arrayBuffer;
  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    arrayBuffer = await body.arrayBuffer();
  } else if (body instanceof ArrayBuffer) {
    arrayBuffer = body;
  } else if (body instanceof Uint8Array) {
    arrayBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
  } else {
    throw new Error('Unsupported binary body type');
  }

  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }

  return {
    [GLADYS_GATEWAY_BINARY_BODY]: true,
    content_type: contentType,
    data: btoa(binary)
  };
}
