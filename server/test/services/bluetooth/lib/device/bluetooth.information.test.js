const { expect } = require('chai');

const {
  encodeParamValue,
  decodeValue,
  encodeValue,
} = require('../../../../../services/bluetooth/lib/device/bluetooth.information');

describe('bluetooth.information', () => {
  it('encodeParamValue valued', () => {
    const result = encodeParamValue('  Hello\u0000  ');
    expect(result).eq('Hello');
  });

  it('encodeParamValue empty value', () => {
    const result = encodeParamValue('  ');
    expect(result).eq(undefined);
  });

  it('encodeParamValue not valued', () => {
    const result = encodeParamValue(null);
    expect(result).eq(undefined);
  });

  it('decodeValue unknown service with feature', () => {
    const result = decodeValue('0000', '0000', {}, 'd');
    expect(result).eq(13);
  });

  it('decodeValue unknown service no feature', () => {
    const result = decodeValue('0000', '0000', null, 'd');
    expect(result).eq('d');
  });

  it('decodeValue unknown characteristic with feature', () => {
    const result = decodeValue('1800', '0000', {}, 'd');
    expect(result).eq(13);
  });

  it('decodeValue unknown characteristic no feature', () => {
    const result = decodeValue('1800', '0000', null, 'd');
    expect(result).eq('d');
  });

  it('decodeValue', () => {
    const result = decodeValue('1800', '2a00', {}, 'd');
    expect(result).eq(13);
  });

  it('encodeValue unknown service', () => {
    const result = encodeValue('0000', '0000', 13);
    expect(result).eq('d');
  });

  it('encodeValue unknown characteristic', () => {
    const result = encodeValue('1800', '0000', 'ee');
    expect(result).eq('ee');
  });

  it('encodeValue', () => {
    const result = encodeValue('1800', '2a00', 13);
    expect(result).eq('d');
  });

  it('encodeValue NaN', () => {
    const result = encodeValue('1800', '2a00', 'rr');
    expect(result).eq('rr');
  });
});
