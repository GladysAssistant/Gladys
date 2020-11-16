import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../../actions/dashboard/boxes/health';
import { RequestStatus, DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import get from 'get-value';

import DeviceRow from '../device-in-room/DeviceRow';

const cardStyle = {
  maxHeight: '20rem'
};

const minHeight = {
  minHeight: '6rem'
};

const UserHealthBox = ({ children, ...props }) => {
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">{props.userName}</h3>
      </div>
      {props.loading && (
        <div class="card-body o-auto" style={cardStyle}>
          <div class={props.loading ? 'dimmer active' : 'dimmer'}>
            <div class="loader" />
            <div class="dimmer-content">{props.loading && <div style={minHeight} />}</div>
          </div>
        </div>
      )}
      <div class="table-responsive" style={cardStyle}>
        <table class="table card-table table-vcenter">
          <tbody>
            {props.boxData &&
              props.boxData.healthData &&
              props.boxData.healthData.devices.map((device, deviceIndex) =>
                device.features.map(
                  (deviceFeature, deviceFeatureIndex) =>
                    props.box &&
                    props.box.device_features &&
                    props.box.device_features.indexOf(deviceFeature.selector) !== -1 && (
                      <DeviceRow
                        user={props.user}
                        x={props.x}
                        y={props.y}
                        device={device}
                        deviceFeature={deviceFeature}
                        roomIndex={props.roomIndex}
                        deviceIndex={deviceIndex}
                        deviceFeatureIndex={deviceFeatureIndex}
                        updateValue={props.updateValue}
                      />
                    )
                )
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

@connect('session,user,DashboardBoxDataHealth,DashboardBoxStatusHealth', actions)
class HealthBox extends Component {
  updateDeviceStateWebsocket = payload => this.props.deviceFeatureWebsocketEvent(this.props.x, this.props.y, payload);

  componentDidMount() {
    this.props.getHealthData(this.props.box, this.props.x, this.props.y);
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
  }

  render(props, {}) {
    const loading = boxStatus === RequestStatus.Getting && !boxData;
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Health.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Health.${props.x}_${props.y}`);
    const userName = get(boxData, 'healthData.user.name');

    return <UserHealthBox {...props} userName={userName} boxData={boxData} loading={loading} />;
  }
}

export default HealthBox;
