const crypto = require('crypto');
const { MD5, AES, enc, mode, pad } = require('crypto-js');

function getTopicUrl(websocketUrl, accessId, env, query) {
  return `${websocketUrl}ws/v2/consumer/persistent/${accessId}/out/${env}/${accessId}-sub${query}`;
}

function buildQuery(query) {
  return Object.keys(query)
    .map((key) => `${key}=${encodeURIComponent(query[key])}`)
    .join('&');
}

function buildPassword(accessId, accessKey) {
  const key = MD5(accessKey).toString();
  return MD5(`${accessId}${key}`)
    .toString()
    .substr(8, 16);
}

function decrypt(data, accessKey, encryptyModel) {
  if (encryptyModel === 'aes_gcm') {
    return decryptByGCM(data, accessKey);
  } else {
    return decryptByECB(data, accessKey);
  }
}

function decryptByECB(data, accessKey) {
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

function decryptByGCM(data, accessKey) {
  try {
    var bData = Buffer.from(data, 'base64');
    const iv = bData.slice(0, 12);
    const tag = bData.slice(-16);
    const cdata = bData.slice(12, bData.length - 16);
    const decipher = crypto.createDecipheriv('aes-128-gcm', accessKey.substring(8, 24), iv);
    decipher.setAuthTag(tag);
    var dataStr = decipher.update(cdata);
    dataStr += decipher.final('utf8');
    return JSON.parse(dataStr);
  } catch (e) {
    return '';
  }
}

function encrypt(data, accessKey) {
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

module.exports = {
  getTopicUrl,
  buildQuery,
  buildPassword,
  decrypt,
  decryptByECB,
  decryptByGCM,
  encrypt,
};
