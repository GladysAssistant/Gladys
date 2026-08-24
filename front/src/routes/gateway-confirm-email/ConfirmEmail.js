import { Text, MarkupText } from 'preact-i18n';
import AuthLayout from '../../components/auth/AuthLayout';

const ConfirmEmail = ({ children, ...props }) => (
  <AuthLayout titleId="forgotPassword.title">
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
  </AuthLayout>
);

export default ConfirmEmail;
