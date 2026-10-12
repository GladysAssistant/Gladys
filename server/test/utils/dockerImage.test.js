const { expect } = require('chai');

const { parseImageReference } = require('../../utils/dockerImage');

describe('parseImageReference', () => {
  it('should parse an image with a tag', () => {
    expect(parseImageReference('gladysassistant/gladys:v4')).to.deep.equal({
      repository: 'gladysassistant/gladys',
      tag: 'v4',
      digest: undefined,
    });
  });

  it('should default to the latest tag', () => {
    expect(parseImageReference('gladysassistant/gladys')).to.deep.equal({
      repository: 'gladysassistant/gladys',
      tag: 'latest',
      digest: undefined,
    });
  });

  it('should not confuse a registry port with a tag', () => {
    expect(parseImageReference('registry.local:5000/gladysassistant/gladys')).to.deep.equal({
      repository: 'registry.local:5000/gladysassistant/gladys',
      tag: 'latest',
      digest: undefined,
    });
  });

  it('should parse an image pinned by digest', () => {
    const { repository, tag, digest } = parseImageReference('gladysassistant/gladys@sha256:abcdef');
    expect(repository).to.equal('gladysassistant/gladys');
    expect(tag).to.equal('latest');
    expect(digest).to.equal('sha256:abcdef');
  });

  it('should parse a raw image id', () => {
    expect(parseImageReference('sha256:92e700688a85')).to.deep.equal({
      repository: null,
      tag: null,
      digest: '92e700688a85',
    });
  });
});
