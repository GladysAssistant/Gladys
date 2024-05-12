/**
 * @description Save or destroy Gladys variable.
 * @param {string} key - The unique key of the variable.
 * @param {string} value - The value of the variable.
 * @example
 * await this.saveOrDestroyVariable('key', 'value');
 */
async function saveOrDestroyVariable(key, value) {
  if (value === undefined || value === null) {
    await this.gladys.variable.destroy(key, this.serviceId);
  } else {
    await this.gladys.variable.setValue(key, value, this.serviceId);
  }
}

module.exports = { saveOrDestroyVariable };
