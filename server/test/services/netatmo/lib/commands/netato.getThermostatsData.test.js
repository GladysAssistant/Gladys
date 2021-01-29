const nock = require('nock');
const { expect } = require('chai');
const { assert, fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const jsonGetThermostatsData = require('../../data/getThermostatsData.json');

const NetatmoManager = proxyquire('../../../../../services/netatmo/lib/index', {});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('netatmoManager getThermostatsData', () => {
  it('should get all devices of first NAPlug', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/getthermostatsdata?access_token=${netatmoManager.token}`)
      .reply(200, jsonGetThermostatsData);
    await netatmoManager.getThermostatsData();
    assert.called(gladys.event.emit);
    const sensors = await netatmoManager.getSensors();
    sensors.forEach((sensorDevice) => {
      expect(sensorDevice).to.have.property('name');
      expect(sensorDevice).to.have.property('selector');
      expect(sensorDevice).to.have.property('features');
      expect(sensorDevice.name).to.deep.equal(jsonGetThermostatsData.body.devices[0].modules[0].module_name);
      sensorDevice.features.forEach((sensorFeature) => {
        expect(sensorFeature).to.have.property('name');
        expect(sensorFeature).to.have.property('selector');
      });
      sensorDevice.params.forEach((sensorParam) => {
        expect(sensorParam).to.have.property('name');
        expect(sensorParam).to.have.property('value');
      });
    });
  });

  it('should get device NATherm and error on device unknown', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const jsonDevice = {
      body: {
        devices: [
          {
            _id: '17:cc:50:67:aa:0e',
            type: 'NAPlug',
            last_setup: 1578400589,
            firmware: 216,
            last_status_store: 1610014596,
            plug_connected_boiler: 1,
            wifi_status: 75,
            last_bilan: { y: 2020, m: 12 },
            modules: [
              {
                _id: '18:cc:50:67:aa:0f',
                type: 'NATherm2',
                firmware: 73,
                last_message: 1610014590,
                rf_status: 67,
                battery_vp: 4104,
                therm_orientation: 0,
                therm_relay_cmd: 200,
                anticipating: false,
                module_name: 'New Type Thermostat',
                battery_percent: 74,
              },
            ],
          },
        ],
      },
    };
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/getthermostatsdata?access_token=${netatmoManager.token}`)
      .reply(200, jsonDevice);
    await netatmoManager.getThermostatsData();
    assert.called(gladys.event.emit);
    const sensors = await netatmoManager.getSensors();
    expect(sensors).to.deep.equal([]);
  });

  it('should get nothing on the NAPlug', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const jsonDevice = {
      body: {
        devices: [
          {
            _id: '17:cc:50:67:aa:0e',
            type: 'NAPlug',
            last_setup: 1578400589,
            firmware: 216,
            last_status_store: 1610014596,
            plug_connected_boiler: 1,
            wifi_status: 75,
            last_bilan: { y: 2020, m: 12 },
          },
        ],
      },
    };
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/getthermostatsdata?access_token=${netatmoManager.token}`)
      .reply(200, jsonDevice);
    await netatmoManager.getThermostatsData();
    assert.called(gladys.event.emit);
    const sensors = await netatmoManager.getSensors();
    expect(sensors).to.deep.equal([]);
  });

  it('should return nothing devices', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const jsonDeviceNothing = {
      body: {},
    };
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/getthermostatsdata?access_token=${netatmoManager.token}`)
      .reply(200, jsonDeviceNothing);
    await netatmoManager.getThermostatsData();
    assert.called(gladys.event.emit);
    const sensors = await netatmoManager.getSensors();
    expect(sensors).to.deep.equal([]);
  });

  it('should failed getThermostatsData - Error code 400', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    nock(`${netatmoManager.baseUrl}`)
      .get(`/api/getthermostatsdata?access_token=${netatmoManager.token}`)
      .reply(400, { data: { body: 'Problem' } });
    await netatmoManager.getThermostatsData();
    assert.called(gladys.event.emit);
  });
});
