const crypto = require('crypto');

function generate(key) {
  var hash = crypto.createHash('sha256').update(key).digest('hex');
  var withColons = hash.replace(/(.{2})(?=.)/g, '$1:');
  return withColons;
}

module.exports = function() {
  return gladys.param.getValues(['GLADYS_GATEWAY_RSA_PUBLIC_KEY', 'GLADYS_GATEWAY_ECDSA_PUBLIC_KEY'])
    .spread((rsaPublicKey, ecdsPublicKey) => {
      
      return {
        rsa_fingerprint: generate(rsaPublicKey),
        ecdsa_fingerprint: generate(ecdsPublicKey)
      };
    });
};