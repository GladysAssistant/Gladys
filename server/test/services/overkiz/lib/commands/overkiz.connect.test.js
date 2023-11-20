/* eslint-disable no-unused-expressions */
const sinon = require('sinon');
const chai = require('chai');

const { fake, assert } = sinon;
const { expect } = chai;

const { stub } = require('sinon');
const OverkizHandler = require('../../../../../services/overkiz/lib/index');
const { EVENTS } = require('../../../../../utils/constants');
const { ServiceNotConfiguredError, BadParameters } = require('../../../../../utils/coreErrors');

const OVERKIZ_SERVICE_ID = 'OVERKIZ_SERVICE_ID';

describe('Connect command', () => {
  let gladys;
  let overkizHandler;

  beforeEach(async () => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    overkizHandler = new OverkizHandler(gladys, OVERKIZ_SERVICE_ID);
    overkizHandler.syncOverkizDevices = fake.returns(true);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should connect', async () => {
    const variable = {
      getValue: stub()
        .onFirstCall()
        .returns('atlantic_cozytouch')
        .onSecondCall()
        .returns('OVERKIZ_SERVER_USERNAME')
        .onThirdCall()
        .returns('OVERKIZ_SERVER_PASSWORD'),
    };
    overkizHandler.gladys.variable = variable;
    await overkizHandler.connect();
    expect(overkizHandler.connected).to.be.true;
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      payload: {},
      type: 'overkiz.connected',
    });
    assert.calledOnce(overkizHandler.syncOverkizDevices);
  });

  it('should not connect missing OVERKIZ_TYPE', async () => {
    const variable = {
      getValue: stub()
        .onFirstCall()
        .returns(null),
    };
    overkizHandler.gladys.variable = variable;
    try {
      await overkizHandler.connect();
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceof(ServiceNotConfiguredError);
      expect(e.message).to.be.equal('OVERKIZ_TYPE');
    }
    expect(overkizHandler.connected).to.be.false;
  });

  it('should not connect default OVERKIZ_TYPE', async () => {
    const variable = {
      getValue: stub()
        .onFirstCall()
        .returns('default')
        .onSecondCall()
        .returns('guest')
        .onThirdCall()
        .returns('guest'),
    };
    overkizHandler.gladys.variable = variable;
    try {
      await overkizHandler.connect();
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceof(BadParameters);
      expect(e.message).to.be.equal('OVERKIZ_TYPE');
    }
    expect(overkizHandler.connected).to.be.false;
  });

  it('should not connect missing OVERKIZ_SERVER_USERNAME', async () => {
    const variable = {
      getValue: stub()
        .onFirstCall()
        .returns('atlantic_cozytouch')
        .onSecondCall()
        .returns(null),
    };
    overkizHandler.gladys.variable = variable;
    try {
      await overkizHandler.connect();
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceof(ServiceNotConfiguredError);
      expect(e.message).to.be.equal('OVERKIZ_SERVER_USERNAME');
    }
    expect(overkizHandler.connected).to.be.false;
  });

  it('should not connect missing OVERKIZ_SERVER_PASSWORD', async () => {
    const variable = {
      getValue: stub()
        .onFirstCall()
        .returns('atlantic_cozytouch')
        .onSecondCall()
        .returns('OVERKIZ_SERVER_USERNAME')
        .onThirdCall()
        .returns(null),
    };
    overkizHandler.gladys.variable = variable;
    try {
      await overkizHandler.connect();
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceof(ServiceNotConfiguredError);
      expect(e.message).to.be.equal('OVERKIZ_SERVER_PASSWORD');
    }
    expect(overkizHandler.connected).to.be.false;
  });
});
