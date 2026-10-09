import { Component } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import { ALARM_MODES, WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import Countdown from './Coutdown';

import style from './style.css';

class AlarmComponent extends Component {
  state = {};

  arming = async () => {
    await this.setState({ arming: true });
  };

  cancelArming = async () => {
    await this.disarm();
    await this.getHouse();
  };

  getHouse = async () => {
    await this.setState({ loading: true });
    try {
      const house = await this.props.httpClient.get(`/api/v1/house/${this.props.box.house}`);
      await this.setState({ house, arming: false });
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

  arm = async () => {
    await this.callAlarmApi('arm');
  };
  disarm = async () => {
    await this.callAlarmApi('disarm');
  };
  partialArm = async () => {
    await this.callAlarmApi('partial_arm');
  };
  panic = async () => {
    await this.callAlarmApi('panic');
  };

  componentDidMount() {
    this.getHouse();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMED, this.getHouse);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING, this.arming);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ALARM.DISARMED, this.getHouse);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ALARM.PARTIALLY_ARMED, this.getHouse);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ALARM.PANIC, this.getHouse);
    this.props.session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMED, this.getHouse);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING, this.getHouse);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.DISARMED, this.getHouse);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.PARTIALLY_ARMED, this.getHouse);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.PANIC, this.getHouse);
    this.props.session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentDidUpdate(nextProps) {
    const houseChanged = nextProps.box.house !== this.props.box.house;
    if (houseChanged) {
      this.getHouse();
    }
  }

  render(props, { house, loading, arming }) {
    const armingDisabled = (house && house.alarm_mode === ALARM_MODES.ARMED) || arming;
    const partialArmDisabled = (house && house.alarm_mode === ALARM_MODES.PARTIALLY_ARMED) || arming;
    const isCurrentlyArmingWithCoutdown = arming && house.alarm_delay_before_arming > 0;
    return (
      <div class="card">
        {props.box.name && (
          <div class="card-header">
            <h3 class="card-title">{props.box.name}</h3>
          </div>
        )}
        {house && (
          <div class="card-body">
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
                    <Text id="dashboard.boxes.alarm.alarmArming" />
                    <Countdown seconds={house.alarm_delay_before_arming} />
                    <button class="btn btn-outline-warning btn-block mt-4" onClick={this.cancelArming}>
                      <Text id="dashboard.boxes.alarm.cancelAlarmArming" />
                    </button>
                  </p>
                )}
                {!isCurrentlyArmingWithCoutdown && (
                  <div class={style.alarmGrid}>
                    <button
                      onClick={this.arm}
                      disabled={armingDisabled}
                      class={cx(style.alarmTile, style.alarmTileArm, {
                        [style.alarmTileActive]: house.alarm_mode === ALARM_MODES.ARMED
                      })}
                    >
                      <span class={style.alarmTileIcon}>
                        <i class="fe fe-bell" />
                      </span>
                      <span>
                        <Text id="dashboard.boxes.alarm.armButton" />
                      </span>
                    </button>
                    <button
                      onClick={this.disarm}
                      disabled={house.alarm_mode === ALARM_MODES.DISARMED}
                      class={cx(style.alarmTile, style.alarmTileDisarm, {
                        [style.alarmTileActive]: house.alarm_mode === ALARM_MODES.DISARMED
                      })}
                    >
                      <span class={style.alarmTileIcon}>
                        <i class="fe fe-home" />
                      </span>
                      <span>
                        <Text id="dashboard.boxes.alarm.disarmButton" />
                      </span>
                    </button>
                    <button
                      onClick={this.partialArm}
                      disabled={partialArmDisabled}
                      class={cx(style.alarmTile, style.alarmTilePartial, {
                        [style.alarmTileActive]: house.alarm_mode === ALARM_MODES.PARTIALLY_ARMED
                      })}
                    >
                      <span class={style.alarmTileIcon}>
                        <i class="fe fe-shield" />
                      </span>
                      <span>
                        <Text id="dashboard.boxes.alarm.partiallyArmedButton" />
                        <br />
                        <Text id="dashboard.boxes.alarm.partiallyArmedButtonSecondLine" />
                      </span>
                    </button>
                    <button
                      onClick={this.panic}
                      disabled={house.alarm_mode === ALARM_MODES.PANIC}
                      class={cx(style.alarmTile, style.alarmTilePanic, {
                        [style.alarmTileActive]: house.alarm_mode === ALARM_MODES.PANIC
                      })}
                    >
                      <span class={style.alarmTileIcon}>
                        <i class="fe fe-alert-circle" />
                      </span>
                      <span>
                        <Text id="dashboard.boxes.alarm.panicButton" />
                      </span>
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
