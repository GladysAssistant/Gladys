const { expect } = require('chai');
const RfToObj = require('../../../../services/rflink/api/rflink.parse.RFtoObject');

describe('rflink.parse.RFtoObject', () => {
  it('should return an array with an index for each value', async () => {
    const data = '20;16;NewKaku;ID=00f79162;SWITCH=1;CMD=ON;';
    const newDevice = RfToObj(data);
    const expected = { protocol: 'NewKaku', features: [], id: '00f79162', switch: '1', cmd: 'ON' };
    expect(newDevice).to.be.an('object');
    expect(newDevice).to.deep.equal(expected);
  });

  it('should return nothing', async () => {
    const data = '20;16;OK;;;;';
    const newDevice = RfToObj(data);
    const expected = {};
    expect(newDevice).to.deep.equal(expected);
  });
});
