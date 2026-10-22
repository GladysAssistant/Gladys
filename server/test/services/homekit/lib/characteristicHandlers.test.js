const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const { handleRequest, readFeatureValue } = require('../../../../services/homekit/lib/characteristicHandlers');

describe('HomeKit characteristic handlers', () => {
  afterEach(() => sinon.restore());

  it('should preserve a successful synchronous read, including a zero value', async () => {
    const callback = sinon.stub();
    await handleRequest((respond) => respond(undefined, 0))(callback);
    expect(callback.calledOnceWithExactly(undefined, 0)).to.equal(true);
  });

  it('should report synchronous exceptions through the callback', async () => {
    const callback = sinon.stub();
    const failure = new Error('read failed');
    await handleRequest(() => {
      throw failure;
    })(callback);
    expect(callback.calledOnceWithExactly(failure)).to.equal(true);
  });

  it('should report rejected promises through the callback', async () => {
    const callback = sinon.stub();
    const failure = new Error('async read failed');
    await handleRequest(sinon.stub().rejects(failure))(callback);
    expect(callback.calledOnceWithExactly(failure)).to.equal(true);
  });

  it('should preserve SET arguments and its callback position', async () => {
    const callback = sinon.stub();
    const context = { source: 'homekit' };
    const handler = sinon.stub().callsFake((value, respond, receivedContext) => {
      expect(value).to.equal(23);
      expect(receivedContext).to.equal(context);
      respond();
    });
    await handleRequest(handler, 1)(23, callback, context);
    expect(callback.calledOnceWithExactly()).to.equal(true);
  });

  it('should report a failed SET through its callback', async () => {
    const callback = sinon.stub();
    const failure = new Error('write failed');
    await handleRequest(sinon.stub().rejects(failure), 1)(23, callback);
    expect(callback.calledOnceWithExactly(failure)).to.equal(true);
  });

  it('should answer only once when a handler calls back twice', async () => {
    const callback = sinon.stub();
    await handleRequest((respond) => {
      respond(undefined, 21);
      respond(undefined, 22);
    })(callback);
    expect(callback.calledOnceWithExactly(undefined, 21)).to.equal(true);
  });

  it('should not answer again when a handler fails after calling back', async () => {
    const callback = sinon.stub();
    await handleRequest(async (respond) => {
      respond(undefined, 21);
      throw new Error('failure after responding');
    })(callback);
    expect(callback.calledOnceWithExactly(undefined, 21)).to.equal(true);
  });

  it('should read the latest feature value without substituting zero or null', () => {
    const feature = { selector: 'radiator-setpoint' };
    const stateManager = { get: sinon.stub().returns({ last_value: 0 }) };
    expect(readFeatureValue(stateManager, feature)).to.equal(0);
    expect(stateManager.get.calledWithExactly('deviceFeature', feature.selector)).to.equal(true);
    stateManager.get.returns({ last_value: null });
    expect(readFeatureValue(stateManager, feature)).to.equal(null);
    stateManager.get.returns({ last_value: 23 });
    expect(readFeatureValue(stateManager, feature)).to.equal(23);
  });

  it('should identify an absent feature by selector and name', () => {
    const feature = { selector: 'radiator-setpoint', name: 'Setpoint' };
    const stateManager = { get: sinon.stub().returns(null) };
    expect(() => readFeatureValue(stateManager, feature)).to.throw(
      'HomeKit: device feature "radiator-setpoint" (Setpoint) is missing from memory',
    );
  });
});
