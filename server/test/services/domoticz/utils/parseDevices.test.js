const { expect } = require('chai');
const { parseDevices, parseValues } = require('../../../../services/domoticz/utils/domoticz.devices');
const devicesData = require('./devicesData.json');
const devicesExpectedResult = require('./devicesExpectedResult.json');
const valuesData = require('./valuesData.json');
const valuesExpectedResult = require('./valuesExpectedResult.json');

describe('parseDevices', () => {
  it('should parse devices', () => {
    const devices = parseDevices('abcd-0123-efgh', devicesData);
    expect(devices).to.deep.equal(devicesExpectedResult);
  });
});

describe('parseValues', () => {
  it('should parse values', () => {
    valuesData.forEach((device, i) => {
      const values = parseValues(device, device.data);
      const expValues = valuesExpectedResult[i];
      expect(values).to.deep.equal(expValues);
    });
  });

  it('should not update if already latest', () => {
    const device = { ...valuesData[0], last_value_changed: '2020-11-16 21:34:57' };
    const values = parseValues(device, device.data);
    expect(values).to.deep.equal([]);
  });
});
