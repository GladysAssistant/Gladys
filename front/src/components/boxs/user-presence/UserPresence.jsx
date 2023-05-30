import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import { Text } from 'preact-i18n';
import update from 'immutability-helper';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import cx from 'classnames';

import { RequestStatus } from '../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

dayjs.extend(relativeTime);

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
    {props.dashboardUserPresenceGetUsersStatus === RequestStatus.Error && (
      <div class="card-alert alert alert-danger mb-0">
        <Text id="dashboard.boxes.userPresence.error" />
      </div>
    )}
    <div class="card-body o-auto p-4">
      <div
        class={cx('dimmer', {
          active: props.dashboardUserPresenceGetUsersStatus === RequestStatus.Getting && !props.usersWithPresence
        })}
      >
        <div class="loader" />
        <div
          class={cx('dimmer-content', {
            'py-4': !props.usersWithPresence,
            'my-5': !props.usersWithPresence
          })}
        >
          {props.usersWithPresence && props.usersWithPresence.length === 0 && (
            <div>
              <div class="alert alert-icon alert-primary" role="alert">
                <i class="fe fe-bell mr-2" /> <Text id="dashboard.boxes.userPresence.emptyText" />
              </div>
            </div>
          )}
          <ul class="list-unstyled list-separated mb-0">
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
                          <Text
                            id="dashboard.boxes.userPresence.left"
                            fields={{ since: user.last_house_changed_relative_to_now }}
                          />
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

class UserPresenceComponent extends Component {
  userChanged = user => {
    const userIndex = this.state.usersWithPresence.findIndex(u => u.selector === user.selector);
    // if user is not found, we refresh the box
    if (userIndex === -1) {
      return this.getUsersWithPresence();
    }
    if (user.last_house_changed) {
      user.last_house_changed_relative_to_now = dayjs(user.last_house_changed)
        .locale(this.props.user.language)
        .fromNow();
    }
    // if not, we update it
    const newState = update(this.state, {
      usersWithPresence: {
        [userIndex]: {
          $merge: user
        }
      }
    });
    this.setState(newState);
  };
  getUsersWithPresence = async () => {
    this.setState({
      dashboardUserPresenceGetUsersStatus: RequestStatus.Getting
    });
    try {
      let usersWithPresence = await this.props.httpClient.get(
        '/api/v1/user?fields=firstname,lastname,role,selector,picture,current_house_id,last_house_changed'
      );
      if (this.props.box.users) {
        usersWithPresence = usersWithPresence.filter(user => this.props.box.users.indexOf(user.selector) !== -1);
      }
      // calculate relative date
      usersWithPresence.forEach(user => {
        if (user.last_house_changed) {
          user.last_house_changed_relative_to_now = dayjs(user.last_house_changed)
            .locale(this.props.user.language)
            .fromNow();
        }
      });
      this.setState({
        usersWithPresence,
        dashboardUserPresenceGetUsersStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        dashboardUserPresenceGetUsersStatus: RequestStatus.Error
      });
    }
  };
  refreshRelativeTime = () => {
    if (this.state.usersWithPresence && this.state.usersWithPresence.length > 0) {
      const usersWithPresence = this.state.usersWithPresence.map(user => {
        user.last_house_changed_relative_to_now = dayjs(user.last_house_changed)
          .locale(this.props.user.language)
          .fromNow();
        return user;
      });
      this.setState({ usersWithPresence });
    }
  };
  componentDidMount() {
    this.getUsersWithPresence();
    // refresh every minute the relative time
    this.interval = setInterval(() => {
      this.refreshRelativeTime();
    }, 60 * 1000);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.USER_PRESENCE.BACK_HOME, this.userChanged);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.USER_PRESENCE.LEFT_HOME, this.userChanged);
  }

  componentDidUpdate(previousProps) {
    const usersChanged = get(previousProps, 'box.users') !== get(this.props, 'box.users');
    if (usersChanged) {
      this.getUsersWithPresence();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.USER_PRESENCE.BACK_HOME, this.userChanged);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.USER_PRESENCE.LEFT_HOME, this.userChanged);
  }

  render(props, { usersWithPresence, dashboardUserPresenceGetUsersStatus }) {
    return (
      <UserPresence
        usersWithPresence={usersWithPresence}
        dashboardUserPresenceGetUsersStatus={dashboardUserPresenceGetUsersStatus}
      />
    );
  }
}

export default connect('httpClient,session,user', {})(UserPresenceComponent);
