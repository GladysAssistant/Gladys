const { expect } = require('chai');

const { addPullEvent, getPullProgress } = require('../../../../services/zigbee2mqtt/utils/getPullProgress');

const follow = (events) => events.reduce((layers, event) => addPullEvent(layers, event), {});

describe('zigbee2mqtt getPullProgress', () => {
  it('should be at 0 before any layer', () => {
    expect(getPullProgress({})).to.equal(0);
    // Events about the image itself, and a layer already on disk
    const layers = follow([
      { status: 'Pulling from koenkk/zigbee2mqtt', id: '2.14.2' },
      { status: 'Already exists', progressDetail: {}, id: 'aaa' },
      { status: 'Digest: sha256:0123' },
      null,
    ]);
    expect(layers).to.deep.equal({});
    expect(getPullProgress(layers)).to.equal(0);
  });

  it('should count the download for half of a layer, and its extraction for the other half', () => {
    let layers = follow([{ status: 'Pulling fs layer', progressDetail: {}, id: 'aaa' }]);
    expect(getPullProgress(layers)).to.equal(0);
    layers = addPullEvent(layers, { status: 'Downloading', progressDetail: { current: 50, total: 100 }, id: 'aaa' });
    expect(getPullProgress(layers)).to.equal(25);
    layers = addPullEvent(layers, { status: 'Verifying Checksum', progressDetail: {}, id: 'aaa' });
    expect(getPullProgress(layers)).to.equal(50);
    layers = addPullEvent(layers, { status: 'Download complete', progressDetail: {}, id: 'aaa' });
    expect(getPullProgress(layers)).to.equal(50);
    // The size is kept from the download
    expect(layers.aaa.total).to.equal(100);
    layers = addPullEvent(layers, { status: 'Extracting', progressDetail: { current: 50, total: 100 }, id: 'aaa' });
    expect(getPullProgress(layers)).to.equal(75);
    layers = addPullEvent(layers, { status: 'Pull complete', progressDetail: {}, id: 'aaa' });
    expect(getPullProgress(layers)).to.equal(100);
  });

  it('should count each layer for its size', () => {
    const layers = follow([
      { status: 'Pulling fs layer', progressDetail: {}, id: 'small' },
      { status: 'Pulling fs layer', progressDetail: {}, id: 'large' },
      { status: 'Downloading', progressDetail: { current: 10, total: 10 }, id: 'small' },
      { status: 'Pull complete', progressDetail: {}, id: 'small' },
      { status: 'Downloading', progressDetail: { current: 0, total: 90 }, id: 'large' },
    ]);
    expect(getPullProgress(layers)).to.equal(10);
  });

  it('should count a layer waiting for its download for the average size of the others', () => {
    const layers = follow([
      { status: 'Waiting', progressDetail: {}, id: 'waiting' },
      { status: 'Downloading', progressDetail: { current: 100, total: 100 }, id: 'downloading' },
    ]);
    // Half of the layer downloaded, against two layers of 100 bytes
    expect(getPullProgress(layers)).to.equal(25);
  });

  it('should count layers of unknown size equally', () => {
    const layers = follow([
      { status: 'Pulling fs layer', progressDetail: {}, id: 'aaa' },
      { status: 'Pull complete', progressDetail: {}, id: 'bbb' },
    ]);
    expect(getPullProgress(layers)).to.equal(50);
  });

  it('should not go beyond the end of a status', () => {
    const layers = follow([{ status: 'Downloading', progressDetail: { current: 120, total: 100 }, id: 'aaa' }]);
    expect(getPullProgress(layers)).to.equal(50);
  });

  it('should give back the same layers for an event that tells nothing new', () => {
    const layers = follow([{ status: 'Downloading', progressDetail: { current: 50, total: 100 }, id: 'aaa' }]);
    // The position of a layer repeated, without its size, which is known already
    expect(addPullEvent(layers, { status: 'Downloading', progressDetail: { current: 50 }, id: 'aaa' })).to.equal(
      layers,
    );
    expect(addPullEvent(layers, { status: 'Downloading', progressDetail: { current: 51 }, id: 'aaa' })).not.to.equal(
      layers,
    );
    expect(addPullEvent(layers, { status: 'Download complete', progressDetail: {}, id: 'aaa' })).not.to.equal(layers);
    expect(addPullEvent(layers, { status: 'Waiting', progressDetail: {}, id: 'bbb' })).not.to.equal(layers);
  });

  it('should not change the layers given', () => {
    const layers = follow([{ status: 'Pulling fs layer', progressDetail: {}, id: 'aaa' }]);
    const nextLayers = addPullEvent(layers, { status: 'Pull complete', id: 'aaa' });
    expect(layers.aaa.status).to.equal('Pulling fs layer');
    expect(nextLayers.aaa.status).to.equal('Pull complete');
  });
});
