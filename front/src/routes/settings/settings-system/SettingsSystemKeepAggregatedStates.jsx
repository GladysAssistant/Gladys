import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';
import get from 'get-value';

class SettingsSystemKeepAggregatedStates extends Component {
  getDeviceAggregateStateHistoryPreference = async () => {
    try {
      const { value } = await this.props.httpClient.get(
        `/api/v1/variable/${SYSTEM_VARIABLE_NAMES.DEVICE_AGGREGATE_STATE_HISTORY_IN_DAYS}`
      );
      this.setState({
        deviceAggregateStateHistoryInDays: value
      });
    } catch (e) {
      console.error(e);
      const status = get(e, 'response.status');
      if (status === 404) {
        // Default value is -1
        this.setState({
          deviceAggregateStateHistoryInDays: '-1'
        });
      }
    }
  };

  updateDeviceAggregateStateHistory = async e => {
    await this.setState({
      deviceAggregateStateHistoryInDays: e.target.value,
      savingDeviceStateHistory: true
    });
    try {
      await this.props.httpClient.post(
        `/api/v1/variable/${SYSTEM_VARIABLE_NAMES.DEVICE_AGGREGATE_STATE_HISTORY_IN_DAYS}`,
        {
          value: e.target.value
        }
      );
    } catch (e) {
      console.error(e);
    }
    await this.setState({
      savingDeviceStateHistory: false
    });
  };

  componentDidMount() {
    this.getDeviceAggregateStateHistoryPreference();
  }

  render({}, { deviceAggregateStateHistoryInDays }) {
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.deviceAggregatesStateRetentionTime" />
        </h4>

        <div class="card-body">
          <form className="">
            <p>
              <Text id="systemSettings.deviceAggregatesStateRetentionTimeDescription" />
            </p>
            <select
              className="form-control"
              value={deviceAggregateStateHistoryInDays}
              onChange={this.updateDeviceAggregateStateHistory}
            >
              <option value="7">
                <Text id="signup.preferences.deviceStateHistoryDuration.durationOneWeek" />
              </option>
              <option value="30">
                <Text id="signup.preferences.deviceStateHistoryDuration.durationOneMonth" />
              </option>
              <option value="90">
                <Text id="signup.preferences.deviceStateHistoryDuration.durationThreeMonth" />
              </option>
              <option value="180">
                <Text id="signup.preferences.deviceStateHistoryDuration.durationSixMonths" />
              </option>
              <option value="365">
                <Text id="signup.preferences.deviceStateHistoryDuration.durationOneYear" />
              </option>
              <option value="730">
                <Text id="signup.preferences.deviceStateHistoryDuration.durationTwoYears" />
              </option>
              <option value="-1">
                <Text id="signup.preferences.deviceStateHistoryDuration.unlimited" />
              </option>
            </select>
          </form>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(SettingsSystemKeepAggregatedStates);
