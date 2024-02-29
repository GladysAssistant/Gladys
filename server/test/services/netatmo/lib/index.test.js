const { expect } = require('chai');
const { FfmpegMock, childProcessMock } = require('../FfmpegMock.test');
const NetatmoHandler = require('../../../../services/netatmo/lib');

const gladys = {};
const serviceId = '123';
const netatmoHandler = new NetatmoHandler(gladys, FfmpegMock, childProcessMock, serviceId);

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
        scopeHomeSecurity:
          'read_camera write_camera access_camera read_presence write_presence access_presence access_doorbell read_carbonmonoxidedetector read_smokedetector',
        scopeWeather: 'read_station',
      },
    });
  });
});
