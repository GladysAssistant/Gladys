const sinon = require('sinon').createSandbox();
const { expect, assert: chaiAssert } = require('chai');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');
const { NotFoundError } = require('../../../../utils/coreErrors');

describe('Matter.shareNode', () => {
  let matterHandler;
  let node;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date('2026-11-24T10:00:00.000Z'));
    matterHandler = new MatterHandler({ job: { wrapper: fake.returns(null) } }, {}, {}, 'service-1');
    node = {
      isConnected: true,
      openEnhancedCommissioningWindow: fake.resolves({
        manualPairingCode: '34970112332',
        qrPairingCode: 'MT:Y.K90AFN00KA0648G00',
      }),
    };
    matterHandler.nodesMap.set(1234n, node);
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should open a commissioning window and give its codes', async () => {
    const result = await matterHandler.shareNode(1234n);
    assert.calledOnceWithExactly(node.openEnhancedCommissioningWindow, 900);
    expect(result).to.deep.equal({
      manual_pairing_code: '34970112332',
      qr_pairing_code: 'MT:Y.K90AFN00KA0648G00',
      expires_at: '2026-11-24T10:15:00.000Z',
      duration_seconds: 900,
    });
  });

  it('should refuse an unknown node', async () => {
    await chaiAssert.isRejected(matterHandler.shareNode(5n), NotFoundError);
  });

  it('should tell when the node is unreachable', async () => {
    node.isConnected = false;
    node.connect = fake.throws(new Error('offline'));
    node.events = { stateChanged: { on: fake(), off: fake() } };
    await chaiAssert.isRejected(matterHandler.shareNode(1234n), 'Matter: Node 1234 is unreachable');
    assert.notCalled(node.openEnhancedCommissioningWindow);
  });
});
