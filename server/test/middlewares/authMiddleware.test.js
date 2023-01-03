const { expect } = require('chai');
const MockExpressRequest = require('mock-express-request');

const AuthMiddleware = require('../../api/middlewares/authMiddleware');
const { Error401 } = require('../../utils/httpErrors');

const gladys = {
  user: {
    getById: () => Promise.resolve({ firstname: 'tony' }),
  },
};

describe('authMiddleware', () => {
  it('should allow api access', async () => {
    const gladysWithSession = {
      ...gladys,
      session: {
        validateApiKey: () => Promise.resolve('id'),
      },
    };
    const authMiddleware = AuthMiddleware('dashboard:read', gladysWithSession);
    const req = new MockExpressRequest({
      headers: {
        authorization: 'api-key',
      },
    });
    authMiddleware(req, {}, () => {
      expect(req).to.have.property('user');
      // @ts-ignore
      expect(req.user).to.deep.equal({
        firstname: 'tony',
      });
    });
  });
  it('should refuse api key access and throw error', (done) => {
    const gladysWithSession = {
      ...gladys,
      session: {
        validateApiKey: () => {
          throw new Error401('Api key not found');
        },
      },
    };
    const authMiddleware = AuthMiddleware('dashboard:read', gladysWithSession);
    const req = new MockExpressRequest({
      headers: {
        authorization: 'api-key',
      },
    });
    authMiddleware(req, {}, (error) => {
      if (!error) {
        done('should have thrown an error');
      } else {
        expect(error).to.be.instanceOf(Error401);
        done();
      }
    });
  });
  it('should throw error, no header found', (done) => {
    const gladysWithSession = {
      ...gladys,
      session: {
        validateApiKey: () => {
          throw new Error401('Api key not found');
        },
      },
    };
    const authMiddleware = AuthMiddleware('dashboard:read', gladysWithSession);
    const req = new MockExpressRequest();
    authMiddleware(req, {}, (error) => {
      if (!error) {
        done('should have thrown an error');
      } else {
        expect(error).to.be.instanceOf(Error401);
        done();
      }
    });
  });
});
