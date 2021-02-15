import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { PRESENCE_STATUS } from '../../../../../../../server/services/bluetooth/lib/utils/bluetooth.constants';

class BluetoothPresenceScanner extends Component {
  toggleStatus = () => {
    const newStatus =
      this.props.config.status === PRESENCE_STATUS.ENABLED ? PRESENCE_STATUS.DISABLED : PRESENCE_STATUS.ENABLED;
    this.props.updateConfig('presenceScanner', 'status', newStatus);
  };

  updateFrequency = e => {
    const { value } = e.target;
    const rawFrequency = parseFloat(value, 10);

    if (Number.isInteger(rawFrequency) && rawFrequency >= 1) {
      this.props.updateConfig('presenceScanner', 'frequency', rawFrequency * 60000);
      this.setState({ frequencyError: undefined });
    } else {
      this.setState({ frequencyError: value });
    }
  };

  render({ config = {}, disabled }, { frequencyError }) {
    const enabled = config.status === PRESENCE_STATUS.ENABLED;
    const frequency = config.frequency / 60000;

    return (
      <div>
        <div class="alert alert-secondary  mb-5">
          <Text id="integration.bluetooth.setup.presenceScannerDescription" />
        </div>

        <div class="form-group">
          <label class="custom-switch">
            <input
              type="radio"
              class="custom-switch-input"
              checked={enabled}
              onClick={this.toggleStatus}
              disabled={disabled}
            />
            <span class="custom-switch-indicator" />
            <span class="custom-switch-description">
              <Text id="integration.bluetooth.setup.presenceScannerStatusLabel" />
            </span>
          </label>
        </div>

        <div class="form-group">
          <label class="form-label">
            <Text id="integration.bluetooth.setup.presenceScannerFrequencyLabel" />
          </label>
          <div class="input-group col-sm-3">
            <input
              type="number"
              disabled={!enabled || disabled}
              value={frequencyError || frequency}
              min="1"
              class={cx('form-control', { 'is-invalid': frequencyError })}
              onInput={this.updateFrequency}
            />
            <div class="input-group-append">
              <span class="input-group-text">
                <Text id="integration.bluetooth.setup.presenceScannerFrequencyUnit" />
              </span>
            </div>
          </div>
          {frequencyError && (
            <div class="invalid-feedback d-block">
              <Text id="integration.bluetooth.setup.presenceScannerFrequencyError" />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default BluetoothPresenceScanner;
