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
    // the value an authenticator app enrolls (the `secret` query param of the otpauth
    // URL, same as the QR code): shown for manual entry
    manualEntryKey: null,
    // the value the Gateway stores and verifies against: sent back on replacement.
    // It is not the manual entry key (the URL carries its base32 encoding).
    secret: null,
    twoFactorCode: '',
    currentTwoFactorCode: '',
    error: null
  };

  // Incremented on every start and cancel: a secret that arrives after the user
  // cancelled is dropped instead of being shown by the next attempt.
  attempt = 0;

  startConfiguration = async () => {
    this.attempt += 1;
    const { attempt } = this;
    this.setState({
      configuring: true,
      replaced: false,
      status: RequestStatus.Getting,
      error: null,
      twoFactorCode: '',
      currentTwoFactorCode: ''
    });
    try {
      const { otpauth_url: otpauthUrl, secret } = await this.props.session.getNewTwoFactorSecret();
      if (!secret) {
        // a Gateway that does not return the persistable secret yet: the URL secret
        // would be refused (or worse, stored as is), so we do not go further
        throw new Error('The Gateway did not return the secret to register');
      }
      const manualEntryKey = new URL(otpauthUrl).searchParams.get('secret');
      const dataUrl = await QRCode.toDataURL(otpauthUrl);
      if (attempt !== this.attempt) {
        return;
      }
      this.setState({ secret, manualEntryKey, dataUrl, status: RequestStatus.Success });
    } catch (e) {
      console.error('Could not get a new two-factor secret', get(e, 'response.status') || e.message);
      if (attempt !== this.attempt) {
        return;
      }
      this.setState({ configuring: false, status: RequestStatus.Error, error: 'load' });
    }
  };

  cancel = () => {
    this.attempt += 1;
    this.setState({
      configuring: false,
      status: null,
      error: null,
      dataUrl: null,
      manualEntryKey: null,
      secret: null,
      twoFactorCode: '',
      currentTwoFactorCode: ''
    });
  };

  copyManualEntryKey = async () => {
    try {
      await navigator.clipboard.writeText(this.state.manualEntryKey);
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
    // a second submit (Enter key) while the first one is pending would be refused by
    // the Gateway once the first one replaced the secret, and shown as an error
    if (this.state.status === RequestStatus.Getting) {
      return;
    }
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
        manualEntryKey: null,
        secret: null,
        twoFactorCode: '',
        currentTwoFactorCode: ''
      });
    } catch (err) {
      const status = get(err, 'response.status');
      // the request body holds the new secret and both codes: never log the whole error
      console.error('Could not replace the two-factor app', status || err.message);
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

  render({}, { status, configuring, replaced, dataUrl, manualEntryKey, twoFactorCode, currentTwoFactorCode, error }) {
    const pending = status === RequestStatus.Getting;
    const codesFilled =
      twoFactorCode.length === TWO_FACTOR_CODE_LENGTH && currentTwoFactorCode.length === TWO_FACTOR_CODE_LENGTH;
    return (
      <div class="card">
        <div class="card-body p-6">
          <div class={cx('dimmer', { active: pending })}>
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
                    <label class="form-label" htmlFor="gateway-two-factor-manual-entry-key">
                      <Text id="gatewayConfigureTwoFactor.secretLabel" />
                    </label>
                    <div class="input-group">
                      <input
                        id="gateway-two-factor-manual-entry-key"
                        type="text"
                        class="form-control"
                        disabled
                        value={manualEntryKey}
                      />
                      <div class="input-group-append">
                        <button class="btn btn-outline-secondary" type="button" onClick={this.copyManualEntryKey}>
                          <Text id="gatewayConfigureTwoFactor.copy" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label" htmlFor="gateway-two-factor-new-code">
                      <Text id="gatewayTwoFactorApp.newCodeLabel" />
                    </label>
                    <Localizer>
                      <input
                        id="gateway-two-factor-new-code"
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
                    <label class="form-label" htmlFor="gateway-two-factor-current-code">
                      <Text id="gatewayTwoFactorApp.currentCodeLabel" />
                    </label>
                    <Localizer>
                      <input
                        id="gateway-two-factor-current-code"
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
                    <button type="submit" class="btn btn-primary" disabled={!codesFilled || pending}>
                      <Text id="gatewayTwoFactorApp.confirmButton" />
                    </button>
                    {/* a replacement already sent cannot be cancelled: the button goes away
                        with it rather than suggesting otherwise */}
                    <button type="button" class="btn btn-secondary" onClick={this.cancel} disabled={pending}>
                      <Text id="global.cancel" />
                    </button>
                  </div>
                </form>
              ) : (
                <button type="button" class="btn btn-primary" onClick={this.startConfiguration} disabled={pending}>
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
