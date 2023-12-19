const { expect } = require('chai');
const sinon = require('sinon');
const EventEmitter = require('events');
const { getAccessToken, getRefreshToken } = require('../../../../services/netatmo/lib/netatmo.getTokens');
const { getConfiguration } = require('../../../../services/netatmo/lib/netatmo.getConfiguration');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const netatmoStatus = require('../../../../services/netatmo/lib/netatmo.status');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { GLADYS_VARIABLES } = require('../../../../services/netatmo/lib/utils/netatmo.constants');
const { EVENTS } = require('../../../../utils/constants');

describe('Netatmo Data Retrieval', () => {
  let eventEmitter;
  beforeEach(() => {
    sinon.restore();
    eventEmitter = new EventEmitter();
    NetatmoHandlerMock.saveStatus = sinon.stub().callsFake(netatmoStatus.saveStatus);
    NetatmoHandlerMock.status = 'not_initialized';
    NetatmoHandlerMock.gladys = {
      event: eventEmitter,
      variable: {
        getValue: sinon.stub().callsFake((variableName, serviceId) => {
          if (variableName === 'NETATMO_CLIENT_ID') {
            return 'valid_client_id';
          }
          if (variableName === 'NETATMO_CLIENT_SECRET') {
            return 'valid_client_secret';
          }
          if (variableName === 'NETATMO_ACCESS_TOKEN') {
            return 'valid_access_token';
          }
          if (variableName === 'NETATMO_REFRESH_TOKEN') {
            return 'valid_refresh_token';
          }
          if (variableName === 'NETATMO_EXPIRE_IN_TOKEN') {
            return 10800;
          }
          return null;
        }),
      },
    };
    sinon.spy(NetatmoHandlerMock.gladys.event, 'emit');
  });
  afterEach(() => {
    sinon.restore();
  });

  describe('getAccessToken', () => {
    it('should load the access token if available', async () => {
      const accessToken = await getAccessToken(NetatmoHandlerMock);
      expect(accessToken).to.equal('valid_access_token');
    });

    it('should return undefined and disconnect if no access token is available', async () => {
      NetatmoHandlerMock.gladys.variable.getValue
        .withArgs(GLADYS_VARIABLES.ACCESS_TOKEN, sinon.match.any)
        .returns(undefined);

      const accessToken = await getAccessToken(NetatmoHandlerMock);
      expect(accessToken).to.equal(undefined);
      sinon.assert.calledWith(NetatmoHandlerMock.saveStatus, sinon.match.has('status', 'disconnected'));
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'disconnected' },
        }),
      ).to.equal(true);
    });

    it('should throw an error if not configured', async () => {
      NetatmoHandlerMock.gladys.variable.getValue
        .withArgs(GLADYS_VARIABLES.ACCESS_TOKEN, sinon.match.any)
        .throws(new Error('Test error'));
      try {
        await getAccessToken(NetatmoHandlerMock);
        expect.fail('should have thrown an error');
      } catch (e) {
        expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
        expect(
          NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
            type: 'netatmo.status',
            payload: { status: 'not_initialized' },
          }),
        ).to.equal(true);
        expect(e).to.be.instanceOf(ServiceNotConfiguredError);
        expect(e.message).to.equal('Netatmo is not configured.');
      }
    });
  });

  describe('getRefreshToken', () => {
    it('should load the refresh token if available', async () => {
      const refreshToken = await getRefreshToken(NetatmoHandlerMock);
      expect(refreshToken).to.equal('valid_refresh_token');
      expect(NetatmoHandlerMock.refreshToken).to.equal('valid_refresh_token');
      expect(NetatmoHandlerMock.expireInToken).to.equal(10800);
    });

    it('should return undefined and disconnect if no refresh token is available', async () => {
      NetatmoHandlerMock.gladys.variable.getValue
        .withArgs(GLADYS_VARIABLES.REFRESH_TOKEN, sinon.match.any)
        .returns(undefined);

      const refreshToken = await getRefreshToken(NetatmoHandlerMock);
      expect(refreshToken).to.equal(undefined);
      sinon.assert.calledWith(NetatmoHandlerMock.saveStatus, sinon.match.has('status', 'disconnected'));
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'disconnected' },
        }),
      ).to.equal(true);
    });

    it('should throw an error if not configured', async () => {
      NetatmoHandlerMock.gladys.variable.getValue
        .withArgs(GLADYS_VARIABLES.EXPIRE_IN_TOKEN, sinon.match.any)
        .throws(new Error('Test error'));
      try {
        await getRefreshToken(NetatmoHandlerMock);
        expect.fail('should have thrown an error');
      } catch (e) {
        expect(NetatmoHandlerMock.refreshToken).to.equal('valid_refresh_token');
        expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
        expect(
          NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
            type: 'netatmo.status',
            payload: { status: 'not_initialized' },
          }),
        ).to.equal(true);
        expect(e).to.be.instanceOf(ServiceNotConfiguredError);
        expect(e.message).to.equal('Netatmo is not configured.');
      }
    });
  });

  describe('getConfiguration', () => {
    it('should load the configuration if available', async () => {
      const configuration = await getConfiguration(NetatmoHandlerMock);
      expect(configuration.clientId).to.equal('valid_client_id');
      expect(configuration.clientSecret).to.equal('valid_client_secret');
    });

    it('should throw an error if not configured', async () => {
      NetatmoHandlerMock.gladys.variable.getValue
        .withArgs(GLADYS_VARIABLES.CLIENT_SECRET, sinon.match.any)
        .throws(new Error('Test error'));
      try {
        await getConfiguration(NetatmoHandlerMock);
        expect.fail('should have thrown an error');
      } catch (e) {
        expect(NetatmoHandlerMock.configuration.clientId).to.equal('valid_client_id');
        expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
        expect(
          NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
            type: 'netatmo.status',
            payload: { status: 'not_initialized' },
          }),
        ).to.equal(true);
        expect(e).to.be.instanceOf(ServiceNotConfiguredError);
        expect(e.message).to.equal('Netatmo is not configured.');
      }
    });
  });
});
