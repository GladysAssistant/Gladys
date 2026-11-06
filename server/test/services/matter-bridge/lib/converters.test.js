const { expect } = require('chai');

const converters = require('../../../../services/matter-bridge/lib/converters');
const { AIR_QUALITY, BAT_CHARGE_LEVEL } = require('../../../../services/matter-bridge/lib/constants');

describe('Matter bridge converters', () => {
  it('should tell numbers apart', () => {
    expect(converters.isNumber(0)).to.equal(true);
    expect(converters.isNumber(null)).to.equal(false);
    expect(converters.isNumber(NaN)).to.equal(false);
    expect(converters.isNumber('1')).to.equal(false);
  });

  it('should bound a value', () => {
    expect(converters.clamp(-1, 0, 10)).to.equal(0);
    expect(converters.clamp(11, 0, 10)).to.equal(10);
    expect(converters.clamp(5, 0, 10)).to.equal(5);
  });

  it('should convert brightness to and from a Matter level', () => {
    expect(converters.toLevel(100, { min: 0, max: 100 })).to.equal(254);
    expect(converters.toLevel(0, { min: 0, max: 100 })).to.equal(1);
    expect(converters.toLevel(255, { min: 0, max: 255 })).to.equal(254);
    // A feature without range is taken as 0-100.
    expect(converters.toLevel(50, {})).to.equal(128);
    expect(converters.fromLevel(254, { min: 0, max: 100 })).to.equal(100);
    expect(converters.fromLevel(1, { min: 0, max: 100 })).to.equal(0);
  });

  it('should convert colour temperatures to and from mireds', () => {
    expect(converters.toMireds(0, { min: 0, max: 100 })).to.equal(153);
    expect(converters.toMireds(100, { min: 0, max: 100 })).to.equal(500);
    expect(converters.fromMireds(500, { min: 0, max: 100 })).to.equal(100);
    expect(converters.fromMireds(153, { min: 0, max: 100 })).to.equal(0);
  });

  it('should convert colours to and from hue and saturation', () => {
    expect(converters.colorToHueSaturation(0xff0000)).to.deep.equal({ currentHue: 0, currentSaturation: 254 });
    expect(converters.colorToHueSaturation(0x00ff00)).to.deep.equal({ currentHue: 85, currentSaturation: 254 });
    expect(converters.hueSaturationToColor(0, 254)).to.equal(0xff0000);
    expect(converters.hueSaturationToColor(0, 0)).to.equal(0xffffff);
  });

  it('should convert CIE xy coordinates to a colour', () => {
    expect(converters.xyToColor(45940, 19595)).to.equal(0xff0000);
    expect(converters.xyToColor(1000, 0)).to.equal(null);
  });

  it('should convert cover positions, Gladys open being Matter 0', () => {
    expect(converters.toLiftPercent100ths(100, { min: 0, max: 100 })).to.equal(0);
    expect(converters.toLiftPercent100ths(0, { min: 0, max: 100 })).to.equal(10000);
    expect(converters.toLiftPercent100ths(75, { min: 0, max: 100 })).to.equal(2500);
    expect(converters.fromLiftPercent100ths(2500, { min: 0, max: 100 })).to.equal(75);
    expect(converters.fromLiftPercent100ths(0, { min: 0, max: 100 })).to.equal(100);
  });

  it('should convert temperatures to hundredths of a degree Celsius', () => {
    expect(converters.toCelsius100ths(21.5, 'celsius')).to.equal(2150);
    expect(converters.toCelsius100ths(212, 'fahrenheit')).to.equal(10000);
    expect(converters.toCelsius100ths(-400, 'celsius')).to.equal(-27315);
    expect(converters.toCelsius100ths(300, 'kelvin')).to.equal(2685);
  });

  it('should convert a colour temperature to the colour of that white', () => {
    expect(converters.miredsToColor(370)).to.equal(0xffa758);
    // Temperatures out of the range of the light are brought back into it.
    expect(converters.miredsToColor(1000)).to.equal(converters.miredsToColor(500));
    expect(converters.miredsToColor(null)).to.equal(null);
    expect(converters.miredsToColor(0)).to.equal(null);
  });

  it('should convert humidity to hundredths of a percent', () => {
    expect(converters.toHumidity100ths(45.5)).to.equal(4550);
    expect(converters.toHumidity100ths(120)).to.equal(10000);
  });

  it('should convert lux to the Matter logarithmic scale', () => {
    expect(converters.luxToIlluminance(0)).to.equal(0);
    expect(converters.luxToIlluminance(1)).to.equal(1);
    expect(converters.luxToIlluminance(1000)).to.equal(30001);
    expect(converters.luxToIlluminance(1e10)).to.equal(65534);
  });

  it('should convert pressures to hectopascals', () => {
    expect(converters.toPressure(1013, 'hPa')).to.equal(1013);
    expect(converters.toPressure(101300, 'pascal')).to.equal(1013);
    expect(converters.toPressure(101.3, 'kPa')).to.equal(1013);
    expect(converters.toPressure(1, 'bar')).to.equal(1000);
    expect(converters.toPressure(1013, 'milli-bar')).to.equal(1013);
    expect(converters.toPressure(10, 'psi')).to.equal(689);
    expect(converters.toPressure(1013, undefined)).to.equal(1013);
    expect(converters.toPressure(1e6, 'bar')).to.equal(32767);
  });

  it('should convert battery levels', () => {
    expect(converters.toBattery(50)).to.deep.equal({ batPercentRemaining: 100, batChargeLevel: BAT_CHARGE_LEVEL.OK });
    expect(converters.toBattery(15)).to.deep.equal({
      batPercentRemaining: 30,
      batChargeLevel: BAT_CHARGE_LEVEL.WARNING,
    });
    expect(converters.toBattery(5)).to.deep.equal({
      batPercentRemaining: 10,
      batChargeLevel: BAT_CHARGE_LEVEL.CRITICAL,
    });
    expect(converters.toBattery(150).batPercentRemaining).to.equal(200);
  });

  it('should derive the air quality, PM2.5 first', () => {
    expect(converters.airQualityOf({ pm25: 10, co2: 3000 })).to.equal(AIR_QUALITY.GOOD);
    expect(converters.airQualityOf({ pm25: 100 })).to.equal(AIR_QUALITY.EXTREMELY_POOR);
    expect(converters.airQualityOf({ co2: 1200 })).to.equal(AIR_QUALITY.MODERATE);
    expect(converters.airQualityOf({ pm25: null, co2: null })).to.equal(AIR_QUALITY.UNKNOWN);
  });
});
