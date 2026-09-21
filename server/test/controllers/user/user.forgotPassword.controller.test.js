const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;

const UserController = require('../../../api/controllers/user.controller');

describe('user.controller forgotPassword', () => {
  let res;
  let gladys;
  const req = {
    body: {
      email: 'demo@demo.com',
      origin: 'http://localhost:1444',
    },
    headers: {
      'user-agent': 'test-agent',
    },
  };

  beforeEach(() => {
    res = {
      json: fake(),
    };
    gladys = {
      user: {
        forgotPassword: fake.resolves({
          method: 'link',
          link: 'http://localhost:1444/reset-password?token=reset-token',
          user: {
            selector: 'tony',
            language: 'en',
          },
        }),
        verifyForgotPasswordCode: fake.resolves({ access_token: 'reset-token' }),
      },
      brain: {
        getReply: fake.returns('Password reset instructions'),
      },
      message: {
        sendToUser: fake.resolves({}),
      },
    };
  });

  it('should send the reset link and return success', async () => {
    const controller = UserController(gladys);

    await controller.forgotPassword(req, res);

    sinonAssert.calledOnceWithExactly(
      gladys.user.forgotPassword,
      'demo@demo.com',
      'test-agent',
      'http://localhost:1444',
    );
    sinonAssert.calledOnceWithExactly(gladys.brain.getReply, 'en', 'user.forgot-password.success', {});
    sinonAssert.calledTwice(gladys.message.sendToUser);
    sinonAssert.calledWith(gladys.message.sendToUser.firstCall, 'tony', 'Password reset instructions');
    sinonAssert.calledWith(
      gladys.message.sendToUser.secondCall,
      'tony',
      'http://localhost:1444/reset-password?token=reset-token',
    );
    sinonAssert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({ success: true, method: 'link' });
  });

  it('should send the one-time code and return the method', async () => {
    gladys.user.forgotPassword = fake.resolves({
      method: 'code',
      code: 'ABCD-EFGH',
      user: {
        selector: 'tony',
        language: 'fr',
      },
    });
    const controller = UserController(gladys);

    await controller.forgotPassword(req, res);

    sinonAssert.calledOnceWithExactly(gladys.brain.getReply, 'fr', 'user.forgot-password.code', {});
    sinonAssert.calledTwice(gladys.message.sendToUser);
    sinonAssert.calledWith(gladys.message.sendToUser.firstCall, 'tony', 'Password reset instructions');
    sinonAssert.calledWith(gladys.message.sendToUser.secondCall, 'tony', 'ABCD-EFGH');
    expect(res.json.firstCall.args[0]).to.deep.equal({ success: true, method: 'code' });
  });

  it('should fall back to English when the brain has no answer in the language of the user', async () => {
    gladys.brain.getReply = fake((language) => {
      if (language !== 'en') {
        throw new Error('Answer not found');
      }
      return 'English instructions';
    });
    gladys.user.forgotPassword = fake.resolves({
      method: 'link',
      link: 'http://localhost:1444/reset-password?token=reset-token',
      user: { selector: 'tony', language: 'de' },
    });
    const controller = UserController(gladys);

    await controller.forgotPassword(req, res);

    sinonAssert.calledTwice(gladys.brain.getReply);
    sinonAssert.calledWith(gladys.brain.getReply.firstCall, 'de', 'user.forgot-password.success', {});
    sinonAssert.calledWith(gladys.brain.getReply.secondCall, 'en', 'user.forgot-password.success', {});
    sinonAssert.calledWith(gladys.message.sendToUser.firstCall, 'tony', 'English instructions');
    expect(res.json.firstCall.args[0]).to.deep.equal({ success: true, method: 'link' });
  });

  it('should still return success when sending forgot password message fails', async () => {
    gladys.message.sendToUser = fake.rejects(new Error('callmebot failed'));
    const controller = UserController(gladys);

    await controller.forgotPassword(req, res);

    sinonAssert.calledOnce(gladys.message.sendToUser);
    sinonAssert.calledOnce(res.json);
    expect(res.json.firstCall.args[0]).to.deep.equal({ success: true, method: 'link' });
  });

  it('should exchange the code for a reset token', async () => {
    const controller = UserController(gladys);
    const codeReq = {
      body: {
        email: 'demo@demo.com',
        code: 'ABCD-EFGH',
      },
      headers: {
        'user-agent': 'test-agent',
      },
    };

    await controller.verifyForgotPasswordCode(codeReq, res);

    sinonAssert.calledOnceWithExactly(gladys.user.verifyForgotPasswordCode, 'demo@demo.com', 'ABCD-EFGH', 'test-agent');
    expect(res.json.firstCall.args[0]).to.deep.equal({ access_token: 'reset-token' });
  });
});
