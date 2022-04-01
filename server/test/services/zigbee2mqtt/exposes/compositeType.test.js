const { assert } = require('chai');

const compositeType = require('../../../../services/zigbee2mqtt/exposes/compositeType');

describe('zigbee2mqtt compositeType', () => {
  it('should write color 16711680', () => {
    const result = compositeType.writeValue(null, 16711680);
    assert.deepEqual(result, { rgb: '255,0,0' });
  });

  it('should read color 16711680', () => {
    const result = compositeType.readValue(null, { x: 0.701, y: 0.299 });
    assert.equal(result, 16711680);
  });
});
