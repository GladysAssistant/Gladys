const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake, stub } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID, EWELINK_APP_ID, EWELINK_APP_SECRET, EWELINK_APP_REGION } = require('../constants');
const { BadParameters } = require('../../../../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

describe('eWeLinkHandler saveConfiguration', () => {
  let eWeLinkHandler;
  let eWeLinkApiMock;
  let gladys;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
      variable: {
        setValue: stub().resolves(null),
        destroy: stub().resolves(null),
      },
    };

    eWeLinkApiMock = {
      WebAPI: stub(),
    };
    eWeLinkHandler = new EwelinkHandler(gladys, eWeLinkApiMock, SERVICE_ID);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should throw a BadParameter error as no variable is passed', async () => {
    try {
      await eWeLinkHandler.saveConfiguration({});
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
      expect(e.message).is.eq('eWeLink: all application ID/Secret/Region are required');
    }

    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.variable.destroy);

    expect(eWeLinkHandler.ewelinkWebAPIClient).eq(null);
  });

  it('should throw a BadParameter error as SECRET and REGION variables are mossing', async () => {
    try {
      await eWeLinkHandler.saveConfiguration({ applicationId: EWELINK_APP_ID });
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
      expect(e.message).is.eq('eWeLink: all application ID/Secret/Region are required');
    }

    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.variable.destroy);

    expect(eWeLinkHandler.ewelinkWebAPIClient).eq(null);
  });

  it('should throw a BadParameter error as REGION variables is missing', async () => {
    try {
      await eWeLinkHandler.saveConfiguration({ applicationId: EWELINK_APP_ID, applicationSecret: EWELINK_APP_SECRET });
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(BadParameters);
      expect(e.message).is.eq('eWeLink: all application ID/Secret/Region are required');
    }

    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.variable.destroy);

    expect(eWeLinkHandler.ewelinkWebAPIClient).eq(null);
  });

  it('should throw a error on database store failure', async () => {
    gladys.variable.setValue = fake.rejects('UNABLE TO STORE IN DB');
    try {
      await eWeLinkHandler.saveConfiguration({
        applicationId: EWELINK_APP_ID,
        applicationSecret: EWELINK_APP_SECRET,
        applicationRegion: EWELINK_APP_REGION,
      });
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(Error);
      expect(e.message).is.eq('UNABLE TO STORE IN DB');
    }

    assert.callCount(gladys.event.emit, 2);
    assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
      payload: { configured: false, connected: false },
    });

    assert.calledOnceWithExactly(gladys.variable.setValue, 'APPLICATION_ID', EWELINK_APP_ID, SERVICE_ID);
    assert.notCalled(gladys.variable.destroy);

    expect(eWeLinkHandler.ewelinkWebAPIClient).eq(null);
  });

  it('should save configuration and send events', async () => {
    await eWeLinkHandler.saveConfiguration({
      applicationId: EWELINK_APP_ID,
      applicationSecret: EWELINK_APP_SECRET,
      applicationRegion: EWELINK_APP_REGION,
    });

    assert.callCount(gladys.event.emit, 2);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
      payload: { configured: false, connected: false },
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EWELINK.STATUS,
      payload: { configured: true, connected: false },
    });

    assert.callCount(gladys.variable.setValue, 3);
    assert.calledWithExactly(gladys.variable.setValue, 'APPLICATION_ID', EWELINK_APP_ID, SERVICE_ID);
    assert.calledWithExactly(gladys.variable.setValue, 'APPLICATION_SECRET', EWELINK_APP_SECRET, SERVICE_ID);
    assert.calledWithExactly(gladys.variable.setValue, 'APPLICATION_REGION', EWELINK_APP_REGION, SERVICE_ID);
    assert.calledOnceWithExactly(gladys.variable.destroy, 'USER_TOKENS', SERVICE_ID);

    expect(eWeLinkHandler.ewelinkWebAPIClient).not.eq(null);
  });
});
