import { connect } from 'unistore/preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import * as consts from '../../utils/consts';
import loginActions from '../../actions/login/login';
import AuthLayout from '../../components/auth/AuthLayout';
import MobileAuthLayout from '../../components/auth/MobileAuthLayout';
import { MobileAuthTitle, MobileAuthForm, MobileAuthBar, MobileEmailField } from '../../components/auth/mobile';
import authStyle from '../../components/auth/style.css';
import { withMobileViewport, MobilePasswordField, BigButton, kitStyle } from '../../components/mobile';

const DesktopLoginPage = ({
  loginFormEmailValue,
  loginFormPasswordValue,
  loginStatus,
  login,
  onEmailChange,
  onPasswordChange
}) => (
  <AuthLayout>
    <form onSubmit={login} class="card">
      <div class="card-body p-6">
        <div class="card-title">
          <Text id="login.cardTitle" />
        </div>

        {loginStatus === consts.LoginStatus.WrongCredentialsError && (
          <div class="alert alert-danger" role="alert">
            <Text id="login.wrongCredentials" />
          </div>
        )}

        <div class="form-group">
          <label class="form-label">
            <Text id="login.emailLabel" />
          </label>
          <Localizer>
            <input
              type="email"
              class={loginStatus === consts.LoginStatus.WrongEmailError ? 'form-control is-invalid' : 'form-control'}
              placeholder={<Text id="login.emailPlaceholder" />}
              value={loginFormEmailValue}
              onInput={onEmailChange}
            />
          </Localizer>
          <div class="invalid-feedback">
            {' '}
            <Text id="login.invalidEmail" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            <Text id="login.passwordLabel" />
          </label>
          <Localizer>
            <input
              type="password"
              class="form-control"
              placeholder={<Text id="login.passwordPlaceholder" />}
              value={loginFormPasswordValue}
              onInput={onPasswordChange}
            />
          </Localizer>
        </div>

        <div class="form-footer">
          <button
            onClick={login}
            class="btn btn-primary btn-block"
            disabled={loginStatus === consts.LoginStatus.Processing}
          >
            <Text id="login.loginButtonText" />
          </button>
        </div>

        <a href="/forgot-password" className="float-right small mt-2">
          <Text id="login.forgotPasswordLabel" />
        </a>
      </div>
    </form>
    <div class="text-center text-muted">
      <MarkupText id="login.needHelpText" />
    </div>
  </AuthLayout>
);

// The sign-in on a phone (docs/specs/mobile-pages/auth.md, C.1): the account the phone saved
// is proposed, the password can be read, "Log in" is in the bottom bar with its refusal
const MobileLoginPage = ({
  loginFormEmailValue,
  loginFormPasswordValue,
  loginStatus,
  login,
  onEmailChange,
  onPasswordChange
}) => (
  <MobileAuthLayout dataCy="login-mobile">
    <MobileAuthForm onSubmit={login}>
      <MobileAuthTitle>
        <Text id="login.cardTitle" />
      </MobileAuthTitle>
      <MobileEmailField
        id="login-email"
        label={<Text id="login.emailLabel" />}
        placeholder={<Text id="login.emailPlaceholder" />}
        value={loginFormEmailValue}
        onInput={onEmailChange}
        error={loginStatus === consts.LoginStatus.WrongEmailError && <Text id="login.invalidEmail" />}
        autocomplete="username"
        enterkeyhint="next"
        dataCy="login-email"
      />
      <MobilePasswordField
        id="login-password"
        label={<Text id="login.passwordLabel" />}
        placeholder={<Text id="login.passwordPlaceholder" />}
        value={loginFormPasswordValue}
        onInput={onPasswordChange}
        autocomplete="current-password"
        enterkeyhint="go"
        dataCy="login-password"
      />
      <div class={authStyle.mobileLinks}>
        <a href="/forgot-password" class={authStyle.mobileLink} data-cy="login-forgot-password">
          <Text id="login.forgotPasswordLabel" />
        </a>
      </div>
      <div class={kitStyle.footnote}>
        <MarkupText id="login.needHelpText" />
      </div>
      <MobileAuthBar
        error={loginStatus === consts.LoginStatus.WrongCredentialsError && <Text id="login.wrongCredentials" />}
      >
        <BigButton
          variant="primary"
          type="submit"
          loading={loginStatus === consts.LoginStatus.Processing}
          data-cy="login-submit"
        >
          <Text id="login.loginButtonText" />
        </BigButton>
      </MobileAuthBar>
    </MobileAuthForm>
  </MobileAuthLayout>
);

const LoginPage = ({ isMobile, ...props }) =>
  isMobile ? <MobileLoginPage {...props} /> : <DesktopLoginPage {...props} />;

export default connect(
  'loginFormEmailValue,loginFormPasswordValue,loginStatus',
  loginActions
)(withMobileViewport(LoginPage));
