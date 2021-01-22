import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import get from 'get-value';

import Profile from '../../../../components/user/profile';
import cx from 'classnames';

const UserPage = ({ children, ...props }) => (
  <div class="row">
    <div class="col-lg-12">
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
              <div class="row justify-content-center">
                <div class="col-lg-8">
                  {props.newUser && <Profile {...props} language="en" />}
                  <div class="form-group">
                    <button onClick={props.createUser} class="btn btn-success">
                      <Text id="profile.saveButton" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default UserPage;
