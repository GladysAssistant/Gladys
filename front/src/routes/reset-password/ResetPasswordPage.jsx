import { Text, MarkupText } from 'preact-i18n';
import get from 'get-value';
import { RequestStatus, ResetPasswordStatus } from '../../utils/consts';
import ResetPasswordForm from './ResetPasswordForm';
import ResetPasswordSuccess from './ResetPasswordSuccess';
import AuthLayout from '../../components/auth/AuthLayout';
import MobileAuthLayout from '../../components/auth/MobileAuthLayout';
import { MobileAuthTitle, MobileAuthForm, MobileAuthBar } from '../../components/auth/mobile';
import { withMobileViewport, MobilePasswordField, MobileNotice, BigButton, kitStyle } from '../../components/mobile';

const DesktopResetPasswordPage = ({ children, ...props }) => (
  <AuthLayout titleId="resetPassword.title">
    {props.resetPasswordStatus !== RequestStatus.Success ? (
      <ResetPasswordForm {...props} />
    ) : (
      <ResetPasswordSuccess {...props} />
    )}
  </AuthLayout>
);

// The refusals of the request: the link is dead, the user asks for another one
const REQUEST_ERRORS = {
  [RequestStatus.NetworkError]: 'httpErrors.networkError',
  [ResetPasswordStatus.ResetTokenNotFound]: 'resetPassword.resetTokenNotFound',
  [RequestStatus.Error]: 'httpErrors.unknownError',
  [RequestStatus.RateLimitError]: 'httpErrors.rateLimitError'
};

/**
 * @description Choosing a new password on a phone (docs/specs/mobile-pages/auth.md, C.3): the
 * two fields with their reveal button and their error next to them, then what the request
 * answered — the way to sign in, or the way to ask for another link.
 */
const MobileResetPasswordPage = props => {
  const success = props.resetPasswordStatus === RequestStatus.Success;
  const errorId = REQUEST_ERRORS[props.resetPasswordStatus];
  return (
    <MobileAuthLayout backHref="/login" backLabel={<Text id="login.mobile.navBack" />} dataCy="reset-password-mobile">
      <MobileAuthForm onSubmit={props.resetPassword}>
        <MobileAuthTitle>
          <Text id="resetPassword.cardTitle" />
        </MobileAuthTitle>
        {success && (
          <MobileNotice tone="success" icon="check-circle" role="status" data-cy="reset-password-success">
            <Text id="resetPassword.success" />
          </MobileNotice>
        )}
        {props.errored && (
          <MobileNotice tone="danger" icon="alert-circle" role="alert" data-cy="reset-password-error">
            <Text id={errorId} />
          </MobileNotice>
        )}
        {!success && !props.errored && (
          <MobilePasswordField
            id="reset-password"
            label={<Text id="resetPassword.passwordLabel" />}
            placeholder={<Text id="resetPassword.passwordPlaceholder" />}
            value={props.resetPasswordPassword}
            onInput={props.updatePassword}
            error={get(props, 'resetPasswordErrors.password') && <Text id="resetPassword.passwordTooShort" />}
            autocomplete="new-password"
            enterkeyhint="next"
            required
            dataCy="reset-password-password"
          />
        )}
        {!success && !props.errored && (
          <MobilePasswordField
            id="reset-password-repeat"
            label={<Text id="resetPassword.passwordRepeatLabel" />}
            placeholder={<Text id="resetPassword.passwordRepeatPlaceholder" />}
            value={props.resetPasswordPasswordRepeat}
            onInput={props.updatePasswordRepeat}
            error={get(props, 'resetPasswordErrors.passwordRepeat') && <Text id="resetPassword.passwordRepeatError" />}
            autocomplete="new-password"
            enterkeyhint="go"
            required
            dataCy="reset-password-password-repeat"
          />
        )}
        <div class={kitStyle.footnote}>
          <MarkupText id="global.needHelpText" />
        </div>
        <MobileAuthBar>
          {success && (
            <BigButton variant="primary" href="/login" data-cy="reset-password-login">
              <Text id="resetPassword.clickHereToLogin" />
            </BigButton>
          )}
          {props.errored && (
            <BigButton variant="primary" href="/forgot-password" data-cy="reset-password-new-link">
              <Text id="resetPassword.generateLinkAgain" />
            </BigButton>
          )}
          {!success && !props.errored && (
            <BigButton
              variant="primary"
              type="submit"
              loading={props.resetPasswordStatus === RequestStatus.Getting}
              data-cy="reset-password-submit"
            >
              <Text id="resetPassword.button" />
            </BigButton>
          )}
        </MobileAuthBar>
      </MobileAuthForm>
    </MobileAuthLayout>
  );
};

const ResetPasswordPage = ({ isMobile, ...props }) =>
  isMobile ? <MobileResetPasswordPage {...props} /> : <DesktopResetPasswordPage {...props} />;

export default withMobileViewport(ResetPasswordPage);
