const { expect } = require('chai');
const { aqiToAirQuality, clampToCharacteristic } = require('../../../../services/homekit/lib/deviceMappings');

describe('Sensor value clamping', () => {
  it('should clamp a value between the characteristic bounds', () => {
    expect(clampToCharacteristic(150000, { minValue: 0.0001, maxValue: 100000 })).to.equal(100000);
    expect(clampToCharacteristic(-5, { minValue: 0, maxValue: 100000 })).to.equal(0);
    expect(clampToCharacteristic(250, { minValue: 0, maxValue: 100000 })).to.equal(250);
  });

  it('should leave the value alone when the characteristic declares no bound', () => {
    expect(clampToCharacteristic(150000, {})).to.equal(150000);
    expect(clampToCharacteristic(150000, { minValue: 0 })).to.equal(150000);
    expect(clampToCharacteristic(-5, { maxValue: 100000 })).to.equal(-5);
    expect(clampToCharacteristic(150000)).to.equal(150000);
  });
});

describe('Air quality index conversion', () => {
  it('should map every US EPA band to a HomeKit air quality level', () => {
    expect(aqiToAirQuality(0)).to.equal(1);
    expect(aqiToAirQuality(50)).to.equal(1);
    expect(aqiToAirQuality(51)).to.equal(2);
    expect(aqiToAirQuality(100)).to.equal(2);
    expect(aqiToAirQuality(150)).to.equal(3);
    expect(aqiToAirQuality(200)).to.equal(4);
    expect(aqiToAirQuality(201)).to.equal(5);
  });

  it('should report unknown for a value that is not an index', () => {
    expect(aqiToAirQuality(null)).to.equal(0);
    expect(aqiToAirQuality(undefined)).to.equal(0);
    expect(aqiToAirQuality(-1)).to.equal(0);
  });
});
