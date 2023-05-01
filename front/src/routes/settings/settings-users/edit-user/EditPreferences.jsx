import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

class ResetPassword extends Component {
  updateTemperatureUnit = e => {
    this.setState({
      temperatureUnitPreference: e.target.value
    });
  };
  updateDistanceUnit = e => {
    this.setState({
      distanceUnitPreference: e.target.value
    });
  };
  savePreferences = async () => {
    const { temperatureUnitPreference, distanceUnitPreference } = this.state;
    await this.setState({ loading: true });
    try {
      await this.props.httpClient.patch(`/api/v1/user/${this.props.newUser.selector}`, {
        temperature_unit_preference: temperatureUnitPreference,
        distance_unit_preference: distanceUnitPreference
      });
    } catch (e) {
      console.error(e);
    }
    this.setState({
      loading: false
    });
  };
  constructor(props) {
    super(props);
    this.state = {
      temperatureUnitPreference: props.newUser.temperature_unit_preference,
      distanceUnitPreference: props.newUser.distance_unit_preference
    };
  }
  render(props, { loading, temperatureUnitPreference, distanceUnitPreference }) {
    return (
      <div class={loading ? 'dimmer active' : 'dimmer'}>
        <div class="loader" />
        <div class="dimmer-content">
          <div class="form-group">
            <label class="form-label">
              <Text id="signup.preferences.temperatureUnitsLabel" />
            </label>
            <select value={temperatureUnitPreference} onInput={this.updateTemperatureUnit} class="form-control">
              <option value="celsius">
                <Text id="signup.preferences.temperatureUnitsCelsius" />
              </option>
              <option value="fahrenheit">
                <Text id="signup.preferences.temperatureUnitsFahrenheit" />
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">
              <Text id="signup.preferences.distanceUnit" />
            </label>
            <select value={distanceUnitPreference} onInput={this.updateDistanceUnit} class="form-control">
              <option value="metric">
                <Text id="signup.preferences.distanceUnitMeter" />
              </option>
              <option value="us">
                <Text id="signup.preferences.distanceUnitUs" />
              </option>
            </select>
          </div>
          <div class="form-group">
            <button onClick={this.savePreferences} class="btn btn-success">
              <Text id="usersSettings.editUser.saveButton" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('currentUrl,httpClient', {})(ResetPassword);
