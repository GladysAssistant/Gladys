const { expect } = require('chai');

const { convertDevice } = require('../../../../../services/melcloud-home/lib/device/melcloud-home.convertDevice');

describe('MELCloudHome convertDevice', () => {
  it('should convert an air-to-air unit to a Gladys device', () => {
    const device = convertDevice({
      id: 'unit-id',
      givenDisplayName: 'Salon',
      buildingId: 'building-id',
      connectedInterfaceType: 'fourthGenWifi',
      capabilities: { minTempHeat: 10, maxTempCoolDry: 31 },
      settings: [{ name: 'Power', value: 'True' }],
    });

    expect(device).to.include({
      name: 'Salon',
      external_id: 'melcloud-home:unit-id',
      selector: 'melcloud-home:unit-id',
      model: 'fourthGenWifi',
      should_poll: true,
    });
    expect(device.features).to.have.lengthOf(4);
    expect(device.params).to.deep.equal([{ name: 'buildingID', value: 'building-id' }]);
  });

  it('should fall back to the unit id as name', () => {
    const device = convertDevice({ id: 'unit-id', buildingId: 'building-id' });
    expect(device.name).to.equal('unit-id');
    expect(device.model).to.equal(null);
  });
});
