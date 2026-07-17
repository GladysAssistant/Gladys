import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus, LoginStatus } from '../../../utils/consts';

const GatewayConfigureTwoFactor = ({ children, ...props }) => (
  <form onSubmit={props.enableTwoFactor} class="card">
    <div class="card-body p-6">
      <div
        class={cx('dimmer', {
          active: props.gatewayLoginStatus === RequestStatus.Getting
        })}
      >
        <div class="loader" />
        <div class="dimmer-content">
          <div class="card-title">
            <Text id="gatewayConfigureTwoFactor.cardTitle" />
          </div>
          <div class="alert alert-info" role="alert">
            <Text id="gatewayConfigureTwoFactor.twoFactorNotConfigured" />
          </div>
          {props.gatewayLoginStatus === LoginStatus.WrongTwoFactorCodeError && (
            <div class="alert alert-danger" role="alert">
              <Text id="gatewayConfigureTwoFactor.invalidCode" />
            </div>
          )}
          {props.gatewayLoginStatus === RequestStatus.NetworkError && (
            <div class="alert alert-danger" role="alert">
              <Text id="gatewayLogin.networkError" />
            </div>
          )}
          {props.gatewayLoginStatus === RequestStatus.Error && (
            <div class="alert alert-danger" role="alert">
              <Text id="gatewayLogin.unknownError" />
            </div>
          )}
          <p>
            <Text id="gatewayConfigureTwoFactor.scanInstructions" />
          </p>
          <div class="form-group">
            {props.gatewayConfigureTwoFactorDataUrl && (
              <img
                class="mx-auto d-block"
                src={props.gatewayConfigureTwoFactorDataUrl}
                alt=""
                style={{ marginBottom: '20px' }}
              />
            )}
          </div>
          <div class="form-group">
            <label class="form-label">
              <Text id="gatewayConfigureTwoFactor.secretLabel" />
            </label>
            <div class="input-group">
              <input type="text" class="form-control" disabled value={props.gatewayConfigureTwoFactorSecret} />
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" type="button" onClick={props.copyTwoFactorSecret}>
                  <Text id="gatewayConfigureTwoFactor.copy" />
                </button>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">
              <Text id="gatewayConfigureTwoFactor.confirmCodeLabel" />
            </label>
            <Localizer>
              <input
                type="text"
                class="form-control"
                placeholder={<Text id="gatewayLogin.twoFactorCodePlaceholder" />}
                value={props.gatewayConfigureTwoFactorCode}
                onInput={props.updateConfigureTwoFactorCode}
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
              />
            </Localizer>
          </div>
          <div class="form-footer">
            <button
              onClick={props.enableTwoFactor}
              class="btn btn-primary btn-block"
              disabled={props.gatewayLoginStatus === RequestStatus.Getting}
            >
              <Text id="gatewayConfigureTwoFactor.enableButton" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </form>
);

export default GatewayConfigureTwoFactor;
