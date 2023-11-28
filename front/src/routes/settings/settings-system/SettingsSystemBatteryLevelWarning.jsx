import cx from 'classnames';
import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';
import debounce from 'debounce';
import { connect } from 'unistore/preact';

class SettingsSystemBatteryLevelWarning extends Component {
  getBatteryLevelUnderWarning = async () => {
    try {
      const { value: batteryLevelUnderWarningThreshold } = await this.props.httpClient.get(
        `/api/v1/variable/${SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_THRESHOLD}`
      );

      const { value: batteryLevelUnderWarningEnabled } = await this.props.httpClient.get(
        `/api/v1/variable/${SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED}`
      );

      this.setState({
        batteryLevelUnderWarningThreshold,
        batteryLevelUnderWarningEnabled: batteryLevelUnderWarningEnabled === '1'
      });
    } catch (e) {
      console.error(e);
    }
  };

  updateBatteryLevelUnderWarningThreshold = async e => {
    let { value, min, max } = e.target;
    if (value !== undefined && value !== null && value !== '') {
      value = Math.max(Number(min), Math.min(Number(max), Number(value)));
    }

    await this.setState({
      batteryLevelUnderWarningThreshold: value,
      savingBatteryLevelUnderWarning: true
    });
    try {
      await this.props.httpClient.post(
        `/api/v1/variable/${SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_THRESHOLD}`,
        {
          value
        }
      );
    } catch (e) {
      console.error(e);
    }
    await this.setState({
      savingBatteryLevelUnderWarning: false
    });
  };

  debouncedUpdateBatteryLevelUnderWarningThreshold = debounce(this.updateBatteryLevelUnderWarningThreshold, 200);

  updateBatteryLevelUnderWarningEnabled = async () => {
    const value = !this.state.batteryLevelUnderWarningEnabled;
    await this.setState({
      batteryLevelUnderWarningEnabled: value,
      savingBatteryLevelUnderWarning: true
    });
    try {
      await this.props.httpClient.post(
        `/api/v1/variable/${SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED}`,
        {
          value
        }
      );
    } catch (e) {
      console.error(e);
    }
    await this.setState({
      savingBatteryLevelUnderWarning: false
    });
  };

  componentDidMount() {
    this.getBatteryLevelUnderWarning();
  }

  render({}, { batteryLevelUnderWarningThreshold, batteryLevelUnderWarningEnabled }) {
    return (
      <div class="card">
        <h4 class="card-header d-flex flex-row justify-content-between">
          <label
            className={cx('mb-0', {
              'text-muted': !batteryLevelUnderWarningEnabled
            })}
          >
            <Text id="systemSettings.batteryLevel" />
          </label>
          <label className="custom-switch">
            <input
              type="checkbox"
              name="active"
              value="1"
              className="custom-switch-input"
              checked={batteryLevelUnderWarningEnabled}
              onClick={this.updateBatteryLevelUnderWarningEnabled}
            />
            <span class="custom-switch-indicator" />
          </label>
        </h4>
        <div class="card-body">
          <form className="">
            <p
              class={cx({
                'text-muted': !batteryLevelUnderWarningEnabled
              })}
            >
              <Text id="systemSettings.batteryLevelDescription" />
            </p>
            <div class="input-group">
              <input
                className="form-control"
                type="number"
                min="0"
                max="100"
                disabled={!batteryLevelUnderWarningEnabled}
                value={batteryLevelUnderWarningThreshold}
                onChange={this.debouncedUpdateBatteryLevelUnderWarningThreshold}
              />
              <div class="input-group-append">
                <span class="input-group-text">
                  <Text id="global.percent" />
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(SettingsSystemBatteryLevelWarning);
