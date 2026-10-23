import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import { Text } from 'preact-i18n';
import update from 'immutability-helper';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import de from 'dayjs/locale/de';
import cx from 'classnames';

import { RequestStatus } from '../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import style from './style.css';

dayjs.extend(relativeTime);
// “seit” needs the same dative forms as “vor”, but without the “vor” prefix.
// Keep the app's normal German locale unchanged for every other relative date.
dayjs.locale(
  { ...de, name: 'de-presence', relativeTime: { ...de.relativeTime, past: '%s', future: '%s' } },
  null,
  true
);

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
                <li class="list-separated-item" key={user.selector}>
                  <div class={style.row}>
                    <div>
                      <span class="avatar avatar-md d-block" style={`background-image: url(${user.picture})`} />
                    </div>
                    <div class={style.name}>
                      {user.firstname}
                      {props.box.presence_show_lastname && user.lastname ? ` ${user.lastname}` : ''}
                    </div>
                    <div class={style.status}>
                      <span class={cx('badge', user.current_house_id ? 'badge-success' : 'badge-danger', style.badge)}>
                        <Text
                          id={`dashboard.boxes.userPresence.${
                            user.current_house_id ? 'atHome' : user.last_house_changed ? 'away' : 'neverSeenAtHome'
                          }`}
                        />
                      </span>
                      {user.last_house_changed &&
                        (user.current_house_id
                          ? props.box.presence_show_home_since
                          : props.box.presence_show_away_since !== false) && (
                          <small class={cx('text-muted', style.since)}>
                            <Text
                              id="dashboard.boxes.userPresence.since"
                              fields={{ duration: user.last_house_changed_relative_to_now }}
                            />
                          </small>
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
  getRelativeTime = timestamp =>
    dayjs(timestamp)
      .locale(this.props.user.language === 'de' ? 'de-presence' : this.props.user.language)
      .fromNow(this.props.user.language !== 'de');

  userChanged = user => {
    const userIndex = this.state.usersWithPresence.findIndex(u => u.selector === user.selector);
    // if user is not found, we refresh the box
    if (userIndex === -1) {
      return this.getUsersWithPresence();
    }
    if (user.last_house_changed) {
      user.last_house_changed_relative_to_now = this.getRelativeTime(user.last_house_changed);
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
      if (this.props.box.users && this.props.box.users.length > 0) {
        usersWithPresence = usersWithPresence.filter(user => this.props.box.users.indexOf(user.selector) !== -1);
      }
      // calculate relative date
      usersWithPresence.forEach(user => {
        if (user.last_house_changed) {
          user.last_house_changed_relative_to_now = this.getRelativeTime(user.last_house_changed);
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
  handleWebsocketConnected = ({ connected }) => {
    // When the websocket is disconnected, we refresh the data when the websocket is reconnected
    if (!connected) {
      this.wasDisconnected = true;
    } else if (this.wasDisconnected) {
      this.getUsersWithPresence();
      this.wasDisconnected = false;
    }
  };
  refreshRelativeTime = () => {
    if (this.state.usersWithPresence && this.state.usersWithPresence.length > 0) {
      const usersWithPresence = this.state.usersWithPresence.map(user => {
        if (user.last_house_changed) {
          user.last_house_changed_relative_to_now = this.getRelativeTime(user.last_house_changed);
        }
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
    this.props.session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
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
    this.props.session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
  }

  render(props, { usersWithPresence, dashboardUserPresenceGetUsersStatus }) {
    return (
      <UserPresence
        box={props.box}
        usersWithPresence={usersWithPresence}
        dashboardUserPresenceGetUsersStatus={dashboardUserPresenceGetUsersStatus}
      />
    );
  }
}

export default connect('httpClient,session,user', {})(UserPresenceComponent);
