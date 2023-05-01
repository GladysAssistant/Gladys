/**
 * @description Return instance keys fingerprint.
 * @returns {Promise} Resolve with the keys.
 * @example
 * getInstanceKeysFingerprint();
 */
async function getInstanceKeysFingerprint() {
  const gladysGatewayRsaPublicKey = await this.variable.getValue('GLADYS_GATEWAY_RSA_PUBLIC_KEY');
  const gladysGatewayEcdsaPublicKey = await this.variable.getValue('GLADYS_GATEWAY_ECDSA_PUBLIC_KEY');

  const keys = {
    rsa_fingerprint: await this.gladysGatewayClient.generateFingerprint(gladysGatewayRsaPublicKey),
    ecdsa_fingerprint: await this.gladysGatewayClient.generateFingerprint(gladysGatewayEcdsaPublicKey),
  };

  return keys;
}

module.exports = {
  getInstanceKeysFingerprint,
};
