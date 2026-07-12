const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

describe('mdns', () => {
  let publish;
  let unpublishAll;
  let destroy;
  let mdns;

  beforeEach(() => {
    publish = fake.returns({ on: fake.returns(null) });
    unpublishAll = fake.yields();
    destroy = fake.returns(null);
    class Bonjour {
      constructor() {
        this.publish = publish;
        this.unpublishAll = unpublishAll;
        this.destroy = destroy;
      }
    }
    mdns = proxyquire('../../../lib/mdns', {
      'bonjour-service': { Bonjour },
    });
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should advertise Gladys as gladysassistant.local', () => {
    const instance = mdns.advertise(1443);
    expect(instance).to.not.equal(null);
    assert.calledOnceWithExactly(publish, {
      name: 'Gladys Assistant',
      host: 'gladysassistant.local',
      type: 'http',
      port: 1443,
      probe: false,
    });
  });

  it('should stop advertising with mDNS goodbye packets', async () => {
    mdns.advertise(1443);
    await mdns.stop();
    assert.calledOnce(unpublishAll);
    assert.calledOnce(destroy);
  });

  it('should do nothing on stop when advertise was not called', async () => {
    await mdns.stop();
    assert.notCalled(unpublishAll);
    assert.notCalled(destroy);
  });
});
