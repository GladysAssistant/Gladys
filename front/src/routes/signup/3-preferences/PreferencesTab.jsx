import { Text } from 'preact-i18n';
import style from '../style.css';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';

const updateUserProperty = (property, func) => e => {
  func(property, e.target.value);
};

const updateSystemProperty = (property, func) => e => {
  func(property, parseInt(e.target.value, 10));
};

const CreateLocalGladysAccount = ({ children, ...props }) => (
  <div class="row">
    <div class="col-md-8 mx-auto">
      <h2 class={style.signupTitle}>
        <Text id="signup.preferences.title" />
      </h2>
      <p>
        <Text id="signup.preferences.description" />
      </p>
      <div class="form-group">
        <label class="form-label">
          <Text id="signup.preferences.temperatureUnitsLabel" />
        </label>
        <select
          value={props.signupUserPreferences.temperature_unit_preference}
          onInput={updateUserProperty('temperature_unit_preference', props.updateUserPreferences)}
          class="form-control"
        >
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
        <select
          value={props.signupUserPreferences.distance_unit_preference}
          onInput={updateUserProperty('distance_unit_preference', props.updateUserPreferences)}
          class="form-control"
        >
          <option value="metric">
            <Text id="signup.preferences.distanceUnitMeter" />
          </option>
          <option value="us">
            <Text id="signup.preferences.distanceUnitUs" />
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="signup.preferences.deviceStateHistoryDuration.title" />
        </label>
        <select
          class="form-control"
          value={props.signupSystemPreferences[SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS]}
          onChange={updateSystemProperty(
            SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS,
            props.updateSystemPreferences
          )}
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
      </div>
      <div class="form-group">
        <button onClick={props.savePreferences} class="btn btn-success">
          <Text id="signup.preferences.saveSettingsButton" />
        </button>
      </div>
    </div>
  </div>
);

export default CreateLocalGladysAccount;
