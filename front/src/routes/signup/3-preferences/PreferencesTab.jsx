import { Text } from 'preact-i18n';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';
import Select from '../../../components/form/Select';

const updateUserProperty = (property, func) => e => {
  func(property, e.value);
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
        <Select
          value={props.signupUserPreferences.temperature_unit_preference}
          onChange={updateUserProperty('temperature_unit_preference', props.updateUserPreferences)}
          uniqueKey="value"
          options={[
            {
              value: 'celsius',
              label: <Text id="signup.preferences.temperatureUnitsCelsius" />
            },
            {
              value: 'fahrenheit',
              label: <Text id="signup.preferences.temperatureUnitsFahrenheit" />
            }
          ]}
        />
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="signup.preferences.distanceUnit" />
        </label>
        <Select
          value={props.signupUserPreferences.distance_unit_preference}
          onInput={updateUserProperty('distance_unit_preference', props.updateUserPreferences)}
          uniqueKey="value"
          options={[
            {
              value: 'metric',
              label: <Text id="signup.preferences.distanceUnitMeter" />
            },
            {
              value: 'us',
              label: <Text id="signup.preferences.distanceUnitUs" />
            }
          ]}
        />
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="signup.preferences.deviceStateHistoryDuration.title" />
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
            <div class="custom-control-label">
              <Text id="signup.preferences.deviceStateHistoryDuration.durationOneWeek" />
            </div>
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
            <div class="custom-control-label">
              <Text id="signup.preferences.deviceStateHistoryDuration.durationOneMonth" />
            </div>
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
            <div class="custom-control-label">
              <Text id="signup.preferences.deviceStateHistoryDuration.durationThreeMonth" />
            </div>
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
            <div class="custom-control-label">
              <Text id="signup.preferences.deviceStateHistoryDuration.unlimited" />
            </div>
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
