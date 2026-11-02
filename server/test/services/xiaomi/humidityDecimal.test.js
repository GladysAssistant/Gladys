const EventEmitter = require('events');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const DgramMock = require('./DgramMock.test');

const XiaomiManager = proxyquire('../../../services/xiaomi/lib', {
  dgram: DgramMock,
});

describe('xiaomi humidity decimal value', () => {
  it('should keep the decimal digit of a humidity report', async () => {
    const states = [];
    const gladys = {
      event: new EventEmitter(),
    };
    gladys.event.on('device.new-state', (event) => {
      states.push(event);
    });
    const xiaomiManager = new XiaomiManager(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    xiaomiManager.listen();

    await xiaomiManager.onMessage(
      JSON.stringify({
        sid: 'humiditytest1',
        model: 'sensor_ht',
        data: JSON.stringify({
          temperature: 228,
          humidity: 5280,
          voltage: 3000,
        }),
      }),
      { address: '192.168.1.10' },
    );

    const humidity = states.find((s) => s.device_feature_external_id === 'xiaomi:humiditytest1:humidity');
    expect(humidity).to.be.an('object');
    // the gateway reports humidity scaled by 100: 5280 = 52.8%
    expect(humidity.state).to.equal(52.8);
  });
});
