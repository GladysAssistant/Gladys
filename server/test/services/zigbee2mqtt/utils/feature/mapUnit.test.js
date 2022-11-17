const { expect } = require('chai');

const { mapUnit } = require('../../../../../services/zigbee2mqtt/utils/features/mapUnit');
const { DEVICE_FEATURE_UNITS } = require('../../../../../utils/constants');

describe('zigbee2mqtt mapUnit', () => {
  const defaultFeatureUnit = 'default';

  const values = [
    { input: null, expected: defaultFeatureUnit },
    { input: '%', expected: DEVICE_FEATURE_UNITS.PERCENT },
    { input: 'hPa', expected: DEVICE_FEATURE_UNITS.HECTO_PASCAL },
    { input: 'ppm', expected: DEVICE_FEATURE_UNITS.PPM },
    { input: 'A', expected: DEVICE_FEATURE_UNITS.AMPERE },
    { input: 'V', expected: DEVICE_FEATURE_UNITS.VOLT },
    { input: 'mV', expected: DEVICE_FEATURE_UNITS.MILLI_VOLT },
    { input: 'W', expected: DEVICE_FEATURE_UNITS.WATT },
    { input: 'kWh', expected: DEVICE_FEATURE_UNITS.KILOWATT_HOUR },
    { input: '°C', expected: DEVICE_FEATURE_UNITS.CELSIUS },
    { input: '°F', expected: DEVICE_FEATURE_UNITS.FAHRENHEIT },
    { input: 'VA', expected: DEVICE_FEATURE_UNITS.VOLT_AMPERE },
    { input: 'VArh', expected: DEVICE_FEATURE_UNITS.VOLT_AMPERE_REACTIVE },
  ];

  values.forEach((value) => {
    const { input, expected } = value;

    it(`map "${input}" to ${expected}`, () => {
      const result = mapUnit(input, defaultFeatureUnit);
      expect(result).eq(expected);
    });
  });
});
