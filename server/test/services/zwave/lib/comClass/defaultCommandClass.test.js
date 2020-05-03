const { expect } = require('chai');
const { defaultCommandClass } = require('../../../../../services/zwave/lib/comClass/defaultCommandClass');

describe('zWave Command Class Default', () => {
  it('should returns the valid commClassId', () => {
    expect(defaultCommandClass.getId()).equals(-1);
  });

  it('should return the value as it', () => {
    const node = {
      manufacturer: '',
      manufacturerid: '',
      product: '',
      producttype: '',
      productid: '',
      type: '',
      name: '',
      loc: '',
      classes: {
        '37': {
          '0': {
            value_id: '2-37-1-0',
            node_id: 2,
            class_id: 37,
            type: 'bool',
            genre: 'user',
            instance: 1,
            index: 0,
            label: 'Switch',
            units: '',
            help: '',
            read_only: false,
            write_only: false,
            min: 0,
            max: 0,
            is_polled: false,
            value: false,
          },
        },
      },
      ready: true,
    };

    const valueChanged = {
      value_id: '2-37-1-0',
      node_id: 2,
      class_id: 37,
      type: 'bool',
      genre: 'user',
      instance: 1,
      index: 0,
      label: 'Switch',
      units: '',
      help: '',
      read_only: false,
      write_only: false,
      min: 0,
      max: 0,
      is_polled: false,
      value: true,
    };

    expect(defaultCommandClass.getChangedValue(node, valueChanged)).equal(valueChanged);
  });
});
