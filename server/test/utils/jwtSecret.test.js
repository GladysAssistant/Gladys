const { expect } = require('chai');
const { generateJwtSecret } = require('../../utils/jwtSecret');

describe('generateJwtSecret', () => {
  it('should generate a jwtSecret with the right length', async () => {
    const jwtSecret = generateJwtSecret();
    expect(jwtSecret).to.have.lengthOf(500);
  });
});
