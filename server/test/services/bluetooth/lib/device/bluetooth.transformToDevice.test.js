const { expect } = require('chai');

const { transformToDevice } = require('../../../../../services/bluetooth/lib/device/bluetooth.transformToDevice');

describe('bluetooth.transformToDevice', () => {
  it('transformToDevice with advertisement and connectable', () => {
    const peripheral = {
      uuid: 'uuid',
      address: 'address',
      advertisement: {
        localName: 'LocalName',
      },
      connectable: true,
    };
    const result = transformToDevice(peripheral);
    const expectedResult = {
      name: 'LocalName',
      external_id: 'bluetooth:uuid',
      selector: 'bluetooth-uuid',
      features: [],
      params: [],
    };
    expect(result).deep.eq(expectedResult);
  });

  it('transformToDevice with advertisement not connectable', () => {
    const peripheral = {
      uuid: 'uuid',
      address: 'address',
      advertisement: {
        localName: 'LocalName',
      },
    };
    const result = transformToDevice(peripheral);
    const expectedResult = {
      name: 'LocalName',
      external_id: 'bluetooth:uuid',
      selector: 'bluetooth-uuid',
      features: [],
      params: [
        {
          name: 'loaded',
          value: 'true',
        },
      ],
    };
    expect(result).deep.eq(expectedResult);
  });

  it('transformToDevice with address', () => {
    const peripheral = {
      uuid: 'uuid',
      address: 'address',
    };
    const result = transformToDevice(peripheral);
    const expectedResult = {
      name: 'address',
      external_id: 'bluetooth:uuid',
      selector: 'bluetooth-uuid',
      features: [],
      params: [
        {
          name: 'loaded',
          value: 'true',
        },
      ],
    };
    expect(result).deep.eq(expectedResult);
  });

  it('transformToDevice with uuid', () => {
    const peripheral = {
      uuid: 'uuid',
    };
    const result = transformToDevice(peripheral);
    const expectedResult = {
      name: 'uuid',
      external_id: 'bluetooth:uuid',
      selector: 'bluetooth-uuid',
      features: [],
      params: [
        {
          name: 'loaded',
          value: 'true',
        },
      ],
    };
    expect(result).deep.eq(expectedResult);
  });
});
