import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../utils/consts';
import { MobileAuthTitle, MobileAuthBar, MobileCodeField } from '../auth/mobile';
import authStyle from '../auth/style.css';
import { MobileNotice, BigButton, kitStyle } from '../mobile';

// One-time display of the two-factor recovery codes, right after they are
// generated: the Gateway only stores hashes, so the codes can never be
// displayed again (only replaced by a new set).
class GatewayRecoveryCodes extends Component {
  state = {
    copied: false
  };

  copyRecoveryCodes = async e => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(this.props.recoveryCodes.join('\n'));
      this.setState({ copied: true });
    } catch (err) {
      console.error(err);
    }
  };

  // The codes on a phone (docs/specs/mobile-pages/auth.md, D.2): the same codes, the same two
  // ways to keep them, and the way on in the bottom bar
  renderMobile(downloadUrl, retryDisabled) {
    const {
      recoveryCodes,
      status,
      onRetry,
      onContinue,
      continueLabelId,
      twoFactorCode,
      onTwoFactorCodeChange,
      wrongTwoFactorCode
    } = this.props;
    const { copied } = this.state;
    const errored = status === RequestStatus.Error;
    const loading = status === RequestStatus.Getting;
    return (
      <div data-cy="gateway-recovery-codes-mobile">
        <MobileAuthTitle lead={!errored && <Text id="gatewayRecoveryCodes.description" />}>
          <Text id="gatewayRecoveryCodes.cardTitle" />
        </MobileAuthTitle>
        {loading && (
          <div class={authStyle.mobileStatus} role="status">
            <div class="loader" />
          </div>
        )}
        {errored && (
          <MobileNotice tone="danger" icon="alert-circle" role="alert">
            {wrongTwoFactorCode ? (
              <Text id="gatewayLogin.invalidTwoFactorCode" />
            ) : (
              <Text id="gatewayRecoveryCodes.generationError" />
            )}
          </MobileNotice>
        )}
        {errored && onTwoFactorCodeChange && (
          <MobileCodeField
            id="gateway-recovery-codes-two-factor-code"
            label={<Text id="gatewayLogin.twoFactorCodeLabel" />}
            placeholder={<Text id="gatewayLogin.twoFactorCodePlaceholder" />}
            help={<Text id="gatewayRecoveryCodes.twoFactorCodeRequired" />}
            value={twoFactorCode}
            onInput={onTwoFactorCodeChange}
            maxlength="6"
            autofocus
            dataCy="gateway-recovery-codes-two-factor-code"
          />
        )}
        {!errored && !loading && (
          <MobileNotice tone="warning" icon="alert-triangle">
            <Text id="gatewayRecoveryCodes.saveThemNow" />
          </MobileNotice>
        )}
        {!errored && !loading && (
          <ul class={cx(authStyle.mobileCard, authStyle.mobileCodes)} data-cy="gateway-recovery-codes-list">
            {(recoveryCodes || []).map(recoveryCode => (
              <li>
                <code>{recoveryCode}</code>
              </li>
            ))}
          </ul>
        )}
        {!errored && !loading && (
          <div class={kitStyle.buttonsRow}>
            {downloadUrl && (
              <BigButton
                icon="download"
                href={downloadUrl}
                download="gladys-plus-recovery-codes.txt"
                data-cy="gateway-recovery-codes-download"
              >
                <Text id="gatewayRecoveryCodes.downloadButton" />
              </BigButton>
            )}
            <BigButton
              icon={copied ? 'check' : 'copy'}
              onClick={this.copyRecoveryCodes}
              data-cy="gateway-recovery-codes-copy"
            >
              <span role="status">
                {copied ? (
                  <Text id="gatewayRecoveryCodes.copiedButton" />
                ) : (
                  <Text id="gatewayRecoveryCodes.copyButton" />
                )}
              </span>
            </BigButton>
          </div>
        )}
        <MobileAuthBar>
          {errored && onRetry && (
            <BigButton
              variant="primary"
              onClick={onRetry}
              disabled={retryDisabled}
              data-cy="gateway-recovery-codes-retry"
            >
              <Text id="gatewayRecoveryCodes.retryButton" />
            </BigButton>
          )}
          {!errored && onContinue && (
            <BigButton
              variant="primary"
              onClick={onContinue}
              disabled={loading}
              data-cy="gateway-recovery-codes-continue"
            >
              <Text id={continueLabelId || 'gatewayRecoveryCodes.continueButton'} />
            </BigButton>
          )}
        </MobileAuthBar>
      </div>
    );
  }

  render(
    {
      recoveryCodes,
      status,
      onRetry,
      onContinue,
      continueLabelId,
      twoFactorCode,
      onTwoFactorCodeChange,
      wrongTwoFactorCode,
      mobile
    },
    { copied }
  ) {
    const downloadUrl = recoveryCodes
      ? `data:text/plain;charset=utf-8,${encodeURIComponent(recoveryCodes.join('\n'))}`
      : null;
    // The Gateway requires a current code from the two-factor app to generate recovery
    // codes: when the caller collects one, the retry needs a fresh 6 digits code.
    const retryDisabled = onTwoFactorCodeChange && (!twoFactorCode || twoFactorCode.length < 6);
    if (mobile) {
      return this.renderMobile(downloadUrl, retryDisabled);
    }
    return (
      <div class="card">
        <div class="card-body p-6">
          <div class={cx('dimmer', { active: status === RequestStatus.Getting })}>
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-title">
                <Text id="gatewayRecoveryCodes.cardTitle" />
              </div>
              {status === RequestStatus.Error ? (
                <div>
                  <div class="alert alert-danger" role="alert">
                    {wrongTwoFactorCode ? (
                      <Text id="gatewayLogin.invalidTwoFactorCode" />
                    ) : (
                      <Text id="gatewayRecoveryCodes.generationError" />
                    )}
                  </div>
                  {onTwoFactorCodeChange && (
                    <div class="form-group">
                      <label class="form-label">
                        <Text id="gatewayLogin.twoFactorCodeLabel" />
                      </label>
                      <Localizer>
                        <input
                          type="text"
                          class="form-control"
                          placeholder={<Text id="gatewayLogin.twoFactorCodePlaceholder" />}
                          value={twoFactorCode}
                          onInput={onTwoFactorCodeChange}
                          inputmode="numeric"
                          autocomplete="one-time-code"
                          maxlength="6"
                          autofocus
                        />
                      </Localizer>
                      <small class="form-text text-muted">
                        <Text id="gatewayRecoveryCodes.twoFactorCodeRequired" />
                      </small>
                    </div>
                  )}
                  {onRetry && (
                    <div class="form-footer">
                      <button
                        type="button"
                        class="btn btn-primary btn-block"
                        onClick={onRetry}
                        disabled={retryDisabled}
                      >
                        <Text id="gatewayRecoveryCodes.retryButton" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p>
                    <Text id="gatewayRecoveryCodes.description" />
                  </p>
                  <div class="alert alert-warning" role="alert">
                    <Text id="gatewayRecoveryCodes.saveThemNow" />
                  </div>
                  <div class="form-group">
                    <ul class="list-unstyled text-center mb-0">
                      {(recoveryCodes || []).map(recoveryCode => (
                        <li>
                          <code>{recoveryCode}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div class="form-group">
                    <div class="btn-list">
                      {downloadUrl && (
                        <a href={downloadUrl} download="gladys-plus-recovery-codes.txt" class="btn btn-secondary">
                          <i class="fe fe-download mr-1" />
                          <Text id="gatewayRecoveryCodes.downloadButton" />
                        </a>
                      )}
                      <button type="button" class="btn btn-secondary" onClick={this.copyRecoveryCodes}>
                        <i class="fe fe-copy mr-1" />
                        {copied ? (
                          <Text id="gatewayRecoveryCodes.copiedButton" />
                        ) : (
                          <Text id="gatewayRecoveryCodes.copyButton" />
                        )}
                      </button>
                    </div>
                  </div>
                  {onContinue && (
                    <div class="form-footer">
                      <button type="button" class="btn btn-primary btn-block" onClick={onContinue}>
                        <Text id={continueLabelId || 'gatewayRecoveryCodes.continueButton'} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GatewayRecoveryCodes;
