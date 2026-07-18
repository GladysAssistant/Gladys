const sinon = require('sinon');
const { expect } = require('chai');

const MessageHandler = require('../../../../services/free-mobile/lib');
const logger = require('../../../../utils/logger');

const { assert, fake, stub } = sinon;

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const userId = 'd1d73559-a987-44eb-9453-3cbf5bcb5a2f';

describe('FreeMobile message.send', () => {
  let axiosStub;
  let gladys;
  let messageHandler;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    axiosStub = {
      get: fake.resolves({ data: 'OK' }),
    };
    gladys = {
      variable: {
        getValue: fake.resolves(null),
      },
    };
    messageHandler = new MessageHandler(gladys, axiosStub, serviceId);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should send SMS successfully for a user', async () => {
    gladys.variable.getValue = stub();
    gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId, userId).resolves('validUsername');
    gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId, userId).resolves('validAccessToken');

    await messageHandler.send(userId, { text: 'Hello' });

    assert.calledWith(axiosStub.get, 'https://smsapi.free-mobile.fr/sendmsg', {
      params: {
        user: 'validUsername',
        pass: 'validAccessToken',
        msg: 'Hello',
      },
      timeout: 10000,
    });
  });

  it('should not send SMS if the user has no configuration', async () => {
    gladys.variable.getValue = fake.resolves(null);
    await messageHandler.send(userId, { text: 'Hello' });
    assert.notCalled(axiosStub.get);
  });

  it('should throw and log a sanitized error if SMS fails', async () => {
    gladys.variable.getValue = stub();
    gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId, userId).resolves('validUsername');
    gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId, userId).resolves('validAccessToken');
    axiosStub.get = fake.rejects(new Error('Network error'));
    const loggerErrorStub = sandbox.stub(logger, 'error');

    try {
      await messageHandler.send(userId, { text: 'Hello World' });
      throw new Error('Expected an error to be thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.message).to.equal('Network error');
    }
    const errorArgs = loggerErrorStub.getCall(0).args;
    expect(errorArgs).to.have.lengthOf(1);
    expect(errorArgs[0]).to.equal('Error sending SMS: Network error');
  });

  it('should log the HTTP status without leaking the access token if SMS fails with a response', async () => {
    gladys.variable.getValue = stub();
    gladys.variable.getValue.withArgs('FREE_MOBILE_USERNAME', serviceId, userId).resolves('validUsername');
    gladys.variable.getValue.withArgs('FREE_MOBILE_ACCESS_TOKEN', serviceId, userId).resolves('validAccessToken');
    const httpError = new Error('Request failed with status code 400');
    // @ts-ignore
    httpError.response = { status: 400 };
    axiosStub.get = fake.rejects(httpError);
    const loggerErrorStub = sandbox.stub(logger, 'error');

    try {
      await messageHandler.send(userId, { text: 'Hello World' });
      throw new Error('Expected an error to be thrown');
    } catch (e) {
      expect(e.message).to.equal('Request failed with status code 400');
    }
    const errorArgs = loggerErrorStub.getCall(0).args;
    expect(errorArgs).to.have.lengthOf(1);
    expect(errorArgs[0]).to.equal('Error sending SMS: Request failed with status code 400 (HTTP 400)');
    expect(errorArgs[0]).to.not.include('validAccessToken');
  });
});
