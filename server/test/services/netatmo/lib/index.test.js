const { expect } = require('chai');
const NetatmoHandler = require('../../../../services/netatmo/lib');

describe('NetatmoHandler Constructor', () => {
  it('should properly initialize properties', () => {
    const fakeGladys = {};
    const fakeServiceId = '123';
    const handler = new NetatmoHandler(fakeGladys, fakeServiceId);

    expect(handler.gladys).to.equal(fakeGladys);
    expect(handler.serviceId).to.equal(fakeServiceId);
    expect(handler.configuration).to.deep.equal({
      clientId: null,
      clientSecret: null,
      scopes: {
        scopeAircare: 'read_homecoach',
        scopeEnergy: 'read_thermostat write_thermostat',
        scopeHomeSecurity: 'read_camera read_presence read_carbonmonoxidedetector read_smokedetector',
        scopeWeather: 'read_station',
      },
    });
  });
});
