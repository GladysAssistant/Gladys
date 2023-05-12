/**
 * @description Return an object of expanded fields.
 * @param {string} expand - The expand string.
 * @returns {object} The fields object.
 * @example
 * buildExpandObject('temperature,humidity');
 */
function buildExpandObject(expand) {
  if (!expand) {
    return {};
  }
  const fields = {};
  expand.split(',').forEach((prop) => {
    fields[prop] = true;
  });
  return fields;
}

module.exports = {
  buildExpandObject,
};
