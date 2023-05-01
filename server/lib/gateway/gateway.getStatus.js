/**
 * @description Return if gateway is connected.
 * @returns {Promise} Return status.
 * @example
 * getStatus();
 */
async function getStatus() {
  const gladysGatewayRefreshToken = await this.variable.getValue('GLADYS_GATEWAY_REFRESH_TOKEN');
  const gladysGatewayRsaPrivateKey = await this.variable.getValue('GLADYS_GATEWAY_RSA_PRIVATE_KEY');
  const gladysGatewayEcdsaPrivateKey = await this.variable.getValue('GLADYS_GATEWAY_ECDSA_PRIVATE_KEY');

  const configured =
    gladysGatewayRefreshToken !== null && gladysGatewayRsaPrivateKey !== null && gladysGatewayEcdsaPrivateKey !== null;

  return {
    configured,
    connected: this.connected,
  };
}

module.exports = {
  getStatus,
};
