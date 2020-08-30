import { Text, Localizer } from 'preact-i18n';

const ForgotPassword = ({ children, ...props }) => (
  <div class="page">
    <div class="page-single" style={{ marginTop: '40px' }}>
      <div class="container">
        <div class="row">
          <div class="col col-login mx-auto">
            <div class="text-center mb-6">
              <h2>
                <Localizer>
                  <img
                    src="/assets/icons/favicon-96x96.png"
                    class="header-brand-img"
                    alt={<Text id="global.logoAlt" />}
                  />
                </Localizer>
                <Text id="gatewayForgotPassword.pageTitle" />
              </h2>
            </div>

            <form onSubmit={props.sendResetPasswordLink} class="card">
              <div class="card-body p-6">
                <div class="card-title">
                  <Text id="gatewayForgotPassword.formTitle" />
                </div>
                {props.success && (
                  <div class="alert alert-success" role="alert">
                    <Text id="gatewayForgotPassword.success" />
                  </div>
                )}
                {!props.success && (
                  <div>
                    <div class="form-group">
                      <label class="form-label">
                        <Text id="gatewayForgotPassword.emailAddress" />
                      </label>
                      <Localizer>
                        <input
                          type="email"
                          class="form-control"
                          id="exampleInputEmail1"
                          aria-describedby="emailHelp"
                          placeholder={<Text id="gatewayForgotPassword.emailAddressPlaceholder" />}
                          value={props.email}
                          onInput={props.updateEmail}
                        />
                      </Localizer>
                    </div>
                    <div class="form-footer">
                      <button type="submit" class="btn btn-primary btn-block" disabled={props.forgotInProgress}>
                        <Text id="gatewayForgotPassword.sendEmailButton" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
            <div class="text-center text-muted">
              <Text id="gatewayForgotPassword.dontHaveAccount" />{' '}
              <a href="https://gladysassistant.com">
                <Text id="gatewayForgotPassword.signupLink" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ForgotPassword;
