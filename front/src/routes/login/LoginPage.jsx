import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import { LoginStatus } from '../../utils/consts';
import loginActions from '../../actions/login/login';

@connect('loginFormEmailValue,loginFormPasswordValue,loginStatus', loginActions)
class LoginPage extends Component {
  login = e => {
    this.props.login(e, this.props.matches);
  };

  render({ loginFormEmailValue, loginFormPasswordValue, loginStatus, onEmailChange, onPasswordChange }) {
    return (
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
                <Text id="login.title" />
              </h2>
            </div>

            <form onSubmit={this.login} class="card">
              <div class="card-body p-6">
                <div class="card-title">
                  <Text id="login.cardTitle" />
                </div>

                {loginStatus === LoginStatus.WrongCredentialsError && (
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
                      class={loginStatus === LoginStatus.WrongEmailError ? 'form-control is-invalid' : 'form-control'}
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
                    <a href="/forgot-password" class="float-right small">
                      <Text id="login.forgotPasswordLabel" />
                    </a>
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
                    onClick={this.login}
                    class="btn btn-primary btn-block"
                    disabled={loginStatus === LoginStatus.Processing}
                  >
                    <Text id="login.loginButtonText" />
                  </button>
                </div>
              </div>
            </form>
            <div class="text-center text-muted">
              <MarkupText id="login.needHelpText" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LoginPage;
