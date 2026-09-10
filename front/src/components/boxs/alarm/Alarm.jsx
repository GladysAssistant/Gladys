import { Component } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import { ALARM_MODES, WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import Countdown from './Coutdown';

import style from './style.css';

// The three arming modes, in the order they appear in the widget: from the lightest protection to
// the strictest. Each one is a tile, an endpoint and a tint of its own.
const ARM_MODES = [
  { mode: ALARM_MODES.PRESENCE_ARMED, route: 'presence_arm', tile: style.alarmTilePresence, icon: 'fe fe-home' },
  { mode: ALARM_MODES.NIGHT_ARMED, route: 'night_arm', tile: style.alarmTileNight, icon: 'fe fe-moon' },
  { mode: ALARM_MODES.AWAY_ARMED, route: 'away_arm', tile: style.alarmTileAway, icon: 'fe fe-log-out' }
];

const ARMED_WEBSOCKET_TYPES = [
  WEBSOCKET_MESSAGE_TYPES.ALARM.PRESENCE_ARMED,
  WEBSOCKET_MESSAGE_TYPES.ALARM.NIGHT_ARMED,
  WEBSOCKET_MESSAGE_TYPES.ALARM.AWAY_ARMED,
  WEBSOCKET_MESSAGE_TYPES.ALARM.DISARMED,
  WEBSOCKET_MESSAGE_TYPES.ALARM.TRIGGERED
];

class AlarmComponent extends Component {
  state = {};

  arming = async payload => {
    // Two alarm widgets can sit on the same dashboard: only the one whose house is arming
    // should show the countdown.
    if (!payload || payload.house !== this.props.box.house) {
      return;
    }
    await this.setState({ arming: true, armingMode: payload.mode });
  };

  cancelArming = async () => {
    await this.disarm();
    await this.getHouse();
  };

  getHouse = async () => {
    await this.setState({ loading: true });
    try {
      const house = await this.props.httpClient.get(`/api/v1/house/${this.props.box.house}`);
      await this.setState({ house, arming: false, armingMode: undefined });
    } catch (e) {
      console.error(e);
    }
    await this.setState({ loading: false });
  };

  handleWebsocketConnected = ({ connected }) => {
    // When the websocket is disconnected, we refresh the data when the websocket is reconnected
    if (!connected) {
      this.wasDisconnected = true;
    } else if (this.wasDisconnected) {
      this.getHouse();
      this.wasDisconnected = false;
    }
  };

  callAlarmApi = async action => {
    await this.setState({ loading: true });
    try {
      await this.props.httpClient.post(`/api/v1/house/${this.props.box.house}/${action}`);
    } catch (e) {
      console.error(e);
    }
    await this.setState({ loading: false });
  };

  arm = async route => {
    await this.callAlarmApi(route);
  };
  disarm = async () => {
    await this.callAlarmApi('disarm');
  };
  panic = async () => {
    await this.callAlarmApi('panic');
  };

  componentDidMount() {
    this.getHouse();
    ARMED_WEBSOCKET_TYPES.forEach(type => this.props.session.dispatcher.addListener(type, this.getHouse));
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING, this.arming);
    this.props.session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentWillUnmount() {
    ARMED_WEBSOCKET_TYPES.forEach(type => this.props.session.dispatcher.removeListener(type, this.getHouse));
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING, this.arming);
    this.props.session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentDidUpdate(nextProps) {
    const houseChanged = nextProps.box.house !== this.props.box.house;
    if (houseChanged) {
      this.getHouse();
    }
  }

  render(props, { house, loading, arming, armingMode }) {
    const isCurrentlyArmingWithCoutdown = arming && house.alarm_delay_before_arming > 0;
    const triggered = house && house.alarm_mode === ALARM_MODES.TRIGGERED;
    const disarmed = house && house.alarm_mode === ALARM_MODES.DISARMED;
    // Switching straight from one arming mode to another would start a countdown whose Cancel
    // disarms the house — on a wall tablet, "Cancel" must never mean "turn the alarm off". The
    // way from one mode to another goes through Disarm.
    const modeSwitchBlocked = house && !disarmed;
    return (
      <div class="card">
        {props.box.name && (
          <div class="card-header">
            <h3 class="card-title">{props.box.name}</h3>
          </div>
        )}
        {house && (
          <div class={cx('card-body', { [style.alarmTriggered]: triggered })}>
            <div class={loading ? 'dimmer active' : 'dimmer'}>
              <div class="loader" />
              <div class="dimmer-content">
                {!arming && (
                  <p>
                    <Text id="dashboard.boxes.alarm.alarmStatusText" />
                    <b>
                      <Text id={`alarmModes.${house.alarm_mode}`} />
                    </b>
                    .
                  </p>
                )}
                {isCurrentlyArmingWithCoutdown && (
                  <p>
                    {armingMode ? (
                      <span>
                        <Text id="dashboard.boxes.alarm.alarmArmingInMode" />{' '}
                        <b>
                          <Text id={`alarmModeNames.${armingMode}`} />
                        </b>
                      </span>
                    ) : (
                      <Text id="dashboard.boxes.alarm.alarmArming" />
                    )}
                    <Countdown seconds={house.alarm_delay_before_arming} />
                    <button class="btn btn-outline-warning btn-block mt-4" onClick={this.cancelArming}>
                      <Text id="dashboard.boxes.alarm.cancelAlarmArming" />
                    </button>
                  </p>
                )}
                {!isCurrentlyArmingWithCoutdown && (
                  <div>
                    <div class={style.alarmGrid}>
                      {ARM_MODES.map(({ mode, route, tile, icon }) => (
                        <button
                          key={mode}
                          onClick={() => this.arm(route)}
                          disabled={modeSwitchBlocked || arming}
                          class={cx(style.alarmTile, tile, {
                            [style.alarmTileActive]: house.alarm_mode === mode
                          })}
                        >
                          <span class={style.alarmTileIcon}>
                            <i class={icon} />
                          </span>
                          <span>
                            <Text id={`alarmModeNames.${mode}`} />
                          </span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={this.disarm}
                      disabled={disarmed}
                      class={cx(style.alarmDisarmButton, { [style.alarmDisarmButtonActive]: disarmed })}
                    >
                      <i class="fe fe-shield-off" />
                      <Text id="dashboard.boxes.alarm.disarmButton" />
                    </button>
                    {/* panic is an action, not a mode: it sits apart, below the modes */}
                    <div class={style.alarmPanicSeparator} />
                    <button onClick={this.panic} disabled={triggered} class={style.alarmPanicButton}>
                      <i class="fe fe-alert-circle" />
                      <Text id="dashboard.boxes.alarm.panicButton" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default connect('httpClient,session', {})(AlarmComponent);
