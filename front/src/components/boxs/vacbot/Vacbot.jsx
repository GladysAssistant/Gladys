import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/vacbot';
import { DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY, RequestStatus } from '../../../utils/consts';
// import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import get from 'get-value';

const BOX_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

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
    <div> 
    {props.chargestatus}
    {props.cleanstatus}
    {props.connectionFailed}
    </div>
    <div>
      <img src={props.imageUrl} />
      {props.hasMappingCapabilities}
      {props.hasCustomAreaCleaningMode}
      {props.hasMoppingSystem}
    </div>
  </div>
);

class VacbotBoxComponent extends Component {
  refreshData = () => {
    this.props.getVacbot(this.props.box, this.props.x, this.props.y);
  };
  updateDeviceStateWebsocket = payload =>
    this.props.deviceFeatureWebsocketEvent(this.props.box, this.props.x, this.props.y, payload);

  componentDidMount() {
    this.refreshData();
    // refresh vacbot every interval
    this.interval = setInterval(() => this.refreshData, BOX_REFRESH_INTERVAL_MS);
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
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Vacbot.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Vacbot.${props.x}_${props.y}`);
    const name = get(boxData, 'vacbot.name');
    const imageUrl = get(boxData, 'vacbot.imageUrl');
    const hasMappingCapabilities = get(boxData, 'vacbot.hasMappingCapabilities');
    const hasCustomAreaCleaningMode = get(boxData, 'vacbot.hasCustomAreaCleaningMode');
    const hasMoppingSystem = get(boxData, 'vacbot.hasMoppingSystem');

    console.log(`get in boxdata : ${JSON.stringify(boxData)}`);
    console.log(`${boxStatus}`);
    const error = boxStatus === RequestStatus.Error;
    return (
      <VacbotBox
        {...props}
        name={name}
        imageUrl={imageUrl}
        hasMappingCapabilities={hasMappingCapabilities}
        hasCustomAreaCleaningMode={hasCustomAreaCleaningMode}
        hasMoppingSystem={hasMoppingSystem}
        boxStatus={boxStatus}
        error={error}
      />
    );
  }
}

export default connect('DashboardBoxDataVacbot,DashboardBoxStatusVacbot', actions)(VacbotBoxComponent);
