const { expect } = require('chai');
const { intTo8bitsColorHex, to8bitsHex } = require('../../../../services/rflink/lib/utils/colors');

describe('RFLink colors converter', () => {
  it('should convert the value of the color picker', async () => {
    // TODO
    const code = to8bitsHex(161);
    expect(code).to.equal('A1');

    expect(to8bitsHex(177)).to.equal('B1');
    expect(to8bitsHex(193)).to.equal('C1');
    expect(to8bitsHex(209)).to.equal('D1');
    expect(to8bitsHex(225)).to.equal('E1');
    expect(to8bitsHex(241)).to.equal('F1');

    expect(intTo8bitsColorHex(12642)).to.equal('17');
  });
});
