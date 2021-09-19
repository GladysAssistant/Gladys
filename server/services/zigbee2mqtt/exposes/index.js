const binaryType = require('./binaryType');
const numericType = require('./numericType');
const enumType = require('./enumType');

module.exports = {
  [binaryType.type]: binaryType,
  [numericType.type]: numericType,
  [enumType.type]: enumType,
};
