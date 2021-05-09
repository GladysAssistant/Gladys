const nock = require('nock');
const { expect } = require('chai');
const { assert, fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const jsonstationdata = require('../../data/getstationsdata.json');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const jsonDeviceNothing = {
  body: {},
};

describe('netatmoManager getStationsData success', () => {
  it('should get all devices of NAMain', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/getstationsdata`)
      .reply(200, jsonstationdata);
    await netatmoManager.getStationsData();
    const sensors = await netatmoManager.getSensors();

    sensors.forEach((sensorDevice) => {
      expect(sensorDevice).to.have.property('name');
      expect(sensorDevice).to.have.property('selector');
      expect(sensorDevice).to.have.property('external_id');
      expect(sensorDevice).to.have.property('features');
      sensorDevice.features.forEach((sensorFeature) => {
        expect(sensorFeature).to.have.property('name');
        expect(sensorFeature).to.have.property('selector');
      });
    });
  });
});

describe('netatmoManager getStationsData with errors', () => {
  it('should get NAMain but with module unknown', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const jsonDevice = {
      body: {
        devices: [
          {
            _id: '18:cc:50:67:aa:09',
            type: 'NAMain',
            module_name: 'Hygrométrie Salon 2',
            wifi_status: 50,
            reachable: true,
            co2_calibrating: false,
            data_type: ['Temperature', 'CO2', 'Humidity', 'Noise', 'Pressure'],
            station_name: 'Maison Stark (Hygrométrie Salon 2)',
            home_id: '3iuhef7oihih89kojoihoui3',
            home_name: 'Maison Stark',
            dashboard_data: {
              time_utc: 1608764772,
              Temperature: 21,
              CO2: 548,
              Humidity: 61,
              Noise: 32,
              Pressure: 1005.1,
              AbsolutePressure: 990.6,
              min_temp: 20.9,
              max_temp: 21,
              date_max_temp: 1608764772,
              date_min_temp: 1608764470,
              temp_trend: 'stable',
              pressure_trend: 'stable',
            },
            modules: [
              {
                _id: '17:cc:50:67:aa:0e',
                type: 'NAModule5',
                module_name: 'Hygrométrie Extérieur',
                data_type: ['Snow'],
                battery_percent: 98,
                reachable: true,
                dashboard_data: {
                  Rain: 0.101,
                  sum_rain_1: 0.505,
                  sum_rain_24: 0.1,
                },
              },
            ],
          },
        ],
      },
    };
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/getstationsdata`)
      .reply(200, jsonDevice);
    await netatmoManager.getStationsData();
    assert.called(gladys.event.emit);
    const sensors = await netatmoManager.getSensors();

    sensors.forEach((sensorDevice) => {
      expect(sensorDevice).to.have.property('name');
      expect(sensorDevice).to.have.property('selector');
      expect(sensorDevice).to.have.property('external_id');
      expect(sensorDevice).to.have.property('features');
      sensorDevice.features.forEach((sensorFeature) => {
        expect(sensorFeature).to.have.property('name');
        expect(sensorFeature).to.have.property('selector');
      });
    });
  });

  it('should get NAMain without module', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const jsonDevice = {
      body: {
        devices: [
          {
            _id: '18:cc:50:67:aa:09',
            type: 'NAMain',
            module_name: 'Hygrométrie Salon 2',
            wifi_status: 50,
            reachable: true,
            co2_calibrating: false,
            data_type: ['Temperature', 'CO2', 'Humidity', 'Noise', 'Pressure'],
            station_name: 'Maison Stark (Hygrométrie Salon 2)',
            home_id: '3iuhef7oihih89kojoihoui3',
            home_name: 'Maison Stark',
            dashboard_data: {
              time_utc: 1608764772,
              Temperature: 21,
              CO2: 548,
              Humidity: 61,
              Noise: 32,
              Pressure: 1005.1,
              AbsolutePressure: 990.6,
              min_temp: 20.9,
              max_temp: 21,
              date_max_temp: 1608764772,
              date_min_temp: 1608764470,
              temp_trend: 'stable',
              pressure_trend: 'stable',
            },
          },
        ],
      },
    };
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/getstationsdata`)
      .reply(200, jsonDevice);
    await netatmoManager.getStationsData();
    assert.called(gladys.event.emit);
    const sensors = await netatmoManager.getSensors();

    sensors.forEach((sensorDevice) => {
      expect(sensorDevice).to.have.property('name');
      expect(sensorDevice).to.have.property('selector');
      expect(sensorDevice).to.have.property('external_id');
      expect(sensorDevice).to.have.property('features');
      sensorDevice.features.forEach((sensorFeature) => {
        expect(sensorFeature).to.have.property('name');
        expect(sensorFeature).to.have.property('selector');
      });
    });
  });

  it('should get error on device unknown', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const jsonDevice = {
      body: {
        devices: [
          {
            _id: '18:cc:50:67:aa:09',
            type: 'NewNAMain',
            module_name: 'New Weather Station',
            wifi_status: 50,
            reachable: true,
            co2_calibrating: false,
            data_type: ['Temperature', 'CO2', 'Humidity', 'Noise', 'Pressure'],
            station_name: 'Maison Stark (New Weather Station)',
            home_id: '3iuhef7oihih89kojoihoui3',
            home_name: 'Maison Stark',
          },
        ],
      },
    };
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/getstationsdata`)
      .reply(200, jsonDevice);
    await netatmoManager.getStationsData();
    assert.called(gladys.event.emit);
    const sensors = await netatmoManager.getSensors();
    expect(sensors).to.deep.equal([]);
  });

  it('should return nothing device - Error No data devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/getstationsdata`)
      .reply(200, jsonDeviceNothing);
    await netatmoManager.getStationsData();
    assert.called(gladys.event.emit);
    const sensors = await netatmoManager.getSensors();
    expect(sensors).to.deep.equal([]);
  });

  it('should failed getStationsData - Error code 400', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .post(`/api/getstationsdata`)
      .reply(400, { data: { body: 'Problem' } });
    await netatmoManager.getStationsData();
    assert.called(gladys.event.emit);
    const sensors = await netatmoManager.getSensors();
    expect(sensors).to.deep.equal([]);
  });
});
