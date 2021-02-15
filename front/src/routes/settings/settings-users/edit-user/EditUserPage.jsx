import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import ResetPassword from './ResetPassword';
import EditPreferences from './EditPreferences';
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
            <Text id="usersSettings.editUser.title" />
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
        <div class="card-body">{props.newUser && <EditPreferences newUser={props.newUser} />}</div>
      </div>
    </div>
  </div>
);

export default UserPage;
