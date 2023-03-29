import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/vacbot';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY, RequestStatus } from '../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import get from 'get-value';

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
    <div class="card-body d-flex flex-column">
      <h4>{props.name}</h4>
    </div>
    <div class="row" style={{fontSize: '1.5em'}}>
          <div class="col-9" >
          {props.cleanReport == 'idle' && <i class={`fe fe-disc`} />}
          {props.chargeStatus == 'returning' && <i class={`list-separated-item fe fe-dowload`} />}
          {props.cleanReport == 'auto' && <i class={`list-separated-item fe fe-play-circle`} />}
          {props.cleanReport}
          </div>
          <div class="col-3">
            {props.chargeStatus == 'charging' && <i class={`fe fe-battery-charging`} style={{fontSize: '20px'}} >{props.batteryLevel}% </i>}
            {props.chargeStatus != 'charging' && <i class={`fe fe-battery`} style={{fontSize: '20px'}}>{props.batteryLevel}%</i> }
          </div>
    </div>
    <div class="row">
      <div class="card-body d-flex col-9">
        <img src={props.imageUrl} style="width: 80%;" />
      </div>
      <div class="col-3" style={{fontSize: '20px'}}>
        <ul class="list-unstyled mb-0" style={{marginTop: '50px'}}>
          {props.hasMappingCapabilities && <li class={`fe fe-map`} />}
          {props.hasCustomAreaCleaningMode && <li class={`fe fe-codepen`} />}
      </ul> 

      </div>
    </div>
    
    <div class="mt-3">
        hasMoppingSystem : {props.hasMoppingSystem}, chargeStatus : {props.chargeStatus},  cleanReport : {props.cleanReport}
    </div>
  </div>
);

class VacbotBoxComponent extends Component {
  refreshData = () => {
    this.props.getVacbot(this.props.box, this.props.x, this.props.y);
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
        error={error}
      />
    );
  }
}

export default connect('session,DashboardBoxDataVacbot,DashboardBoxStatusVacbot', actions)(VacbotBoxComponent);
