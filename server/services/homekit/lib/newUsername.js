/**
 * @description Generate hap username formated as mac address.
 * @returns {Promise} Resolving with username.
 * @example
 * newUsername()
 */
async function newUsername() {
  const rd = () =>
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 16)];
  const username = `${rd()}${rd()}:${rd()}${rd()}:${rd()}${rd()}:${rd()}${rd()}:${rd()}${rd()}:${rd()}${rd()}`;

  await this.gladys.variable.setValue('HOMEKIT_USERNAME', username, this.serviceId);

  return username;
}

module.exports = {
  newUsername,
};
