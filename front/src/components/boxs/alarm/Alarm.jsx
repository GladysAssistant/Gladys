import { Component } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import { ALARM_MODES, WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

import style from './style.css';

class AlarmComponent extends Component {
  state = {};

  arming = async () => {
    await this.setState({ arming: true });
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
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMED, this.getHouse);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING, this.getHouse);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.DISARMED, this.getHouse);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.PARTIALLY_ARMED, this.getHouse);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.PANIC, this.getHouse);
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
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{props.box.name}</h3>
        </div>
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
                {arming && (
                  <p>
                    <Text id="dashboard.boxes.alarm.alarmArming" fields={{ count: house.alarm_delay_before_arming }} />
                  </p>
                )}
                <div class="row">
                  <div class="col-6">
                    <button
                      onClick={this.arm}
                      disabled={armingDisabled}
                      class={cx('btn btn-block', style.alarmActionButton, {
                        'btn-outline-primary': armingDisabled,
                        'btn-primary': !armingDisabled
                      })}
                    >
                      <Text id="dashboard.boxes.alarm.armButton" />
                    </button>
                  </div>
                  <div class="col-6">
                    <button
                      onClick={this.disarm}
                      disabled={house.alarm_mode === ALARM_MODES.DISARMED}
                      class={cx('btn btn-block', style.alarmActionButton, {
                        'btn-outline-success': house.alarm_mode === ALARM_MODES.DISARMED,
                        'btn-success': house.alarm_mode !== ALARM_MODES.DISARMED
                      })}
                    >
                      <Text id="dashboard.boxes.alarm.disarmButton" />
                    </button>
                  </div>
                </div>
                <div class="row mt-4">
                  <div class="col-6">
                    <button
                      onClick={this.partialArm}
                      disabled={partialArmDisabled}
                      class={cx('btn btn-secondary btn-block', style.alarmActionButton, {})}
                    >
                      <Text id="dashboard.boxes.alarm.partiallyArmedButton" />
                      <br />
                      <Text id="dashboard.boxes.alarm.partiallyArmedButtonSecondLine" />
                    </button>
                  </div>
                  <div class="col-6">
                    <button
                      onClick={this.panic}
                      disabled={house.alarm_mode === ALARM_MODES.PANIC}
                      class={cx('btn btn-outline-danger btn-block', style.alarmActionButton)}
                    >
                      <Text id="dashboard.boxes.alarm.panicButton" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default connect('httpClient,session', {})(AlarmComponent);
