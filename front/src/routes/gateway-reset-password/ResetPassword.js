import { MarkupText } from 'preact-i18n';
import ResetPasswordForm from './ResetPasswordForm.js';
import AuthLayout from '../../components/auth/AuthLayout';

const ResetPassword = ({ children, ...props }) => (
  <AuthLayout titleId="gatewayResetPassword.pageTitle">
    {!props.success && (
      <ResetPasswordForm
        passwordError={props.passwordError}
        passwordNotMatching={props.passwordNotMatching}
        twoFactorEnabled={props.twoFactorEnabled}
        twoFactorCode={props.twoFactorCode}
        updateTwoFactorCode={props.updateTwoFactorCode}
        useRecoveryCode={props.useRecoveryCode}
        twoFactorRecoveryCode={props.twoFactorRecoveryCode}
        updateTwoFactorRecoveryCode={props.updateTwoFactorRecoveryCode}
        showRecoveryCode={props.showRecoveryCode}
        showTwoFactorCode={props.showTwoFactorCode}
        password={props.password}
        updatePassword={props.updatePassword}
        resetPassword={props.resetPassword}
        passwordRepeat={props.passwordRepeat}
        updatePasswordRepeat={props.updatePasswordRepeat}
        success={props.success}
        errorLink={props.errorLink}
        invalidRecoveryCode={props.invalidRecoveryCode}
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
  </AuthLayout>
);

export default ResetPassword;
