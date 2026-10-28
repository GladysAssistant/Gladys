import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import QRCode from 'qrcode';
import { RequestStatus } from '../../../utils/consts';
import TwoFactorAppList from '../../../components/gateway/TwoFactorAppList';

const TWO_FACTOR_CODE_LENGTH = 6;

// Self-service replacement of the two-factor app of the Gladys Plus account (new
// phone, new app...). The Gateway generates a new secret, the user registers it in
// the new app and proves they hold both the new secret and the current one. Nothing
// changes on the account until the Gateway accepts both codes, so the current app
// keeps working until then.
class GatewayTwoFactorApp extends Component {
  state = {
    status: null,
    configuring: false,
    replaced: false,
    dataUrl: null,
    secret: null,
    twoFactorCode: '',
    currentTwoFactorCode: '',
    error: null
  };

  startConfiguration = async () => {
    this.setState({
      configuring: true,
      replaced: false,
      status: RequestStatus.Getting,
      error: null,
      twoFactorCode: '',
      currentTwoFactorCode: ''
    });
    try {
      const { otpauth_url: otpauthUrl } = await this.props.session.getNewTwoFactorSecret();
      const secret = new URL(otpauthUrl).searchParams.get('secret');
      const dataUrl = await QRCode.toDataURL(otpauthUrl);
      this.setState({ secret, dataUrl, status: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ configuring: false, status: RequestStatus.Error, error: 'load' });
    }
  };

  cancel = () => {
    this.setState({
      configuring: false,
      status: null,
      error: null,
      dataUrl: null,
      secret: null,
      twoFactorCode: '',
      currentTwoFactorCode: ''
    });
  };

  copySecret = async () => {
    try {
      await navigator.clipboard.writeText(this.state.secret);
    } catch (e) {
      console.error(e);
    }
  };

  updateTwoFactorCode = e => {
    this.setState({ twoFactorCode: e.target.value });
  };

  updateCurrentTwoFactorCode = e => {
    this.setState({ currentTwoFactorCode: e.target.value });
  };

  replaceTwoFactorApp = async e => {
    e.preventDefault();
    this.setState({ status: RequestStatus.Getting, error: null });
    try {
      await this.props.session.updateTwoFactor({
        twoFactorSecret: this.state.secret,
        twoFactorCode: this.state.twoFactorCode,
        currentTwoFactorCode: this.state.currentTwoFactorCode
      });
      this.setState({
        configuring: false,
        replaced: true,
        status: RequestStatus.Success,
        dataUrl: null,
        secret: null,
        twoFactorCode: '',
        currentTwoFactorCode: ''
      });
    } catch (err) {
      console.error(err);
      const status = get(err, 'response.status');
      let error = 'update';
      if (status === 403) {
        // one of the codes is wrong or expired: the new secret is still valid, the
        // user stays on the form to enter fresh codes
        error = 'invalidCode';
      } else if (status === 429) {
        error = 'tooManyAttempts';
      }
      this.setState({
        status: RequestStatus.Error,
        error,
        twoFactorCode: '',
        currentTwoFactorCode: ''
      });
    }
  };

  render({}, { status, configuring, replaced, dataUrl, secret, twoFactorCode, currentTwoFactorCode, error }) {
    const codesFilled =
      twoFactorCode.length === TWO_FACTOR_CODE_LENGTH && currentTwoFactorCode.length === TWO_FACTOR_CODE_LENGTH;
    return (
      <div class="card">
        <div class="card-body p-6">
          <div class={cx('dimmer', { active: status === RequestStatus.Getting })}>
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-title">
                <Text id="gatewayTwoFactorApp.cardTitle" />
              </div>
              <p>
                <Text id="gatewayTwoFactorApp.description" />
              </p>
              {replaced && (
                <div class="alert alert-success" role="alert">
                  <Text id="gatewayTwoFactorApp.replacedSuccess" />
                </div>
              )}
              {status === RequestStatus.Error && error && (
                <div class="alert alert-danger" role="alert">
                  {error === 'invalidCode' && <Text id="gatewayTwoFactorApp.invalidCode" />}
                  {error === 'tooManyAttempts' && <Text id="gatewayTwoFactorApp.tooManyAttempts" />}
                  {error === 'load' && <Text id="gatewayTwoFactorApp.loadError" />}
                  {error === 'update' && <Text id="gatewayTwoFactorApp.updateError" />}
                </div>
              )}
              {configuring ? (
                <form onSubmit={this.replaceTwoFactorApp}>
                  <div class="alert alert-warning" role="alert">
                    <Text id="gatewayTwoFactorApp.replaceWarning" />
                  </div>
                  <TwoFactorAppList />
                  <p>
                    <Text id="gatewayConfigureTwoFactor.scanInstructions" />
                  </p>
                  <div class="form-group">{dataUrl && <img class="mx-auto d-block mb-5" src={dataUrl} alt="" />}</div>
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="gatewayConfigureTwoFactor.secretLabel" />
                    </label>
                    <div class="input-group">
                      <input type="text" class="form-control" disabled value={secret} />
                      <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" onClick={this.copySecret}>
                          <Text id="gatewayConfigureTwoFactor.copy" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="gatewayTwoFactorApp.newCodeLabel" />
                    </label>
                    <Localizer>
                      <input
                        type="text"
                        class="form-control"
                        placeholder={<Text id="gatewayLogin.twoFactorCodePlaceholder" />}
                        value={twoFactorCode}
                        onInput={this.updateTwoFactorCode}
                        inputmode="numeric"
                        autocomplete="off"
                        maxlength={TWO_FACTOR_CODE_LENGTH}
                      />
                    </Localizer>
                  </div>
                  <div class="form-group">
                    <label class="form-label">
                      <Text id="gatewayTwoFactorApp.currentCodeLabel" />
                    </label>
                    <Localizer>
                      <input
                        type="text"
                        class="form-control"
                        placeholder={<Text id="gatewayLogin.twoFactorCodePlaceholder" />}
                        value={currentTwoFactorCode}
                        onInput={this.updateCurrentTwoFactorCode}
                        inputmode="numeric"
                        autocomplete="off"
                        maxlength={TWO_FACTOR_CODE_LENGTH}
                      />
                    </Localizer>
                    <small class="form-text text-muted">
                      <Text id="gatewayTwoFactorApp.currentCodeHelp" />
                    </small>
                  </div>
                  <div class="btn-list">
                    <button type="submit" class="btn btn-primary" disabled={!codesFilled}>
                      <Text id="gatewayTwoFactorApp.confirmButton" />
                    </button>
                    <button type="button" class="btn btn-secondary" onClick={this.cancel}>
                      <Text id="global.cancel" />
                    </button>
                  </div>
                </form>
              ) : (
                <button type="button" class="btn btn-primary" onClick={this.startConfiguration}>
                  <Text id="gatewayTwoFactorApp.changeButton" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GatewayTwoFactorApp;
