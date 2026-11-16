import { Text, Localizer } from 'preact-i18n';
import AuthLayout from '../../components/auth/AuthLayout';
import MobileAuthLayout from '../../components/auth/MobileAuthLayout';
import { MobileAuthTitle, MobileAuthForm, MobileAuthBar, MobileEmailField } from '../../components/auth/mobile';
import { withMobileViewport, MobileNotice, BigButton, kitStyle } from '../../components/mobile';

// The Gladys Plus password recovery on a phone (docs/specs/mobile-pages/auth.md, D.5)
const MobileForgotPassword = props => (
  <MobileAuthLayout
    backHref="/login"
    backLabel={<Text id="login.mobile.navBack" />}
    dataCy="gateway-forgot-password-mobile"
  >
    <MobileAuthForm onSubmit={props.sendResetPasswordLink}>
      <MobileAuthTitle>
        <Text id="gatewayForgotPassword.formTitle" />
      </MobileAuthTitle>
      {props.success && (
        <MobileNotice tone="success" icon="mail" role="status" data-cy="gateway-forgot-password-success">
          <Text id="gatewayForgotPassword.success" />
        </MobileNotice>
      )}
      {!props.success && (
        <MobileEmailField
          id="gateway-forgot-password-email"
          label={<Text id="gatewayForgotPassword.emailAddress" />}
          placeholder={<Text id="gatewayForgotPassword.emailAddressPlaceholder" />}
          value={props.email}
          onInput={props.updateEmail}
          autocomplete="username"
          enterkeyhint="send"
          dataCy="gateway-forgot-password-email"
        />
      )}
      <div class={kitStyle.footnote}>
        <Text id="gatewayForgotPassword.dontHaveAccount" />{' '}
        <a href="https://gladysassistant.com">
          <Text id="gatewayForgotPassword.signupLink" />
        </a>
      </div>
      <MobileAuthBar>
        {!props.success && (
          <BigButton
            variant="primary"
            type="submit"
            loading={props.forgotInProgress}
            data-cy="gateway-forgot-password-submit"
          >
            <Text id="gatewayForgotPassword.sendEmailButton" />
          </BigButton>
        )}
        {props.success && (
          <BigButton variant="primary" href="/login" data-cy="gateway-forgot-password-login">
            <Text id="gatewayResetTwoFactor.loginLink" />
          </BigButton>
        )}
      </MobileAuthBar>
    </MobileAuthForm>
  </MobileAuthLayout>
);

const DesktopForgotPassword = ({ children, ...props }) => (
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

const ForgotPassword = ({ isMobile, ...props }) =>
  isMobile ? <MobileForgotPassword {...props} /> : <DesktopForgotPassword {...props} />;

export default withMobileViewport(ForgotPassword);
