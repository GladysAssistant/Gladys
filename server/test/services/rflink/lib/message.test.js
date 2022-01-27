const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { assert, fake, stub } = sinon;
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

describe('RFLinkHandler.message', () => {
  let gladys;
  let rflinkHandler;
  const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    rflinkHandler = new RFLinkHandler(gladys, serviceId);
    rflinkHandler.addNewDevice = stub();
    rflinkHandler.newValue = fake.returns(true);
  });

  it('should get a message from the RFLink with success', async () => {
    const msgRF = '20;16;NewKaku;ID=00f79162;SWITCH=1;CMD=ON;';

    await rflinkHandler.message(msgRF);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RFLINK.NEW_MESSAGE,
    });
  });

  it('should not get a message from the RFLink', async () => {
    const msgRF = '20;03;OK;';
    await rflinkHandler.message(msgRF);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RFLINK.NEW_MESSAGE,
    });
    assert.notCalled(rflinkHandler.newValue);
    assert.notCalled(rflinkHandler.addNewDevice);
  });

  it('should add a new sensor', async () => {
    // this "super" device is a sample of all the paramater that could be handled
    const msgRF =
      '20;e5;Oregon BTHR;ID=5a6d;TEMP=00be;HUM=40;BARO=03d7;UV=40;LUX=40;BAT=OK;RAIN=0010;WINDIR=0002;WINSP=0060;WINGS=0088;AWINSP=0060;CO2=50;RGBW=50;';
    await rflinkHandler.message(msgRF);
    assert.calledOnce(rflinkHandler.addNewDevice);
  });

  it('should add a new switch', async () => {
    // this "super" device is a sample of all the paramater that could be handled
    const msgRF = '20;e5;Oregon BTHR;ID=5a6d;RGBW=50;SWITCH=11;CMD=ON';
    await rflinkHandler.message(msgRF);
    assert.calledOnce(rflinkHandler.addNewDevice);
  });

  it('should add a new milight device', async () => {
    // this "super" device is a sample of all the paramater that could be handled
    const msgRF = '20;29;MiLightv1;ID=5a6d;SWITCH=01;RGBW=07c8;CMD=MODE;';
    await rflinkHandler.message(msgRF);
    assert.calledOnce(rflinkHandler.addNewDevice);
  });

  it('should update value of an existing sensor', async () => {
    const msgRF =
      '20;e5;Oregon BTHR;ID=5a6d;TEMP=00be;HUM=40;BARO=03d7;UV=40;LUX=40;BAT=OK;RAIN=0010;WINDIR=0002;WINSP=0060;WINGS=0088;AWINSP=0060;CO2=50;RGBW=50;';
    const device = { external_id: 'rflink:5a6d:undefined' };
    rflinkHandler.newDevices = [device];
    await rflinkHandler.message(msgRF);
    const msg = {
      id: '5a6d',
      protocol: 'Oregon BTHR',
      features: [],
      temp: '00be',
      baro: '03d7',
      hum: '40',
      uv: '40',
      lux: '40',
      bat: 'OK',
      rain: '0010',
      winsp: '0060',
      windir: '0002',
      wings: '0088',
      awinsp: '0060',
      co2: '50',
      rgbw: '50',
    };
    assert.notCalled(rflinkHandler.addNewDevice);
    assert.callCount(rflinkHandler.newValue, 14);
    assert.calledWith(rflinkHandler.newValue, msg, 'temperature', msg.temp);
    assert.calledWith(rflinkHandler.newValue, msg, 'humidity', msg.hum);
    assert.calledWith(rflinkHandler.newValue, msg, 'pressure', msg.baro);
    assert.calledWith(rflinkHandler.newValue, msg, 'light-intensity', msg.lux);
    assert.calledWith(rflinkHandler.newValue, msg, 'uv', msg.uv);
    assert.calledWith(rflinkHandler.newValue, msg, 'battery', msg.bat);
    assert.calledWith(rflinkHandler.newValue, msg, 'rain', msg.rain);
    assert.calledWith(rflinkHandler.newValue, msg, 'wind-speed', msg.winsp);
    assert.calledWith(rflinkHandler.newValue, msg, 'wind-dir', msg.windir);
    assert.calledWith(rflinkHandler.newValue, msg, 'wind-speed', msg.wings);
    assert.calledWith(rflinkHandler.newValue, msg, 'wind-speed', msg.awinsp);
    assert.calledWith(rflinkHandler.newValue, msg, 'co2', msg.co2);
    assert.calledWith(rflinkHandler.newValue, msg, 'color', msg.rgbw);
    assert.calledWith(rflinkHandler.newValue, msg, 'brightness', msg.rgbw);
  });

  it('should add a new sensor (temperature, humidity, pressure)', async () => {
    const msgRF = '20;e5;Oregon BTHR;ID=5a6d;TEMP=00be;HUM=40;BARO=03d7;BAT=OK;';
    await rflinkHandler.message(msgRF);
    assert.calledOnce(rflinkHandler.addNewDevice);
  });

  it('should add a new wind sensor (direction, speed, chill, gust)', async () => {
    const msgRF = '20;47;Cresta;ID=8001;WINDIR=0002;WINSP=0060;WINGS=0088;WINCHL=b0;';
    rflinkHandler.newDevices = [];
    await rflinkHandler.message(msgRF);
    assert.calledOnce(rflinkHandler.addNewDevice);
  });

  it('should add a new CO2 sensor', async () => {
    const msgRF = '20;ba;Oregon UVN128/138;ID=ea7c;CO2=0030;BAT=OK;';
    await rflinkHandler.message(msgRF);
    assert.calledOnce(rflinkHandler.addNewDevice);
  });

  it('should add a new uv sensor', async () => {
    const msgRF = '20;ba;Oregon UVN128/138;ID=ea7c;UV=0030;BAT=OK;';
    await rflinkHandler.message(msgRF);
    assert.calledOnce(rflinkHandler.addNewDevice);
  });

  it('should add a new rain sensor', async () => {
    const msgRF = '20;08;UPM/Esic;ID=1003;RAIN=0010;BAT=OK;';
    await rflinkHandler.message(msgRF);
    assert.calledOnce(rflinkHandler.addNewDevice);
  });

  it('should handle a message with a cmd SWITCH value of an existing device', async () => {
    const msgRF = '20;47;Cresta;ID=8001;SWITCH=11;CMD=ON;';
    const device = { external_id: 'rflink:8001:11' };
    // store device
    rflinkHandler.newDevices = [device];
    await rflinkHandler.message(msgRF);

    const msg = { protocol: 'Cresta', features: [], id: '8001', switch: '11', cmd: 'ON' };
    assert.notCalled(rflinkHandler.addNewDevice);
    assert.calledWith(rflinkHandler.newValue, msg, 'switch', msg.cmd);
  });

  it('should handle a message with a cmd MODE value of an existing milight device', async () => {
    const msgRF = '20;47;MiLightv1;ID=8001;CMD=MODE;';
    const device = { external_id: 'rflink:8001:undefined' };
    // store device
    rflinkHandler.newDevices = [device];
    await rflinkHandler.message(msgRF);

    const msg = { protocol: 'MiLightv1', features: [], id: '8001', cmd: 'MODE' };
    assert.notCalled(rflinkHandler.addNewDevice);
    assert.calledWith(rflinkHandler.newValue, msg, 'milight-mode', msg.cmd);
  });

  it('should handle a message with a cmd DISCO value of an existing milight device', async () => {
    const msgRF = '20;47;MiLightv1;ID=8001;CMD=DISCO;';
    const device = { external_id: 'rflink:8001:undefined' };
    // store device
    rflinkHandler.newDevices = [device];
    await rflinkHandler.message(msgRF);

    const msg = { protocol: 'MiLightv1', features: [], id: '8001', cmd: 'DISCO' };
    assert.notCalled(rflinkHandler.addNewDevice);
    assert.calledWith(rflinkHandler.newValue, msg, 'milight-mode', msg.cmd);
  });

  it('should log an undefined id', async () => {
    const msgRF = '20;08;UPM/Esic;10;RAINY=0010;BAT=OK;';
    await rflinkHandler.message(msgRF);
    assert.notCalled(rflinkHandler.newValue);
    assert.notCalled(rflinkHandler.addNewDevice);
  });

  it('should log a non valid id', async () => {
    const msgRF = '20;ba;Oregon UVN128/138;IDea7c;CO2=0030;BAT=OK;';
    await rflinkHandler.message(msgRF);
    assert.notCalled(rflinkHandler.newValue);
    assert.notCalled(rflinkHandler.addNewDevice);
  });
});
