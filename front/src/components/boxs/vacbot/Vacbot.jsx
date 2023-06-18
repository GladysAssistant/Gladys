import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/vacbot';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY, RequestStatus } from '../../../utils/consts';
// TODO : import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import get from 'get-value';
import cx from 'classnames';
import VacbotModeDeviceFeature from '../device-in-room/device-features/VacbotModeDeviceFeature';

const BOX_REFRESH_INTERVAL_MS = 3 * 6 * 1000;

const VacbotBox = ({ children, ...props }) => (
  <div class="card">
    {props.error && (
      <div>
        <p class="alert alert-danger">
          <i class="fe fe-bell" />
          <span class="pl-2">
            <Text id="dashboard.boxes.vacbot.noVacbotInfo" />
          </span>
        </p>
      </div>
    )}

    <div class="card-body ">
      <div class="card-header">
        <div class="d-flex bd-highlight mb-3">
          <h2 class="card-title me-auto p-2 bd-highlight">{props.name}</h2>

          <div class="p-2 bd-highlight">
            {props.cleanReport == 'idle' && <i class={`list-separated-item fe fe-disc`} />}
            {props.chargeStatus == 'returning' && <i class={`list-separated-item fe fe-dowload`} />}
            {props.cleanReport == 'auto' && <i class={`list-separated-item fe fe-play-circle`} />}

            {props.cleanReport}
          </div>

          <div class="p-2 bd-highlight align-items-right">
            {props.chargeStatus == 'charging' && <i class={`fe fe-battery-charging`}>{props.batteryLevel}% </i>}
            {props.chargeStatus != 'charging' && (
              <i class={`fe fe-battery`} style={{ fontSize: '20px' }}>
                {props.batteryLevel}%
              </i>
            )}
          </div>
        </div>
      </div>

      <div
        class="bg-image d-flex flex-row-reverse"
        style={{
          backgroundImage: `url(${props.imageUrl})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          width: '100%',
          height: '250px',
          position: 'relative'
        }}
      >
        <div class="p-2">
          {props.hasMappingCapabilities && <button class={`btn btn-sm fe fe-map`} />}
          {props.hasCustomAreaCleaningMode && <button class={`btn btn-sm fe fe-codepen`} />}
        </div>
        <div class="d-flex align-items-center justify-content-center">
          <div class="btn-group" role="group">
            <button
              class={cx('btn btn-sm btn-secondary', 'fe', 'fe-play', {
                active: 1
              })}
              onClick={props.clean}
            />
            <button
              class={cx('btn btn-sm btn-secondary', 'fe', 'fe-pause', {
                active: 1
              })}
              onClick={props.pause}
            />
            <button
              class={cx('btn btn-sm btn-secondary', 'fe', 'fe-square', {
                active: 1
              })}
              onClick={props.stop}
            />
            <button
              class={cx('btn btn-sm btn-secondary', 'fe', 'fe-home', {
                active: 1
              })}
              onClick={props.home}
            />
          </div>
          <div>
          {props.deviceFeature}
          </div>
          
        </div>
      </div>
    </div>
    <table>
      <VacbotModeDeviceFeature  device={props.device} deviceFeature={props.deviceFeature} deviceIndex={0} deviceFeatureIndex={0} />
    </table>
    <div class="mt-3">
      hasMoppingSystem : {props.hasMoppingSystem}, chargeStatus : {props.chargeStatus}, cleanReport :{' '}
      {props.cleanReport}
    </div>
  </div>
);

class VacbotBoxComponent extends Component {
  refreshData = () => {
    this.props.getVacbot(this.props.box, this.props.x, this.props.y);
    console.log(`PROPS `, this.props);
  };
  /*
  updateDeviceStateWebsocket = payload =>
    this.props.deviceFeatureWebsocketEvent(this.props.box, this.props.x, this.props.y, payload);
*/
  componentDidMount() {
    this.refreshData();
    // refresh vacbot every interval
    this.interval = setInterval(() => this.refreshData, BOX_REFRESH_INTERVAL_MS);
    /*
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.deviceFeatureWebsocketEvent
    );
    */
  }

  componentDidUpdate(previousProps) {
    const vacbotChanged = get(previousProps, 'box.vacbot') !== get(this.props, 'box.vacbot');
    const nameChanged = get(previousProps, 'box.name') !== get(this.props, 'box.name');
    if (vacbotChanged || nameChanged) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    /*
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    */
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Vacbot.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Vacbot.${props.x}_${props.y}`);
    const name = get(boxData, 'vacbot.name');
    const imageUrl = get(boxData, 'vacbot.imageUrl');
    const hasMappingCapabilities = get(boxData, 'vacbot.hasMappingCapabilities');
    const hasCustomAreaCleaningMode = get(boxData, 'vacbot.hasCustomAreaCleaningMode');
    const hasMoppingSystem = get(boxData, 'vacbot.hasMoppingSystem');
    const chargeStatus = get(boxData, 'vacbot.chargeStatus');
    const cleanReport = get(boxData, 'vacbot.cleanReport');
    const batteryLevel = get(boxData, 'vacbot.batteryLevel');
    // const device = get(boxData, 'device');
    // const deviceFeature = get(boxData, 'deviceFeature');
    const json = `
    {
      "id": "e91d470b-4293-4363-a7c3-721bedde2031",
      "service_id": "e3d01cdf-ae4c-4a09-9cbf-8cf9741ee23b",
      "room_id": "af7dc442-6dca-4b2f-b25b-ec2c4787731b",
      "name": "DEEBOT OZMO 920 Series",
      "selector": "ecovacs-5c19a8f3a1e6ee0001782247-0",
      "model": "DX5G",
      "external_id": "ecovacs:5c19a8f3a1e6ee0001782247:0",
      "should_poll": true,
      "poll_frequency": 60000,
      "created_at": "2023-05-22T16:30:01.540Z",
      "updated_at": "2023-05-22T16:30:01.540Z",
      "features": [
        {
          "id": "b525e65b-9f41-4568-825c-86c6b8c4115d",
          "device_id": "e91d470b-4293-4363-a7c3-721bedde2031",
          "name": "power",
          "selector": "ecovacs-5c19a8f3a1e6ee0001782247-state-0",
          "external_id": "ecovacs:5c19a8f3a1e6ee0001782247:state:0",
          "category": "vacbot",
          "type": "state",
          "read_only": false,
          "keep_history": false,
          "has_feedback": true,
          "unit": null,
          "min": 0,
          "max": 1,
          "last_value": null,
          "last_value_string": null,
          "last_value_changed": null,
          "last_hourly_aggregate": "2023-05-23T19:00:00.000Z",
          "last_daily_aggregate": "2023-05-22T22:00:00.000Z",
          "last_monthly_aggregate": "2023-04-30T22:00:00.000Z",
          "created_at": "2023-05-22T16:30:01.546Z",
          "updated_at": "2023-05-23T19:00:03.700Z"
        },
        {
          "id": "f2295db1-d9ab-4bd8-9fab-482c3637c336",
          "device_id": "e91d470b-4293-4363-a7c3-721bedde2031",
          "name": "battery",
          "selector": "ecovacs-5c19a8f3a1e6ee0001782247-battery-0",
          "external_id": "ecovacs:5c19a8f3a1e6ee0001782247:battery:0",
          "category": "battery",
          "type": "integer",
          "read_only": true,
          "keep_history": true,
          "has_feedback": true,
          "unit": "percent",
          "min": 0,
          "max": 100,
          "last_value": 100,
          "last_value_string": null,
          "last_value_changed": "2023-05-24T17:00:38.811Z",
          "last_hourly_aggregate": "2023-05-23T19:00:00.000Z",
          "last_daily_aggregate": "2023-05-22T22:00:00.000Z",
          "last_monthly_aggregate": "2023-04-30T22:00:00.000Z",
          "created_at": "2023-05-22T16:30:01.546Z",
          "updated_at": "2023-05-23T19:50:08.106Z"
        }
      ],
      "params": [],
      "room": {
        "id": "af7dc442-6dca-4b2f-b25b-ec2c4787731b",
        "house_id": "f0a7c1c3-0d3d-4fc7-9711-458aa65532f1",
        "name": "salon",
        "selector": "salon",
        "created_at": "2022-12-31T19:31:32.876Z",
        "updated_at": "2022-12-31T19:31:32.876Z"
      },
      "service": {
        "id": "e3d01cdf-ae4c-4a09-9cbf-8cf9741ee23b",
        "pod_id": null,
        "name": "ecovacs",
        "selector": "ecovacs",
        "version": "0.1.0",
        "has_message_feature": false,
        "status": "RUNNING",
        "created_at": "2022-12-31T19:29:29.109Z",
        "updated_at": "2023-05-24T16:33:36.385Z"
      }
    }`;
    
    const device = JSON.parse(json);
    console.log(props.device);
    const deviceFeature = device.features[0];



    const error = boxStatus === RequestStatus.Error;
    
    return (
      <VacbotBox
        {...props}
        name={name}
        imageUrl={imageUrl}
        hasMappingCapabilities={hasMappingCapabilities}
        hasCustomAreaCleaningMode={hasCustomAreaCleaningMode}
        hasMoppingSystem={hasMoppingSystem}
        chargeStatus={chargeStatus}
        cleanReport={cleanReport}
        batteryLevel={batteryLevel}
        device={device}
        deviceFeature={deviceFeature}
        error={error}
      />
    );
  }
}

export default connect('session,DashboardBoxDataVacbot,DashboardBoxStatusVacbot', actions)(VacbotBoxComponent);

