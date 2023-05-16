/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { MD5, AES, enc, mode, pad } from 'crypto-js';

/**
 * @description Get topic url.
 * @param {string} websocketUrl
 * @param {string} accessId
 * @param {string} env
 * @param {string} query
 * @returns {string}
 * @example
 */
export function getTopicUrl(websocketUrl, accessId, env, query) {
  return `${websocketUrl}ws/v2/consumer/persistent/${accessId}/out/${env}/${accessId}-sub${query}`;
}

/**
 * @description Build query string.
 * @param { [key: string]: number | string } query
 * @returns {string}
 * @example
 */
export function buildQuery(query) {
  return Object.keys(query)
    .map((key) => `${key}=${encodeURIComponent(query[key])}`)
    .join('&');
}

/**
 * @description Build password.
 * @param {string} accessId
 * @param {string} accessKey
 * @returns {string}
 * @example
 */
export function buildPassword(accessId, accessKey) {
  const key = MD5(accessKey).toString();
  return MD5(`${accessId}${key}`).toString().substr(8, 16);
}

/**
 * @description Decrypt data.
 * @param {string} data
 * @param {string} accessKey
 * @returns {any|string}
 * @example
 */
export function decrypt(data, accessKey) {
  try {
    const realKey = enc.Utf8.parse(accessKey.substring(8, 24));
    const json = AES.decrypt(data, realKey, {
      mode: mode.ECB,
      padding: pad.Pkcs7,
    });
    const dataStr = enc.Utf8.stringify(json).toString();
    return JSON.parse(dataStr);
  } catch (e) {
    return '';
  }
}

/**
 * @description Encrypt data.
 * @param {any} data
 * @param {string} accessKey
 * @returns {*|string}
 * @example
 */
export function encrypt(data, accessKey) {
  try {
    const realKey = enc.Utf8.parse(accessKey.substring(8, 24));
    const realData = JSON.stringify(data);
    const retData = AES.encrypt(realData, realKey, {
      mode: mode.ECB,
      padding: pad.Pkcs7,
    }).toString();
    return retData;
  } catch (e) {
    return '';
  }
}
