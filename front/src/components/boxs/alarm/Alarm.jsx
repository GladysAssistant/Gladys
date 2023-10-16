import { Component } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';

import style from './style.css';

class AlarmComponent extends Component {
  state = {};

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

  render(props, {}) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{props.box.name}</h3>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-6">
              <button onClick={this.arm} class={cx('btn btn-secondary btn-block', style.alarmActionButton)}>
                <Text id="dashboard.boxes.alarm.armButton" />
              </button>
            </div>
            <div class="col-6">
              <button onClick={this.disarm} class={cx('btn btn-outline-success btn-block', style.alarmActionButton)}>
                <Text id="dashboard.boxes.alarm.disarmButton" />
              </button>
            </div>
          </div>
          <div class="row mt-4">
            <div class="col-6">
              <button onClick={this.partialArm} class={cx('btn btn-secondary btn-block', style.alarmActionButton)}>
                <Text id="dashboard.boxes.alarm.partiallyArmedButton" />
                <br />
                <Text id="dashboard.boxes.alarm.partiallyArmedButtonSecondLine" />
              </button>
            </div>
            <div class="col-6">
              <button onClick={this.panic} class={cx('btn btn-outline-danger btn-block', style.alarmActionButton)}>
                <Text id="dashboard.boxes.alarm.panicButton" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', {})(AlarmComponent);
