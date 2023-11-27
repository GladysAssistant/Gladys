import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';

class SettingsSystemTimeExpiryState extends Component {
  getNumberOfHoursBeforeStateIsOutdated = async () => {
    try {
      const { value } = await this.props.httpClient.get(
        `/api/v1/variable/${SYSTEM_VARIABLE_NAMES.DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED}`
      );
      this.setState({
        numberOfHoursBeforeStateIsOutdated: value
      });
    } catch (e) {
      console.error(e);
      // if variable doesn't exist, value is 48
      this.setState({
        numberOfHoursBeforeStateIsOutdated: 48
      });
    }
  };

  updateNumberOfHoursBeforeStateIsOutdated = async e => {
    await this.setState({
      numberOfHoursBeforeStateIsOutdated: e.target.value,
      savingNumberOfHourseBeforeStateIsOutdated: true
    });
    try {
      await this.props.httpClient.post(
        `/api/v1/variable/${SYSTEM_VARIABLE_NAMES.DEVICE_STATE_NUMBER_OF_HOURS_BEFORE_STATE_IS_OUTDATED}`,
        {
          value: e.target.value
        }
      );
    } catch (e) {
      console.error(e);
    }
    await this.setState({
      savingNumberOfHourseBeforeStateIsOutdated: false
    });
  };

  componentDidMount() {
    this.getNumberOfHoursBeforeStateIsOutdated();
  }

  render({}, { numberOfHoursBeforeStateIsOutdated }) {
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.numberOfHoursBeforeStateIsOutdated" />
        </h4>

        <div class="card-body">
          <form className="">
            <p>
              <Text id="systemSettings.numberOfHoursBeforeStateIsOutdatedDescription" />
            </p>
            <div class="input-group">
              <input
                className="form-control"
                type="number"
                min="1"
                value={numberOfHoursBeforeStateIsOutdated}
                onChange={this.updateNumberOfHoursBeforeStateIsOutdated}
              />
              <div class="input-group-append">
                <span class="input-group-text">
                  <Text id="systemSettings.hours" />
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(SettingsSystemTimeExpiryState);
