const { assert } = require('chai');

const compositeType = require('../../../../services/zigbee2mqtt/exposes/compositeType');

describe('zigbee2mqtt compositeType', () => {
  const colorExpose = { name: 'color_xy', property: 'color', type: 'composite' };

  it('should write color 16711680', () => {
    const result = compositeType.writeValue(colorExpose, 16711680);
    assert.deepEqual(result, { rgb: '255,0,0' });
  });

  it('should read color 16711680', () => {
    const result = compositeType.readValue(colorExpose, { x: 0.701, y: 0.299 });
    assert.equal(result, 16711680);
  });

  it('should not write value of an unhandled composite', () => {
    const result = compositeType.writeValue({ name: 'unknown_composite' }, 1);
    assert.equal(result, undefined);
  });

  it('should not read value of an unhandled composite', () => {
    const result = compositeType.readValue({ name: 'unknown_composite' }, 1);
    assert.equal(result, undefined);
  });

  it('should not write value without expose', () => {
    const result = compositeType.writeValue(undefined, 1);
    assert.equal(result, undefined);
  });

  it('should not read value without expose', () => {
    const result = compositeType.readValue(undefined, 1);
    assert.equal(result, undefined);
  });
});
