const { expect } = require('chai');

const ThermostatHandler = require('../../../../services/thermostat/lib');

describe('ThermostatHandler', () => {
  it('should keep the gladys instance and the service id', () => {
    const gladys = { device: {} };

    const handler = new ThermostatHandler(gladys, 'service-id');

    expect(handler.gladys).to.equal(gladys);
    expect(handler.serviceId).to.equal('service-id');
  });

  it('should start with no pending apply timer', () => {
    expect(new ThermostatHandler({}, 'service-id').applyTimer).to.equal(null);
  });

  it('should expose every operation of the integration', () => {
    const handler = new ThermostatHandler({}, 'service-id');

    [
      'createDevice',
      'getDevices',
      'getSchedules',
      'createSchedule',
      'updateSchedule',
      'deleteSchedule',
      'applySchedules',
      'onDeviceNewState',
      'setValue',
      'postDelete',
      'setVariable',
      'triggerApplySchedules',
    ].forEach((method) => {
      expect(handler[method], `${method} should be defined`).to.be.a('function');
    });
  });
});
