const { expect } = require('chai');
const { getDeviceFeatureName } = require('../../../../services/zwavejs-ui/utils/getDeviceFeatureName');

describe('zwaveJSUIHandler.getDeviceFeatureName', () => {
  it('should keep the id as-is when there is no propertyKeyName', () => {
    const name = getDeviceFeatureName(
      { name: '' },
      {
        id: '16-64-1-mode',
        propertyKey: null,
        propertyKeyName: null,
      },
    );
    expect(name).equals('16-64-1-mode');
  });

  it('should append the exposed feature name when set', () => {
    const name = getDeviceFeatureName(
      { name: 'position' },
      {
        id: '5-38-1-currentValue',
        propertyKey: null,
        propertyKeyName: null,
      },
    );
    expect(name).equals('5-38-1-currentValue:position');
  });

  it('should replace a numeric propertyKey with the propertyKeyName', () => {
    const name = getDeviceFeatureName(
      { name: '' },
      {
        id: '6-50-1-value-65537',
        propertyKey: 65537,
        propertyKeyName: 'Electric_kWh_Consumed',
      },
    );
    expect(name).equals('6-50-1-value-Electric_kWh_Consumed');
  });

  it('should not corrupt the node id when the propertyKey collides with a digit earlier in the id', () => {
    // Node 16, Thermostat Setpoint (CC 67), endpoint 1, "setpoint" property,
    // Heating setpoint type (propertyKey 1). A naive String#replace would match
    // the "1" in the leading node id "16" instead of the trailing propertyKey.
    const name = getDeviceFeatureName(
      { name: '' },
      {
        id: '16-67-1-setpoint-1',
        propertyKey: 1,
        propertyKeyName: 'Heating',
      },
    );
    expect(name).equals('16-67-1-setpoint-Heating');
  });

  it('should replace the propertyKey for the cooling setpoint', () => {
    const name = getDeviceFeatureName(
      { name: '' },
      {
        id: '16-67-1-setpoint-2',
        propertyKey: 2,
        propertyKeyName: 'Cooling',
      },
    );
    expect(name).equals('16-67-1-setpoint-Cooling');
  });

  it('should replace the propertyKey for the energy save heating setpoint', () => {
    const name = getDeviceFeatureName(
      { name: '' },
      {
        id: '16-67-1-setpoint-11',
        propertyKey: 11,
        propertyKeyName: 'Energy Save Heating',
      },
    );
    expect(name).equals('16-67-1-setpoint-Energy Save Heating');
  });

  it('should not replace anything when propertyKey and propertyKeyName are equal', () => {
    const name = getDeviceFeatureName(
      { name: '' },
      {
        id: '13-91-0-scene-001',
        propertyKey: '001',
        propertyKeyName: '001',
      },
    );
    expect(name).equals('13-91-0-scene-001');
  });
});
