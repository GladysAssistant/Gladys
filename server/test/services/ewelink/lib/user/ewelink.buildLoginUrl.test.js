const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert, match } = sinon;

const EwelinkHandler = require('../../../../../services/ewelink/lib');
const { SERVICE_ID } = require('../constants');

describe('eWeLinkHandler buildLoginUrl', () => {
  let eWeLinkHandler;

  beforeEach(() => {
    eWeLinkHandler = new EwelinkHandler({}, null, SERVICE_ID);
    eWeLinkHandler.ewelinkClient = {
      oauth: {
        createLoginUrl: fake.returns('LOGIN_URL'),
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should returns login URL and override loginState variable', () => {
    eWeLinkHandler.loginState = 'any_state';

    const redirectUrl = 'http://localhost:1440/redirectUrl';
    const loginUrl = eWeLinkHandler.buildLoginUrl({ redirectUrl });

    assert.calledOnce(eWeLinkHandler.ewelinkClient.oauth.createLoginUrl);
    assert.calledWithMatch(
      eWeLinkHandler.ewelinkClient.oauth.createLoginUrl,
      match({
        redirectUrl,
        grantType: 'authorization_code',
      }),
    );

    expect(eWeLinkHandler.loginState).not.eq('any_state');
    expect(loginUrl).eq('LOGIN_URL');
  });
});
