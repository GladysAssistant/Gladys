import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/userPresence';
import { RequestStatus } from '../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

const zeroMarginBottom = {
  marginBottom: '0rem'
};

const UserPresence = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <i class="fe fe-home" />
        <span class="m-1">
          <Text id="dashboard.boxTitle.user-presence" />
        </span>
      </h3>
    </div>
    {props.DashboardUserPresenceGetUsersStatus === RequestStatus.Error && (
      <div class="card-alert alert alert-danger mb-0">
        <Text id="dashboard.boxes.userPresence.error" />
      </div>
    )}
    <div
      class="card-body o-auto"
      style={{
        maxHeight: '15rem',
        padding: '1rem'
      }}
    >
      <div
        class={
          props.DashboardUserPresenceGetUsersStatus === RequestStatus.Getting && !props.usersWithPresence
            ? 'dimmer active'
            : 'dimmer'
        }
      >
        <div class="loader" />
        <div class="dimmer-content">
          {!props.usersWithPresence && (
            <div
              style={{
                minHeight: '5rem'
              }}
            />
          )}
          {props.usersWithPresence && props.usersWithPresence.length === 0 && (
            <div>
              <div class="alert alert-icon alert-primary" role="alert">
                <i class="fe fe-bell mr-2" /> <Text id="dashboard.boxes.userPresence.emptyText" />
              </div>
            </div>
          )}
          <ul class="list-unstyled list-separated" style={zeroMarginBottom}>
            {props.usersWithPresence &&
              props.usersWithPresence.map(user => (
                <li class="list-separated-item">
                  <div class="row align-items-center">
                    <div class="col-auto">
                      <span class="avatar avatar-md d-block" style={`background-image: url(${user.picture})`} />
                    </div>
                    <div class="col">
                      <div>{user.firstname}</div>
                    </div>
                    <div class="col-auto">
                      {user.current_house_id && (
                        <span class="badge badge-success">
                          <Text id="dashboard.boxes.userPresence.atHome" />
                        </span>
                      )}
                      {!user.current_house_id && user.last_house_changed && (
                        <span class="badge badge-danger">
                          <Text id="dashboard.boxes.userPresence.left" /> ({user.last_house_changed_relative_to_now})
                        </span>
                      )}
                      {!user.current_house_id && user.last_house_changed === null && (
                        <span class="badge badge-danger">
                          {' '}
                          <Text id="dashboard.boxes.userPresence.neverSeenAtHome" />
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

@connect(
  'usersWithPresence,user,DashboardUserPresenceGetUsersStatus,session',
  actions
)
class UserPresenceComponent extends Component {
  componentDidMount() {
    this.props.getUsersWithPresence();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.USER_PRESENCE.BACK_HOME, payload =>
      this.props.userChanged(payload)
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.USER_PRESENCE.LEFT_HOME, payload =>
      this.props.userChanged(payload)
    );
  }

  render(props, {}) {
    return <UserPresence {...props} />;
  }
}

export default UserPresenceComponent;
