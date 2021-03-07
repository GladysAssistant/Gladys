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

  it('should add a new sensor (temperature, humidity, pressure)', async () => {
    const msgRF = '20;e5;Oregon BTHR;ID=5a6d;TEMP=00be;HUM=40;BARO=03d7;BAT=OK;';
    await rflinkHandler.message(msgRF);
    assert.calledOnce(rflinkHandler.addNewDevice);
  });

  it('should update value of an existing temperature sensor (temperature, humidity, pressure)', async () => {
    const msgRF = '20;e5;Oregon BTHR;ID=5a6d;TEMP=00be;HUM=40;BARO=03d7;BAT=OK;';
    const device = {external_id: 'rflink:5a6d:undefined'};
    rflinkHandler.newDevices = [ device ];
    await rflinkHandler.message(msgRF);
    const msg = {
                  baro: '03d7',
                  bat: 'OK',
                  features: [],
                  hum: '40',
                  id: '5a6d',
                  protocol: 'Oregon BTHR',
                  temp: '00be'
                };
    assert.callCount(rflinkHandler.newValue, 4);
    assert.calledWith(rflinkHandler.newValue, msg, 'battery', msg.bat);
    assert.calledWith(rflinkHandler.newValue, msg, 'pressure', msg.baro);
    assert.calledWith(rflinkHandler.newValue, msg, 'humidity', msg.hum);
    assert.calledWith(rflinkHandler.newValue, msg, 'temperature', msg.temp);

  });

  it('should add a new wind sensor (direction, speed, chill, gust)', async () => {
    const msgRF = '20;47;Cresta;ID=8001;WINDIR=0002;WINSP=0060;WINGS=0088;WINCHL=b0;';
    rflinkHandler.newDevices = [];
    await rflinkHandler.message(msgRF);
    assert.calledOnce(rflinkHandler.addNewDevice);

  });

  it('should update value of an existing wind sensor (direction, speed, chill, gust)', async () => {
    const msgRF = '20;47;Cresta;ID=8001;WINDIR=0002;WINSP=0060;WINGS=0088;WINCHL=b0;';
    const device = {external_id: 'rflink:8001:undefined'};
    rflinkHandler.newDevices = [ device ];
    await rflinkHandler.message(msgRF);
    const msg = { protocol: 'Cresta',
                  features: [],
                  id: '8001',
                  windir: '0002',
                  winsp: '0060',
                  wings: '0088',
                  winchl: 'b0' };
    assert.callCount(rflinkHandler.newValue, 3);
    assert.calledWith(rflinkHandler.newValue, msg, 'wind-speed', msg.winsp);
    assert.calledWith(rflinkHandler.newValue, msg, 'wind-dir', msg.windir);
    assert.calledWith(rflinkHandler.newValue, msg, 'wind-speed', msg.wings);
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

  it('should log an undefined id', async () => {
    const msgRF = '20;08;UPM/Esic;10;RAINY=0010;BAT=OK;';
    await rflinkHandler.message(msgRF);
    assert.notCalled(rflinkHandler.newValue);
    assert.notCalled(rflinkHandler.addNewDevice);
  });

});
