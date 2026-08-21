import { Component } from 'preact';
import { Text } from 'preact-i18n';

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

  render({ recoveryCodes, onContinue, continueLabelId }, { copied }) {
    const downloadUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(recoveryCodes.join('\n'))}`;
    return (
      <div class="card">
        <div class="card-body p-6">
          <div class="card-title">
            <Text id="gatewayRecoveryCodes.cardTitle" />
          </div>
          <p>
            <Text id="gatewayRecoveryCodes.description" />
          </p>
          <div class="alert alert-warning" role="alert">
            <Text id="gatewayRecoveryCodes.saveThemNow" />
          </div>
          <div class="form-group">
            <ul class="list-unstyled text-center mb-0">
              {recoveryCodes.map(recoveryCode => (
                <li>
                  <code>{recoveryCode}</code>
                </li>
              ))}
            </ul>
          </div>
          <div class="form-group">
            <div class="btn-list">
              <a href={downloadUrl} download="gladys-plus-recovery-codes.txt" class="btn btn-secondary">
                <i class="fe fe-download mr-1" />
                <Text id="gatewayRecoveryCodes.downloadButton" />
              </a>
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
      </div>
    );
  }
}

export default GatewayRecoveryCodes;
