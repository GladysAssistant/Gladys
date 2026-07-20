const { expect } = require('chai');
const { fake, assert: sinonAssert } = require('sinon');

const UserController = require('../../../api/controllers/user.controller');

describe('user.controller forgotPassword', () => {
  let res;
  let gladys;

  beforeEach(() => {
    res = {
      json: fake(),
    };
    gladys = {
      user: {
        forgotPassword: fake.resolves({
          session: { access_token: 'reset-token' },
          user: {
            selector: 'tony',
            language: 'en',
          },
        }),
      },
      brain: {
        getReply: fake.returns('Password reset instructions'),
      },
      message: {
        sendToUser: fake.resolves({}),
      },
    };
  });

  it('should send forgot password messages and return success', async () => {
    const controller = UserController(gladys);
    const req = {
      body: {
        email: 'demo@demo.com',
        origin: 'http://localhost:1444',
      },
      headers: {
        'user-agent': 'test-agent',
      },
    };

    await controller.forgotPassword(req, res);

    sinonAssert.calledOnce(gladys.user.forgotPassword);
    sinonAssert.calledTwice(gladys.message.sendToUser);
    sinonAssert.calledWith(gladys.message.sendToUser.firstCall, 'tony', 'Password reset instructions');
    sinonAssert.calledWith(
      gladys.message.sendToUser.secondCall,
      'tony',
      'http://localhost:1444/reset-password?token=reset-token',
    );
    sinonAssert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({ success: true });
  });

  it('should still return success when sending forgot password message fails', async () => {
    gladys.message.sendToUser = fake.rejects(new Error('callmebot failed'));
    const controller = UserController(gladys);
    const req = {
      body: {
        email: 'demo@demo.com',
        origin: 'http://localhost:1444',
      },
      headers: {
        'user-agent': 'test-agent',
      },
    };

    await controller.forgotPassword(req, res);

    sinonAssert.calledOnce(gladys.message.sendToUser);
    sinonAssert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({ success: true });
  });
});
