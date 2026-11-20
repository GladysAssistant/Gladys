import { Text } from 'preact-i18n';
import get from 'get-value';
import style from '../style.css';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';
import { RequestStatus } from '../../../utils/consts';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { MobileAuthCard } from '../../../components/auth/mobile';
import {
  withMobileViewport,
  MobileField,
  fieldClass,
  MobileSegmented,
  MobileBottomBar,
  BigButton,
  kitStyle
} from '../../../components/mobile';

const HISTORY_DURATIONS = [
  { value: '7', textId: 'durationOneWeek' },
  { value: '30', textId: 'durationOneMonth' },
  { value: '90', textId: 'durationThreeMonth' },
  { value: '180', textId: 'durationSixMonths' },
  { value: '365', textId: 'durationOneYear' },
  { value: '730', textId: 'durationTwoYears' },
  { value: '-1', textId: 'unlimited' }
];

const updateUserProperty = (property, func) => e => {
  func(property, e.target.value);
};

const updateSystemProperty = (property, func) => e => {
  func(property, parseInt(e.target.value, 10));
};

const DesktopPreferences = ({ children, ...props }) => (
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

// The preferences on a phone (docs/specs/mobile-pages/onboarding.md, C.3): two choices between
// two options are segmented controls, the retention period is the native list of the system
const MobilePreferences = withIntlAsProp(({ intl, ...props }) => {
  const dictionary = intl.dictionary;
  const saving =
    props.signupSaveUserPreferences === RequestStatus.Getting ||
    props.signupSaveSystemPreferences === RequestStatus.Getting;
  // the two requests of the save: the second one is what leads to the next step
  const failed = !saving && props.signupSaveSystemPreferences === RequestStatus.Error;
  return (
    <div class={style.mobileSegmented} data-cy="signup-preferences-mobile">
      <h1 class={kitStyle.largeTitle}>
        <Text id="signup.preferences.title" />
      </h1>
      <p class={kitStyle.lead}>
        <Text id="signup.preferences.description" />
      </p>
      <MobileAuthCard>
        <MobileField label={<Text id="signup.preferences.temperatureUnitsLabel" />}>
          <MobileSegmented
            label={get(dictionary, 'signup.preferences.temperatureUnitsLabel')}
            value={props.signupUserPreferences.temperature_unit_preference}
            onChange={value => props.updateUserPreferences('temperature_unit_preference', value)}
            options={[
              {
                value: 'celsius',
                label: get(dictionary, 'signup.preferences.temperatureUnitsCelsius'),
                dataCy: 'signup-unit-celsius'
              },
              {
                value: 'fahrenheit',
                label: get(dictionary, 'signup.preferences.temperatureUnitsFahrenheit'),
                dataCy: 'signup-unit-fahrenheit'
              }
            ]}
          />
        </MobileField>
        <MobileField label={<Text id="signup.preferences.distanceUnit" />}>
          <MobileSegmented
            label={get(dictionary, 'signup.preferences.distanceUnit')}
            value={props.signupUserPreferences.distance_unit_preference}
            onChange={value => props.updateUserPreferences('distance_unit_preference', value)}
            options={[
              {
                value: 'metric',
                label: get(dictionary, 'signup.mobile.distanceKilometers'),
                dataCy: 'signup-unit-metric'
              },
              { value: 'us', label: get(dictionary, 'signup.mobile.distanceMiles'), dataCy: 'signup-unit-us' }
            ]}
          />
        </MobileField>
        <MobileField
          label={<Text id="signup.preferences.deviceStateHistoryDuration.title" />}
          htmlFor="historyDuration"
          help={<Text id="signup.mobile.historyHelp" />}
        >
          <select
            id="historyDuration"
            class={fieldClass.select}
            value={props.signupSystemPreferences[SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS]}
            onChange={updateSystemProperty(
              SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS,
              props.updateSystemPreferences
            )}
            data-cy="signup-history-duration"
          >
            {HISTORY_DURATIONS.map(duration => (
              <option value={duration.value}>
                {get(dictionary, `signup.preferences.deviceStateHistoryDuration.${duration.textId}`)}
              </option>
            ))}
          </select>
        </MobileField>
      </MobileAuthCard>
      <MobileBottomBar error={failed ? <Text id="signup.mobile.savePreferencesError" /> : null}>
        <BigButton variant="primary" onClick={props.savePreferences} loading={saving} data-cy="signup-save-preferences">
          <Text id="signup.preferences.saveSettingsButton" />
        </BigButton>
      </MobileBottomBar>
    </div>
  );
});

const Preferences = ({ isMobile, ...props }) =>
  isMobile ? <MobilePreferences {...props} /> : <DesktopPreferences {...props} />;

export default withMobileViewport(Preferences);
