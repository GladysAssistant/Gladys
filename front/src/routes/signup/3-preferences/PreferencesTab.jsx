import { Text } from 'preact-i18n';
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
      <h2>
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
          <Text id="signup.preferences.deviceStateHistoryDuration" />
        </label>
        <div class="custom-controls-stacked">
          <label class="custom-control custom-radio">
            <input
              type="radio"
              class="custom-control-input"
              name="device-state-history-radio"
              onChange={updateSystemProperty(
                SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS,
                props.updateSystemPreferences
              )}
              value="7"
              checked={props.signupSystemPreferences[SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS] === 7}
            />
            <div class="custom-control-label">1 week</div>
          </label>
          <label class="custom-control custom-radio">
            <input
              type="radio"
              class="custom-control-input"
              name="device-state-history-radio"
              onChange={updateSystemProperty(
                SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS,
                props.updateSystemPreferences
              )}
              value="30"
              checked={props.signupSystemPreferences[SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS] === 30}
            />
            <div class="custom-control-label">1 month</div>
          </label>
          <label class="custom-control custom-radio">
            <input
              type="radio"
              class="custom-control-input"
              name="device-state-history-radio"
              onChange={updateSystemProperty(
                SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS,
                props.updateSystemPreferences
              )}
              value="90"
              checked={props.signupSystemPreferences[SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS] === 90}
            />
            <div class="custom-control-label">3 month</div>
          </label>
          <label class="custom-control custom-radio">
            <input
              type="radio"
              class="custom-control-input"
              name="device-state-history-radio"
              onChange={updateSystemProperty(
                SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS,
                props.updateSystemPreferences
              )}
              value="-1"
              checked={props.signupSystemPreferences[SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS] === -1}
            />
            <div class="custom-control-label">Forever</div>
          </label>
        </div>
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
