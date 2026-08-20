import { Text, Localizer } from 'preact-i18n';
import AuthLayout from '../../components/auth/AuthLayout';

const ForgotPassword = ({ children, ...props }) => (
  <AuthLayout titleId="gatewayForgotPassword.pageTitle">
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
  </AuthLayout>
);

export default ForgotPassword;
