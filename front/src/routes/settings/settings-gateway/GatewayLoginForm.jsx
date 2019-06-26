import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus, LoginStatus } from '../../../utils/consts';

const GatewayLoginForm = ({ children, ...props }) => (
  <form onSubmit={!props.gatewayLoginStep2 ? props.login : props.loginTwoFactor} class="card">
    <div class="card-body p-6">
      <div
        class={cx('dimmer', {
          active: props.gatewayLoginStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="card-title">
            <Text id="gatewayLogin.cardTitle" />
          </div>

          {props.gatewayLoginStatus === LoginStatus.WrongCredentialsError && (
            <div class="alert alert-danger" role="alert">
              <Text id="gatewayLogin.wrongCredentials" />
            </div>
          )}
          {props.gatewayLoginStatus === RequestStatus.NetworkError && (
            <div class="alert alert-danger" role="alert">
              <Text id="gatewayLogin.networkError" />
            </div>
          )}

          {!props.gatewayLoginStep2 && (
            <div class="form-group">
              <label class="form-label">
                <Text id="gatewayLogin.emailLabel" />
              </label>
              <Localizer>
                <input
                  type="email"
                  class={cx('form-control', {
                    'is-invalid': props.gatewayLoginStatus === LoginStatus.WrongEmailError
                  })}
                  placeholder={<Text id="gatewayLogin.emailPlaceholder" />}
                  value={props.gatewayLoginEmail}
                  onInput={props.updateLoginEmail}
                />
              </Localizer>
              <div class="invalid-feedback">
                {' '}
                <Text id="gatewayLogin.invalidEmail" />
              </div>
            </div>
          )}

          {!props.gatewayLoginStep2 && (
            <div class="form-group">
              <label class="form-label">
                <Text id="gatewayLogin.passwordLabel" />
                <a href="https://gateway.gladysassistant.com/forgot-password" class="float-right small">
                  <Text id="gatewayLogin.forgotPasswordLabel" />
                </a>
              </label>
              <Localizer>
                <input
                  type="password"
                  class="form-control"
                  placeholder={<Text id="gatewayLogin.passwordPlaceholder" />}
                  value={props.gatewayLoginPassword}
                  onInput={props.updateLoginPassword}
                />
              </Localizer>
            </div>
          )}

          {props.gatewayLoginStep2 && (
            <div class="form-group">
              <label class="form-label">
                <Text id="gatewayLogin.twoFactorCodeLabel" />
              </label>
              <Localizer>
                <input
                  type="text"
                  class={cx('form-control')}
                  placeholder={<Text id="gatewayLogin.twoFactorCodePlaceholder" />}
                  value={props.gatewayLoginTwoFactorCode}
                  onInput={props.updateLoginTwoFactorCode}
                />
              </Localizer>
              <div class="invalid-feedback">
                {' '}
                <Text id="gatewayLogin.invalidTwoFactorCode" />
              </div>
            </div>
          )}

          <div class="form-footer">
            {!props.gatewayLoginStep2 && (
              <button
                onClick={props.login}
                class="btn btn-primary btn-block"
                disabled={props.gatewayLoginStatus === RequestStatus.Getting}
              >
                <Text id="gatewayLogin.loginButtonText" />
              </button>
            )}
            {props.gatewayLoginStep2 && (
              <button
                onClick={props.loginTwoFactor}
                class="btn btn-primary btn-block"
                disabled={props.gatewayLoginStatus === RequestStatus.Getting}
              >
                <Text id="gatewayLogin.loginTwoFactorButtonText" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </form>
);

export default GatewayLoginForm;
