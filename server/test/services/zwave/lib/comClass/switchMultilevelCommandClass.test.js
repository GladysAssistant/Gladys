const { expect } = require('chai');
const { COMMAND_CLASSES, INDEXES } = require('../../../../../services/zwave/lib/constants');
const switchMultilevelCommandClass = require('../../../../../services/zwave/lib/comClass/switchMultilevelCommandClass')
  .instance;

const nodeV4 = {
  manufacturer: '',
  manufacturerid: '',
  product: '',
  producttype: '',
  productid: '',
  type: '',
  name: '',
  loc: '',
  classes: {
    '38': {
      '0': {
        value_id: '16-38-1-0',
        node_id: 16,
        class_id: 38,
        type: 'byte',
        genre: 'user',
        instance: 1,
        index: 0,
        label: 'Level',
        units: '',
        help: 'The Current Level of the Device',
        read_only: false,
        write_only: false,
        min: 0,
        max: 255,
        is_polled: false,
        value: 10,
      },
      '9': {
        value_id: '16-38-1-9',
        node_id: 16,
        class_id: 38,
        type: 'byte',
        genre: 'system',
        instance: 1,
        index: 9,
        label: 'Target Value',
        units: '',
        help: '',
        read_only: true,
        write_only: false,
        min: 0,
        max: 255,
        is_polled: false,
        value: 10,
      },
    },
  },
  ready: true,
};

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
    '38': {
      '0': {
        value_id: '16-38-1-0',
        node_id: 16,
        class_id: 38,
        type: 'byte',
        genre: 'user',
        instance: 1,
        index: 0,
        label: 'Level',
        units: '',
        help: 'The Current Level of the Device',
        read_only: false,
        write_only: false,
        min: 0,
        max: 255,
        is_polled: false,
        value: 10,
      },
    },
  },
  ready: true,
};

describe('zWave Command Class Switch Multi Level', () => {
  it('should returns the valid commClassId', () => {
    expect(switchMultilevelCommandClass.getId()).equals(COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL);
  });

  it('should returns Level value as it if not supporting V4', () => {
    const valueChanged = {
      value_id: '16-38-1-0',
      node_id: 16,
      class_id: 38,
      type: 'byte',
      genre: 'user',
      instance: 1,
      index: 0,
      label: 'Level',
      units: '',
      help: 'The Current Level of the Device',
      read_only: false,
      write_only: false,
      min: 0,
      max: 255,
      is_polled: false,
      value: 50,
    };

    expect(switchMultilevelCommandClass.getChangedValue(node, valueChanged)).equal(valueChanged);
  });

  it('should returns Level value if detecting Target changed value', () => {
    const value = {
      value_id: '16-38-1-9',
      node_id: 16,
      class_id: 38,
      type: 'byte',
      genre: 'system',
      instance: 1,
      index: 9,
      label: 'Target Value',
      units: '',
      help: '',
      read_only: true,
      write_only: false,
      min: 0,
      max: 255,
      is_polled: false,
      value: 50,
    };

    const valueChanged = switchMultilevelCommandClass.getChangedValue(nodeV4, value);

    expect(valueChanged).to.be.a('object');
    expect(valueChanged).to.have.property('index', INDEXES.INDEX_SWITCH_MULTILEVEL_LEVEL);
    expect(valueChanged).to.have.property('value', value.value);
  });

  it('should returns no value if detecting Level value changed on node supporting V4', () => {
    const value = {
      value_id: '16-38-1-0',
      node_id: 16,
      class_id: 38,
      type: 'byte',
      genre: 'user',
      instance: 1,
      index: 0,
      label: 'Level',
      units: '',
      help: 'The Current Level of the Device',
      read_only: false,
      write_only: false,
      min: 0,
      max: 255,
      is_polled: false,
      value: 50,
    };

    expect(switchMultilevelCommandClass.getChangedValue(nodeV4, value)).equal(null);
  });

  it('should returns value as it if not Level neither Target value on node supporting V4', () => {
    const value = {
      value_id: '16-38-1-5',
      node_id: 16,
      class_id: 38,
      type: 'byte',
      genre: 'system',
      instance: 1,
      index: 5,
      label: 'Dimming Duration',
      units: '',
      help: 'Duration taken when changing the Level of a Device',
      read_only: false,
      write_only: false,
      min: 0,
      max: 255,
      is_polled: false,
      value: 0,
    };

    expect(switchMultilevelCommandClass.getChangedValue(nodeV4, value)).equal(value);
  });
});
