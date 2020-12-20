import { Text, MarkupText, Localizer } from 'preact-i18n';

const ConfirmEmail = ({ children, ...props }) => (
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
                <Text id="forgotPassword.title" />
              </h2>
            </div>
            <div class="card">
              <div class="card-body p-6">
                {props.error && (
                  <div>
                    <div class="alert alert-danger" role="alert">
                      <Text id="forgotPassword.invalidEmail" />
                    </div>
                    <p>
                      <Text id="forgotPassword.validationLinkConfirmation" />
                    </p>
                    <p>
                      <MarkupText id="forgotPassword.contactUs" />
                    </p>
                  </div>
                )}

                {props.emailConfirmed && (
                  <div>
                    <div class="card-title">
                      <Text id="forgotPassword.emailConfirmed" />
                    </div>

                    <div class="form-footer">
                      <a href={`/login?email=${props.email}`} class="btn btn-primary btn-block">
                        <Text id="forgotPassword.signIn" />
                      </a>
                    </div>
                  </div>
                )}
                {!props.emailConfirmed && !props.error && (
                  <div>
                    <div class="card-title">
                      <Text id="forgotPassword.confirmationInProgress" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ConfirmEmail;
