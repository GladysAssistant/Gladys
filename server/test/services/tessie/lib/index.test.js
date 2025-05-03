const { expect } = require('chai');
const NetatmoHandler = require('../../../../services/netatmo/lib');

const gladys = {};
const serviceId = '123';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('NetatmoHandler Constructor', () => {
  it('should properly initialize properties', () => {
    expect(netatmoHandler.gladys).to.equal(gladys);
    expect(netatmoHandler.serviceId).to.equal(serviceId);
    expect(netatmoHandler.configuration).to.deep.equal({
      clientId: null,
      clientSecret: null,
      energyApi: null,
      weatherApi: null,
      scopes: {
        scopeAircare: 'read_homecoach',
        scopeEnergy: 'read_thermostat write_thermostat',
        scopeHomeSecurity: 'read_camera read_presence read_carbonmonoxidedetector read_smokedetector',
        scopeWeather: 'read_station',
      },
    });
  });
});
