const { expect } = require('chai');
const MockExpressRequest = require('mock-express-request');

const AuthenticatedOrNotConfiguredMiddleware = require('../../api/middlewares/authenticatedOrNotConfigured');
const { Error401, Error403 } = require('../../utils/httpErrors');

describe('authenticatedOrNotConfiguredMiddleware', () => {
  it('should allow access without authentication when no user exists', (done) => {
    const gladys = {
      user: {
        getUserCount: () => 0,
      },
    };
    const middleware = AuthenticatedOrNotConfiguredMiddleware('dashboard:write', gladys);
    const req = new MockExpressRequest({
      headers: {},
    });
    middleware(req, {}, (error) => {
      if (error) {
        done(error);
      } else {
        done();
      }
    });
  });
  it('should allow access to an authenticated admin when the instance is configured', (done) => {
    const gladys = {
      user: {
        getUserCount: () => 1,
        getById: () => Promise.resolve({ id: 'user-id', role: 'admin' }),
      },
      session: {
        validateAccessToken: () => ({ user_id: 'user-id', session_id: 'session-id' }),
      },
    };
    const middleware = AuthenticatedOrNotConfiguredMiddleware('dashboard:write', gladys);
    const req = new MockExpressRequest({
      headers: {
        authorization: 'Bearer access-token',
      },
    });
    middleware(req, {}, (error) => {
      if (error) {
        done(error);
        return;
      }
      expect(req).to.have.property('user');
      // @ts-ignore
      expect(req.user).to.deep.equal({ id: 'user-id', role: 'admin' });
      done();
    });
  });
  it('should refuse access without authentication when the instance is configured', (done) => {
    const gladys = {
      user: {
        getUserCount: () => 1,
      },
    };
    const middleware = AuthenticatedOrNotConfiguredMiddleware('dashboard:write', gladys);
    const req = new MockExpressRequest({
      headers: {},
    });
    middleware(req, {}, (error) => {
      if (!error) {
        done('should have thrown an error');
      } else {
        expect(error).to.be.instanceOf(Error401);
        done();
      }
    });
  });
  it('should refuse access to a non-admin user when the instance is configured', (done) => {
    const gladys = {
      user: {
        getUserCount: () => 1,
        getById: () => Promise.resolve({ id: 'user-id', role: 'habitant' }),
      },
      session: {
        validateAccessToken: () => ({ user_id: 'user-id', session_id: 'session-id' }),
      },
    };
    const middleware = AuthenticatedOrNotConfiguredMiddleware('dashboard:write', gladys);
    const req = new MockExpressRequest({
      headers: {
        authorization: 'Bearer access-token',
      },
    });
    middleware(req, {}, (error) => {
      if (!error) {
        done('should have thrown an error');
      } else {
        expect(error).to.be.instanceOf(Error403);
        done();
      }
    });
  });
});
