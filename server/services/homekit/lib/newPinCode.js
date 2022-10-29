/**
 * @description Generate new pincode.
 * @returns {Promise} Resolving with new pin code.
 * @example
 * newPinCode()
 */
async function newPinCode() {
  const rd = () => Math.floor(Math.random() * 10);
  const pincode = `${rd()}${rd()}${rd()}-${rd()}${rd()}-${rd()}${rd()}${rd()}`;

  await this.gladys.variable.setValue('HOMEKIT_PIN_CODE', pincode, this.serviceId);

  return pincode;
}

module.exports = {
  newPinCode,
};
