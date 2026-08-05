const { expect } = require('chai');
const sinon = require('sinon');

const { getGladysImageName } = require('../../../lib/system/system.getGladysImageName');

describe('system.getGladysImageName', () => {
  it('should return the image of the running Gladys container', async () => {
    const self = {
      getGladysContainerId: sinon.stub().resolves('abc123'),
      inspectContainer: sinon.stub().resolves({ Config: { Image: 'gladysassistant/gladys:v4' } }),
    };
    const image = await getGladysImageName.call(self);
    expect(image).to.equal('gladysassistant/gladys:v4');
    sinon.assert.calledOnceWithExactly(self.inspectContainer, 'abc123');
  });
});
