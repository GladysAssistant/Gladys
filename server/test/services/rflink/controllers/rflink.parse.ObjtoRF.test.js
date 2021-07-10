const { expect } = require('chai');
const ObjToRF = require('../../../../services/rflink/api/rflink.parse.ObjToRF');

describe('rflink.parse.ObjToRF', () => {
  it('should return a string rfcode', async () => {
    const device = {
      id: '86aa7',
      switch: 'switch',
      external_id: `rflink:86aa7:11`,
      model: 'Tristate',
    };
    const deviceFeature = 'SWITCH';
    const state = 'ON';
    const rfcode = ObjToRF(device, deviceFeature, state);
    const expected = '10;Tristate;86aa7;11;ON;\n';
    expect(rfcode).to.be.an('string');
    expect(rfcode).to.deep.equal(expected);
  });

  it('should return a string rfcode without channel nor state', async () => {
    const device = {
      id: '86aa7',
      switch: 'switch',
      external_id: `rflink:86aa7`,
      model: 'Tristate',
    };
    const deviceFeature = 'SWITCH';
    const state = undefined;
    const rfcode = ObjToRF(device, deviceFeature, state);
    const expected = '10;Tristate;86aa7;\n';
    expect(rfcode).to.be.an('string');
    expect(rfcode).to.deep.equal(expected);
  });
});
