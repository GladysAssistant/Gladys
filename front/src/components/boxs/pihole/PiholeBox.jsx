import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, MarkupText } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/piHole';
import {
  RequestStatus,
  GetPiholeStatus,
  DASHBOARD_BOX_STATUS_KEY,
  DASHBOARD_BOX_DATA_KEY
} from '../../../utils/consts';
import get from 'get-value';
import DataList from './DataList';

const BOX_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const PiholeErrorBox = ({ children, ...props }) => (
  <div class="card">
    <div>
      <h4 class="card-header">
        <Text id="dashboard.boxTitle.pihole" />
      </h4>
      <div class="card-body">
        <p class="alert alert-danger">
          <i class="fe fe-bell" />
          <span class="pl-2">
            <MarkupText id="dashboard.boxes.pihole.unknownError" />
          </span>
        </p>
      </div>
    </div>
  </div>
);

const PiholeBox = ({ children, ...props }) => (
  <div>
    {props.boxStatus === RequestStatus.Error && <PiholeErrorBox {...props} />}
    {(props.boxStatus === GetPiholeStatus.ServiceNotConfigured ||
      props.boxStatus === GetPiholeStatus.RequestToThirdPartyFailed) && (
      <div class="card">
        <div>
          <h4 class="card-header">
            <Text id="dashboard.boxTitle.pihole" />
          </h4>
          <div class="card-body">
            <p class="alert alert-danger">
              <i class="fe fe-bell" />
              <span class="pl-2">
                <Text id="dashboard.boxes.pihole.requestToThirdPartyFailed" />{' '}
              </span>
              {props.error}
            </p>
          </div>
        </div>
      </div>
    )}
    {props.datas && <DataList {...props} datas={props.datas} />}
  </div>
);

@connect('DashboardBoxDataPihole,DashboardBoxStatusPihole', actions)
class PiholeBoxComponent extends Component {
  componentDidMount() {
    this.props.getPiholeSummary(this.props.box, this.props.x, this.props.y);
    // refresh info every interval
    setInterval(() => this.props.getPiholeSummary(this.props.box, this.props.x, this.props.y), BOX_REFRESH_INTERVAL_MS);
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}pihole.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}pihole.${props.x}_${props.y}`);
    const datas = get(boxData, 'piholedatas');
    const error = get(boxData, 'error');
    return <PiholeBox {...props} datas={datas} boxStatus={boxStatus} error={error} />;
  }
}

export default PiholeBoxComponent;
