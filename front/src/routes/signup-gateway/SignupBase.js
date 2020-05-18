import { Text, Localizer } from 'preact-i18n';

const SignupBase = ({ children, ...props }) => (
  <div className="page">
    <div className="page-single" style={{ marginTop: '40px' }}>
      <div className="container">
        <div className="row">
          <div className="col col-login mx-auto">
            <div className="text-center mb-6">
              <h2 className="h-6">
                <Localizer>
                  <img
                    src="/assets/icons/favicon-96x96.png"
                    class="header-brand-img"
                    alt={<Text id="global.logoAlt" />}
                  />
                </Localizer>
                <Text id="gatewaySignup.title" />
              </h2>
            </div>
            {children}

            {props.currentStep === 1 && (
              <div className="text-center text-muted">
                <Text id="gatewaySignup.alreadyHaveAccount" />{' '}
                <a href="/login">
                  <Text id="gatewaySignup.signin" />
                </a>
                <br />
                <Text id="gatewaySignup.supportText" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SignupBase;
