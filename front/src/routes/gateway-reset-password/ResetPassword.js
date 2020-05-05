import { Text, MarkupText, Localizer } from 'preact-i18n';
import ResetPasswordForm from './ResetPasswordForm.js';

const ResetPassword = ({ children, ...props }) => (
  <div className="page">
    <div className="page-single" style={{ marginTop: '40px' }}>
      <div className="container">
        <div className="row">
          <div className="col col-login mx-auto">
            <div className="text-center mb-6">
              <h2>
                <Localizer>
                  <img
                    src="/assets/icons/favicon-96x96.png"
                    class="header-brand-img"
                    alt={<Text id="global.logoAlt" />}
                  />
                </Localizer>
                <Text id="gatewayResetPassword.pageTitle" />
              </h2>
            </div>

            {!props.success && (
              <ResetPasswordForm
                passwordError={props.passwordError}
                passwordNotMatching={props.passwordNotMatching}
                twoFactorEnabled={props.twoFactorEnabled}
                twoFactorCode={props.twoFactorCode}
                updateTwoFactorCode={props.updateTwoFactorCode}
                password={props.password}
                updatePassword={props.updatePassword}
                resetPassword={props.resetPassword}
                passwordRepeat={props.passwordRepeat}
                updatePasswordRepeat={props.updatePasswordRepeat}
                success={props.success}
                errorLink={props.errorLink}
                resetInProgress={props.resetInProgress}
              />
            )}

            {props.success && (
              <div class="card">
                <div class="card-body">
                  <p>
                    <MarkupText id="resetPassword.resetSuccess" />
                  </p>
                </div>
              </div>
            )}

            <div className="text-center text-muted">
              <MarkupText id="resetPassword.alreadyHaveAccount" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ResetPassword;
