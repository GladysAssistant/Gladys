const { expect } = require('chai');
const sinon = require('sinon');
const DomoticzManager = require('../../../../services/domoticz/lib');
const { Gladys, MockedClient } = require('../mocks.test');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES, DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

describe('DomoticzManager', () => {
  const gladys = new Gladys();
  const serviceId = 'be86c4db-489f-466c-aeea-1e262c4ee720';
  const domoticzManager = new DomoticzManager(gladys, serviceId);
  const [server, port] = ['http://my_server', 1080];
  const client = new MockedClient(server, port);
  const sendAllSpy = sinon.spy();
  const newStateSpy = sinon.spy();
  gladys.event.on(EVENTS.WEBSOCKET.SEND_ALL, sendAllSpy);
  gladys.event.on(EVENTS.DEVICE.NEW_STATE, newStateSpy);

  it('should connect', async () => {
    const stub = sinon.stub(client, 'get');
    stub.returns({
      data: {
        status: 'OK',
        version: '2020-11',
        hash: '12345678',
        SystemName: 'Linux',
      },
    });

    await domoticzManager.connect(client);
    sinon.assert.calledWith(domoticzManager.client.get, 'json.htm', {
      params: { type: 'command', param: 'getversion' },
    });
    expect(domoticzManager.connected).to.equal(true);
    sinon.assert.calledOnce(sendAllSpy);
    sinon.assert.calledWith(sendAllSpy, {
      type: WEBSOCKET_MESSAGE_TYPES.DOMOTICZ.SERVER_READY,
      payload: { version: '2020-11', hash: '12345678', SystemName: 'Linux' },
    });

    sendAllSpy.resetHistory();
    stub.restore();
  });

  it('connect should report exception on Domoticz error', async () => {
    const stub = sinon.stub(client, 'get');
    stub.returns({
      data: {
        status: 'FAIL',
      },
    });

    try {
      await domoticzManager.connect(client);
    } catch (err) {
      expect(err).is.instanceOf(ServiceNotConfiguredError);
      expect(err.message).equal('DOMOTICZ_RESPONSE_ERROR');
      sinon.assert.calledOnce(sendAllSpy);
      sinon.assert.calledWith(sendAllSpy, {
        type: WEBSOCKET_MESSAGE_TYPES.DOMOTICZ.SERVER_FAILED,
        payload: { err },
      });
    }

    sendAllSpy.resetHistory();
    stub.restore();
  });

  it('should report exception on exception', async () => {
    const stub = sinon.stub(client, 'get');
    stub.throws();

    try {
      await domoticzManager.connect(client);
    } catch (err) {
      expect(err).is.instanceOf(ServiceNotConfiguredError);
      expect(err.message).equal('DOMOTICZ_CONNECT_ERROR');
      sinon.assert.calledOnce(sendAllSpy);
      sinon.assert.calledWith(sendAllSpy, {
        type: WEBSOCKET_MESSAGE_TYPES.DOMOTICZ.SERVER_FAILED,
        payload: { err },
      });
    }

    sendAllSpy.resetHistory();
    stub.restore();

    await domoticzManager.connect(client);
    sendAllSpy.resetHistory();
  });

  it('should get devices', async () => {
    const stub = sinon.stub(client, 'get');
    stub.returns({
      data: {
        status: 'OK',
        result: [
          {
            BatteryLevel: 255,
            Data: '13.1 C, 87 %, 1018 hPa',
            HardwareName: 'Open Weather',
            Name: 'Température et humidité',
            SubType: 'THB1 - BTHR918, BTHGN129',
            Type: 'Temp',
            idx: '5',
            LastUpdate: '2020-11-11 18:52:03',
          },
          {
            BatteryLevel: 255,
            Data: '12.5 C',
            HardwareName: 'RFXCom',
            Name: 'Etage',
            SubType: 'THB1 - BTHR918, BTHGN129',
            Type: 'Temp',
            idx: '7',
            LastUpdate: '2020-11-11 18:52:04',
          },
        ],
      },
    });

    const devices = await domoticzManager.getDevices('asc', '');
    expect(devices).to.deep.equal([
      {
        service_id: serviceId,
        external_id: 'domoticz:7',
        name: 'Etage',
        selector: 'domoticz-etage-7',
        model: 'RFXCom:THB1 - BTHR918, BTHGN129',
        room: 'Cuisine',
        should_poll: true,
        poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
        params: [],
        features: [
          {
            name: 'Etage',
            selector: 'domoticz-temp-etage-7',
            external_id: 'domoticz-temp-etage-7',
            category: 'temperature-sensor',
            type: 'decimal',
            read_only: true,
            keep_history: true,
            has_feedback: false,
            unit: 'celsius',
            min: -250,
            max: 1000,
            last_value: '12.5',
            last_value_changed: '2020-11-11 18:52:04',
          },
        ],
      },
      {
        service_id: serviceId,
        external_id: 'domoticz:5',
        name: 'Température et humidité',
        selector: 'domoticz-temperature-et-humidite-5',
        model: 'Open Weather:THB1 - BTHR918, BTHGN129',
        should_poll: true,
        poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
        params: [],
        features: [
          {
            name: 'Température et humidité',
            selector: 'domoticz-temp-temperature-et-humidite-5',
            external_id: 'domoticz-temp-temperature-et-humidite-5',
            category: 'temperature-sensor',
            type: 'decimal',
            read_only: true,
            keep_history: true,
            has_feedback: false,
            unit: 'celsius',
            min: -250,
            max: 1000,
            last_value: '13.1',
            last_value_changed: '2020-11-11 18:52:03',
          },
        ],
      },
    ]);

    sinon.assert.callCount(sendAllSpy, 0);
    stub.restore();
  });

  it('should get devices and sort', async () => {
    const stub = sinon.stub(client, 'get');
    stub.returns({
      data: {
        status: 'OK',
        result: [
          {
            BatteryLevel: 255,
            Data: '13.1 C, 87 %, 1018 hPa',
            HardwareName: 'Open Weather',
            Name: 'Température et humidité',
            SubType: 'THB1 - BTHR918, BTHGN129',
            Type: 'Temp',
            idx: '5',
            LastUpdate: '2020-11-11 18:52:03',
          },
          {
            BatteryLevel: 255,
            Data: '12.5 C',
            HardwareName: 'RFXCom',
            Name: 'Etage',
            SubType: 'THB1 - BTHR918, BTHGN129',
            Type: 'Temp',
            idx: '7',
            LastUpdate: '2020-11-11 18:52:04',
          },
        ],
      },
    });

    const devices = await domoticzManager.getDevices('des', '');
    expect(devices).to.deep.equal([
      {
        service_id: serviceId,
        external_id: 'domoticz:5',
        name: 'Température et humidité',
        selector: 'domoticz-temperature-et-humidite-5',
        model: 'Open Weather:THB1 - BTHR918, BTHGN129',
        should_poll: true,
        poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
        params: [],
        features: [
          {
            name: 'Température et humidité',
            selector: 'domoticz-temp-temperature-et-humidite-5',
            external_id: 'domoticz-temp-temperature-et-humidite-5',
            category: 'temperature-sensor',
            type: 'decimal',
            read_only: true,
            keep_history: true,
            has_feedback: false,
            unit: 'celsius',
            min: -250,
            max: 1000,
            last_value: '13.1',
            last_value_changed: '2020-11-11 18:52:03',
          },
        ],
      },
      {
        service_id: serviceId,
        external_id: 'domoticz:7',
        name: 'Etage',
        selector: 'domoticz-etage-7',
        model: 'RFXCom:THB1 - BTHR918, BTHGN129',
        room: 'Cuisine',
        should_poll: true,
        poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
        params: [],
        features: [
          {
            name: 'Etage',
            selector: 'domoticz-temp-etage-7',
            external_id: 'domoticz-temp-etage-7',
            category: 'temperature-sensor',
            type: 'decimal',
            read_only: true,
            keep_history: true,
            has_feedback: false,
            unit: 'celsius',
            min: -250,
            max: 1000,
            last_value: '12.5',
            last_value_changed: '2020-11-11 18:52:04',
          },
        ],
      },
    ]);

    sinon.assert.callCount(sendAllSpy, 0);
    stub.restore();
  });

  it('should get devices and filter', async () => {
    const stub = sinon.stub(client, 'get');
    stub.returns({
      data: {
        status: 'OK',
        result: [
          {
            BatteryLevel: 255,
            Data: '13.1 C, 87 %, 1018 hPa',
            HardwareName: 'Open Weather',
            Name: 'Température et humidité',
            SubType: 'THB1 - BTHR918, BTHGN129',
            Type: 'Temp',
            idx: '5',
            LastUpdate: '2020-11-11 18:52:03',
          },
          {
            BatteryLevel: 255,
            Data: '12.5 C',
            HardwareName: 'RFXCom',
            Name: 'Etage',
            SubType: 'THB1 - BTHR918, BTHGN129',
            Type: 'Temp',
            idx: '7',
            LastUpdate: '2020-11-11 18:52:04',
          },
        ],
      },
    });

    const devices = await domoticzManager.getDevices('', 'eta');
    expect(devices).to.deep.equal([
      {
        service_id: serviceId,
        external_id: 'domoticz:7',
        name: 'Etage',
        selector: 'domoticz-etage-7',
        model: 'RFXCom:THB1 - BTHR918, BTHGN129',
        room: 'Cuisine',
        should_poll: true,
        poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
        params: [],
        features: [
          {
            name: 'Etage',
            selector: 'domoticz-temp-etage-7',
            external_id: 'domoticz-temp-etage-7',
            category: 'temperature-sensor',
            type: 'decimal',
            read_only: true,
            keep_history: true,
            has_feedback: false,
            unit: 'celsius',
            min: -250,
            max: 1000,
            last_value: '12.5',
            last_value_changed: '2020-11-11 18:52:04',
          },
        ],
      },
    ]);

    stub.restore();
  });

  it('should update feature value', async () => {
    const stub = sinon.stub(client, 'get');
    stub.returns({
      data: {
        status: 'OK',
        result: [
          {
            BatteryLevel: 60,
            Data: '12.5 C',
            HardwareName: 'RFXCom',
            Name: 'Etage',
            SubType: 'THB1 - BTHR918, BTHGN129',
            Type: 'Temp',
            idx: '7',
            LastUpdate: '2020-11-11 18:52:04',
          },
        ],
      },
    });

    await domoticzManager.poll({
      service_id: 'abcd-0123-efgh',
      external_id: 'domoticz:7',
      name: 'Etage',
      selector: 'domoticz-etage-7',
      last_value_changed: '2020-11-11 18:50:00',
    });

    sinon.assert.calledWith(domoticzManager.client.get, 'json.htm', { params: { type: 'devices', rid: '7' } });
    sinon.assert.calledTwice(newStateSpy);
    sinon.assert.calledWith(newStateSpy, {
      device_feature_external_id: 'domoticz-temp-etage-7',
      state: '12.5',
    });
    sinon.assert.calledWith(newStateSpy, {
      device_feature_external_id: 'domoticz-battery-etage-7',
      state: 60,
    });
    newStateSpy.resetHistory();
    stub.restore();
  });

  it('should disconnect', async () => {
    await domoticzManager.disconnect();
    expect(domoticzManager.connected).equal(false);
  });
});
