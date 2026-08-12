const { expect } = require('chai');

const { getFreePort } = require('../../utils/getFreePort');

describe('getFreePort', () => {
  it('should return a free port', async () => {
    const port = await getFreePort();
    expect(port).to.be.a('number');
    expect(port).to.be.greaterThan(0);
  });

  it('should retry when the port is excluded, and give up eventually', async () => {
    const firstPort = await getFreePort();
    const secondPort = await getFreePort(new Set([firstPort]));
    expect(secondPort).to.not.equal(firstPort);
    // a set excluding every possible port always gives up
    const everyPort = { has: () => true };
    // @ts-ignore
    await expect(getFreePort(everyPort, 2)).to.be.rejectedWith('UNABLE_TO_FIND_FREE_PORT');
  });
});
