const booleanType = require('./tuya.boolean');
const enumType = require('./tuya.enum');
const integerType = require('./tuya.integer');

const types = [booleanType, enumType, integerType];
const typeByName = {};

types.forEach((type) => {
  typeByName[type.type] = type;
});

module.exports = typeByName;
