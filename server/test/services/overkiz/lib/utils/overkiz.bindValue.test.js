const { expect } = require('chai');
const { bindValue, unbindValue } = require('../../../../../services/overkiz/lib/utils/overkiz.bindValue');

describe('Overkiz bindValue', () => {
  it('should bindValue default', () => {
    const device = {};
    const deviceFeature = {
      external_id: 'overkiz:deviceURL:_deviceURLNs:_deviceURL:5:6:7',
    };
    const stateValue = '0123456789';
    const bindStateValue = bindValue(device, deviceFeature, stateValue);
    expect(bindStateValue).to.equals('0123456789');
  });

  it('should bindValue core:OccupancyState', () => {
    const device = {};
    const deviceFeature = {
      external_id: 'overkiz:deviceURL:_deviceURLNs:_deviceURL:state:core:OccupancyState',
    };
    const stateValue = 0;
    const bindStateValue = bindValue(device, deviceFeature, stateValue);
    expect(bindStateValue).to.equals('noPersonInside');
  });

  it('should bindValue io:TargetHeatingLevelState', () => {
    const device = {};
    const deviceFeature = {
      external_id: 'overkiz:deviceURL:_deviceURLNs:_deviceURL:state:io:TargetHeatingLevelState',
    };
    const stateValue = 0;
    const bindStateValue = bindValue(device, deviceFeature, stateValue);
    expect(bindStateValue).to.equals('off');
  });

  it('should bindValue core:ComfortRoomTemperatureState', () => {
    const device = {};
    const deviceFeature = {
      external_id: 'overkiz:deviceURL:_deviceURLNs:_deviceURL:state:core:ComfortRoomTemperatureState',
    };
    const stateValue = '1.0';
    const bindStateValue = bindValue(device, deviceFeature, stateValue);
    expect(bindStateValue).to.equals(1);
  });

  it('should bindValue io:EffectiveTemperatureSetpointState', () => {
    const device = {};
    const deviceFeature = {
      external_id: 'overkiz:deviceURL:_deviceURLNs:_deviceURL:state:io:EffectiveTemperatureSetpointState',
    };
    const stateValue = '1.0';
    const bindStateValue = bindValue(device, deviceFeature, stateValue);
    expect(bindStateValue).to.equals(1);
  });

  it('should unbindValue default', () => {
    const device = {};
    const deviceFeature = {
      external_id: 'overkiz:deviceURL:_deviceURLNs:_deviceURL:5:6:7',
    };
    const stateValue = '0123456789';
    const unbindStateValue = unbindValue(device, deviceFeature, stateValue);
    expect(unbindStateValue).to.equals('0123456789');
  });

  it('should unbindValue core:OccupancyState', () => {
    const device = {};
    const deviceFeature = {
      external_id: 'overkiz:deviceURL:_deviceURLNs:_deviceURL:state:core:OccupancyState',
    };
    const stateValue = 'personInside';
    const unbindStateValue = unbindValue(device, deviceFeature, stateValue);
    expect(unbindStateValue).to.equals(1);
  });

  it('should unbindValue io:TargetHeatingLevelState', () => {
    const device = {};
    const deviceFeature = {
      external_id: 'overkiz:deviceURL:_deviceURLNs:_deviceURL:state:io:TargetHeatingLevelState',
    };
    const stateValue = 'off';
    const unbindStateValue = unbindValue(device, deviceFeature, stateValue);
    expect(unbindStateValue).to.equals(0);
  });
});
