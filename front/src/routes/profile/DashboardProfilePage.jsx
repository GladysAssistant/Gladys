import { Text } from 'preact-i18n';
import EditProfile from './EditProfile';

const DashboardProfile = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title">
              <Text id="profile.title" />
            </h1>
          </div>
          <div class="row">
            <div class="col-md-4">
              <div class="card card-profile">
                <div class="card-header" />
                {props.newUser && (
                  <div class="card-body text-center">
                    <img
                      class="card-profile-img"
                      src={props.profilePicture || '/assets/images/undraw_profile_pic.svg'}
                    />
                    <h3 class="mb-3">{props.newUser.firstname}</h3>
                    <p class="mb-4">
                      {props.newUser.role === 'admin' ? (
                        <Text id="profile.adminRole" />
                      ) : (
                        <Text id="profile.userRole" />
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div class="col-md-8">
              <EditProfile {...props} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardProfile;
