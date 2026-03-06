const { assert } = require('chai');

const compositeType = require('../../../../services/zigbee2mqtt/exposes/compositeType');

describe('zigbee2mqtt compositeType', () => {
  const colorExpose = { name: 'color_xy' };

  it('should write color 16711680', () => {
    const result = compositeType.writeValue(colorExpose, 16711680);
    assert.deepEqual(result, { rgb: '255,0,0' });
  });

  it('should read color 16711680', () => {
    const result = compositeType.readValue(colorExpose, { x: 0.701, y: 0.299 });
    assert.equal(result, 16711680);
  });

  it('should pass through value for non-color composite (write)', () => {
    const warningExpose = { name: 'warning' };
    const result = compositeType.writeValue(warningExpose, 'burglar');
    assert.equal(result, 'burglar');
  });

  it('should pass through value for non-color composite (read)', () => {
    const warningExpose = { name: 'warning' };
    const result = compositeType.readValue(warningExpose, 'burglar');
    assert.equal(result, 'burglar');
  });
});
