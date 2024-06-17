const get = require('get-value');
const cleanNames = require('./cleanNames');

const getProperty = (source, commandClassName, propertyName, propertyKeyName, deviceClass, featureName) => {
  const commandClassNameClean = cleanNames(commandClassName);
  const propertyClean = cleanNames(propertyName);
  const propertyKeyClean = cleanNames(propertyKeyName);

  let basePropertyPath = propertyClean;
  if (propertyKeyClean !== '') {
    basePropertyPath += `.${propertyKeyClean}`;
  }

  if (featureName) {
    basePropertyPath += `.${featureName}`;
  }

  // Some devices have the same command class and property. But we need to classify
  // the device to map to the right CATEGORY. We use for that the deviceClass property.
  // We try to find an exposed feature specific to the deviceClass first.
  // For example: Multilevel Switch devices. They might be curtains or light switch.
  // They use the same command class. Only the deviceClass could provide some hints
  // about the real intention of the device.
  return (
    get(source, `${commandClassNameClean}.${deviceClass.generic}-${deviceClass.specific}.${basePropertyPath}`) ||
    get(source, `${commandClassNameClean}.${basePropertyPath}`)
  );
};

module.exports = getProperty;
