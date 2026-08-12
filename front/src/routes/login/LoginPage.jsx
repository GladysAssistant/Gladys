import { connect } from 'unistore/preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import * as consts from '../../utils/consts';
import loginActions from '../../actions/login/login';

const LoginPage = connect(
  'loginFormEmailValue,loginFormPasswordValue,loginStatus',
  loginActions
)(({ loginFormEmailValue, loginFormPasswordValue, loginStatus, login, onEmailChange, onPasswordChange }) => (
  <div class="container">
    <div class="row">
      <div class="col col-login mx-auto">
        <div class="text-center mb-6">
          <h2>
            <Localizer>
              <img src="/assets/icons/favicon-96x96.png" class="header-brand-img" alt={<Text id="global.logoAlt" />} />
            </Localizer>
            <Text id="login.title" />
          </h2>
        </div>

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
                  class={
                    loginStatus === consts.LoginStatus.WrongEmailError ? 'form-control is-invalid' : 'form-control'
                  }
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
      </div>
    </div>
  </div>
));

export default LoginPage;
