const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { generateBackupKey } = require('../../utils/backupKey');
/**
 * @description Login step 2 to the Gateway.
 * @param {string} twoFactorToken - Two Factor Access token.
 * @param {string} twoFactorCode - The two Factor code.
 * @example
 * loginTwoFactor('xxxxxx', '123456');
 */
async function loginTwoFactor(twoFactorToken, twoFactorCode) {
  // We login with two factor code
  await this.gladysGatewayClient.loginInstance(twoFactorToken, twoFactorCode);
  // we get all variables
  const gladysGatewayRefreshToken = await this.variable.getValue('GLADYS_GATEWAY_REFRESH_TOKEN');
  const gladysGatewayRsaPrivateKey = await this.variable.getValue('GLADYS_GATEWAY_RSA_PRIVATE_KEY');
  const gladysGatewayEcdsaPrivateKey = await this.variable.getValue('GLADYS_GATEWAY_ECDSA_PRIVATE_KEY');
  const gladysGatewayRsaPublicKey = await this.variable.getValue('GLADYS_GATEWAY_RSA_PUBLIC_KEY');
  const gladysGatewayEcdsaPublicKey = await this.variable.getValue('GLADYS_GATEWAY_ECDSA_PUBLIC_KEY');
  const localUsersKeys = await this.variable.getValue('GLADYS_GATEWAY_USERS_KEYS');
  const backupKey = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_KEY);
  // we test if the instance is already created.
  const instanceCreated =
    gladysGatewayRefreshToken &&
    gladysGatewayRsaPrivateKey &&
    gladysGatewayEcdsaPrivateKey &&
    gladysGatewayRsaPublicKey &&
    gladysGatewayEcdsaPublicKey;
  // if the instance doesn't exist, we create it
  if (!instanceCreated) {
    const gladysInstance = await this.gladysGatewayClient.createInstance('Gladys Instance');
    await this.variable.setValue('GLADYS_GATEWAY_REFRESH_TOKEN', gladysInstance.instance.refresh_token);
    await this.variable.setValue('GLADYS_GATEWAY_RSA_PRIVATE_KEY', JSON.stringify(gladysInstance.rsaPrivateKeyJwk));
    await this.variable.setValue('GLADYS_GATEWAY_ECDSA_PRIVATE_KEY', JSON.stringify(gladysInstance.ecdsaPrivateKeyJwk));
    await this.variable.setValue('GLADYS_GATEWAY_RSA_PUBLIC_KEY', JSON.stringify(gladysInstance.rsaPublicKeyJwk));
    await this.variable.setValue('GLADYS_GATEWAY_ECDSA_PUBLIC_KEY', JSON.stringify(gladysInstance.ecdsaPublicKeyJwk));
  }
  // if the localUserKeys variable doesn't exist, we create it
  if (localUsersKeys === null) {
    await this.variable.setValue('GLADYS_GATEWAY_USERS_KEYS', JSON.stringify([]));
  }
  // if the backup key doesn't exist, we create it
  if (backupKey === null) {
    const newBackupKey = await generateBackupKey();
    await this.variable.setValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_KEY, newBackupKey);
  }
  // then, we init Gladys.
  await this.init();
}

module.exports = {
  loginTwoFactor,
};
