import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import { RequestStatus } from '../../utils/consts';

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

  render(
    {
      recoveryCodes,
      status,
      onRetry,
      onContinue,
      continueLabelId,
      twoFactorCode,
      onTwoFactorCodeChange,
      wrongTwoFactorCode
    },
    { copied }
  ) {
    const downloadUrl = recoveryCodes
      ? `data:text/plain;charset=utf-8,${encodeURIComponent(recoveryCodes.join('\n'))}`
      : null;
    // The Gateway requires a current code from the two-factor app to generate recovery
    // codes: when the caller collects one, the retry needs a fresh 6 digits code.
    const retryDisabled = onTwoFactorCodeChange && (!twoFactorCode || twoFactorCode.length < 6);
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
