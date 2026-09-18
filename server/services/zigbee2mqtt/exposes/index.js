const binaryType = require('./binaryType');
const numericType = require('./numericType');
const enumType = require('./enumType');
const compositeType = require('./compositeType');
const textType = require('./textType');

module.exports = {
  [binaryType.type]: binaryType,
  [numericType.type]: numericType,
  [enumType.type]: enumType,
  [compositeType.type]: compositeType,
  [textType.type]: textType,
};
