const { expect } = require('chai');
const { buildExpandObject } = require('../../utils/buildExpandObject');

describe('buildExpandObject', () => {
  it('should return empty object', async () => {
    const fields = buildExpandObject(undefined);
    expect(fields).to.deep.equal({});
  });
  it('should return empty object', async () => {
    const fields = buildExpandObject('');
    expect(fields).to.deep.equal({});
  });
  it('should return empty object', async () => {
    const fields = buildExpandObject(null);
    expect(fields).to.deep.equal({});
  });
  it('should return temperature true', async () => {
    const fields = buildExpandObject('temperature');
    expect(fields).to.deep.equal({
      temperature: true,
    });
  });
  it('should return temperature + humidity true', async () => {
    const fields = buildExpandObject('temperature,humidity');
    expect(fields).to.deep.equal({
      temperature: true,
      humidity: true,
    });
  });
});
