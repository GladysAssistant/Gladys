const { assert, expect } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');
const { buildFeatures } = require('../../../../services/zigbee2mqtt/utils/features/buildFeatures');

describe('zigbee2mqtt Excellux presence enumType', () => {
  const expose = {
    access: 1,
    name: 'presence',
    property: 'presence',
    type: 'enum',
    values: ['true', 'false'],
  };

  it('should build a read-only motion sensor feature', () => {
    const result = buildFeatures('Excellux motion sensor', expose);

    expect(result).to.deep.equal([
      {
        read_only: true,
        has_feedback: false,
        min: 0,
        max: 1,
        category: 'motion-sensor',
        type: 'binary',
        unit: null,
        name: 'Presence',
        external_id: 'zigbee2mqtt:Excellux motion sensor:motion-sensor:binary:presence',
        selector: 'zigbee2mqtt-excellux-motion-sensor-motion-sensor-binary-presence',
      },
    ]);
  });

  [
    { external: true, internal: 1 },
    { external: false, internal: 0 },
    { external: 'true', internal: 1 },
    { external: 'false', internal: 0 },
  ].forEach(({ external, internal }) => {
    it(`should read ${external} as ${internal}`, () => {
      assert.equal(enumType.readValue(expose, external), internal);
    });
  });

  it('should map Gladys values to the exposed enum values', () => {
    assert.equal(enumType.writeValue(expose, 1), 'true');
    assert.equal(enumType.writeValue(expose, 0), 'false');
  });
});
