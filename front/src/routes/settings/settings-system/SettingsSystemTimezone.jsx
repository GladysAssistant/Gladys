import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import timezones from '../../../config/timezones';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';

class SettingsSystemTimezone extends Component {
  getTimezone = async () => {
    try {
      const { value } = await this.props.httpClient.get(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.TIMEZONE}`);
      const selectedTimezone = timezones.find(tz => tz.value === value);
      if (selectedTimezone) {
        this.setState({
          selectedTimezone
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  updateTimezone = async option => {
    this.setState({
      savingTimezone: true,
      selectedTimezone: option
    });
    try {
      await this.props.httpClient.post(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.TIMEZONE}`, {
        value: option.value
      });
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    this.getTimezone();
  }

  render({}, { selectedTimezone }) {
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.timezone" />
        </h4>

        <div class="card-body">
          <form className="">
            <p>
              <Text id="systemSettings.timezoneText" />
            </p>
            <Select options={timezones} onChange={this.updateTimezone} value={selectedTimezone} />
          </form>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(SettingsSystemTimezone);
