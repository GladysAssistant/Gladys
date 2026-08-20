import { Text } from 'preact-i18n';
import cx from 'classnames';
import EditProfile from './EditProfile';

import style from './style.css';
import dashboardStyle from '../dashboard/style.css';

// The profile lives on the same Horizon glass scene as the settings pages:
// glass-theme gates the shared theme layer and .settings-page carries the
// settings grammar (routes/settings/style.css) for the form and cards.
// One centered column: a horizontal hero card (avatar + name + role) above
// the form card, instead of the old 2-column layout and its empty gutter.
const DashboardProfile = ({ children, ...props }) => (
  <div class="page">
    <div
      class={cx(
        'page-main',
        'glass-theme',
        'settings-page',
        dashboardStyle.dashboardBackground,
        dashboardStyle.glassScene
      )}
    >
      {/* padding, not margin: a top margin collapses through the glass
          page-main and shifts the scene down (same move as new-dashboard) */}
      <div class="py-3 py-md-5">
        <div class="container">
          <div class={style.profileColumn}>
            <div class="page-header">
              <h1 class="page-title">
                <Text id="profile.title" />
              </h1>
            </div>
            {props.newUser && (
              <div class="card">
                <div class="card-body">
                  <div class={style.profileHero}>
                    {/* decorative: the adjacent name already identifies the user */}
                    <img
                      class={style.profileAvatar}
                      alt=""
                      src={props.profilePicture || '/assets/images/undraw_profile_pic.svg'}
                    />
                    <div class={style.profileIdentity}>
                      <h3>
                        {props.newUser.firstname} {props.newUser.lastname}
                      </h3>
                      <span class="tag">
                        {props.newUser.role === 'admin' ? (
                          <Text id="profile.adminRole" />
                        ) : (
                          <Text id="profile.userRole" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <EditProfile {...props} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardProfile;
