import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import ResetPassword from './ResetPassword';
import Profile from '../../../../components/user/profile';

const UserPage = ({ children, ...props }) => (
  <div class="row">
    <div class="col-lg-6">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Link href="/dashboard/settings/user">
              <button type="button" class="btn btn-outline-secondary btn-sm">
                <Text id="global.backButton" />
              </button>
            </Link>{' '}
            <Text id="profile.editYourProfileTitle" />
          </h3>
        </div>
        <div class="card-body">
          <div class={props.loading ? 'dimmer active' : 'dimmer'}>
            <div class="loader" />
            <div class="dimmer-content">
              {props.newUser && <Profile {...props} language="en" disablePassword />}
              <div class="form-group">
                <button onClick={props.updateUser} class="btn btn-success">
                  <Text id="profile.saveButton" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-lg-6">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            {' '}
            <Text id="usersSettings.editUser.resetPassword" />
          </h3>
        </div>
        <div class="card-body">{props.newUser && <ResetPassword userSelector={props.newUser.selector} />}</div>
      </div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            {' '}
            <Text id="usersSettings.editUser.editPreferences" />
          </h3>
        </div>
        <div class="card-body">
          <div class={props.loading ? 'dimmer active' : 'dimmer'}>
            <div class="loader" />
            <div class="dimmer-content">
              <div class="form-group">
                <label class="form-label">
                  <Text id="signup.preferences.temperatureUnitsLabel" />
                </label>
                <select value={props.temperature_unit_preference} onInput={() => {}} class="form-control">
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
                <select value={props.distance_unit_preference} onInput={() => {}} class="form-control">
                  <option value="metric">
                    <Text id="signup.preferences.distanceUnitMeter" />
                  </option>
                  <option value="us">
                    <Text id="signup.preferences.distanceUnitUs" />
                  </option>
                </select>
              </div>
              <div class="form-group">
                <button onClick={props.saveProfile} class="btn btn-success">
                  <Text id="usersSettings.editUser.saveButton" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default UserPage;
