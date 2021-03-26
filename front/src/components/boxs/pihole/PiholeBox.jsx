import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/pihole';
import { RequestStatus, DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import get from 'get-value';

const BOX_REFRESH_INTERVAL_MS = 60 * 1000;

const padding = {
  paddingLeft: '40px',
  paddingRight: '40px',
  paddingTop: '10px',
  paddingBottom: '10px'
};

const PiholeBox = ({ children, ...props }) => (
  <div class="card">
    <div>
        <h4 class="card-header">
          <Text id="dashboard.boxTitle.pihole" />
        </h4>
        </div>
    <div class="d-flex align-items-center">
      {props.boxStatus === RequestStatus.Getting && !props.piholeObject && (
        <div>
          <div class="card-body">
            <div class="dimmer active">
              <div class="loader" />
              <div class="dimmer-content" style={padding} />
            </div>
          </div>
        </div>
      )}
      <div>
        {props.domainsBlocked && (
          <h4 class="m-0">
            <Text fields={{ value: props.domainsBlocked }} />
          </h4>
        )}
      </div>
    </div>
  </div>
);

@connect('DashboardBoxDataPihole,DashboardBoxStatusPihole', actions)
class PiholeBoxComponent extends Component {
  componentDidMount() {
    this.props.getPiholeSummary(this.props.box, this.props.x, this.props.y);
    // refresh stats every interval
    setInterval(() => this.props.getPiholeSummary(this.props.box, this.props.x, this.props.y), BOX_REFRESH_INTERVAL_MS);
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}Pihole.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}Pihole.${props.x}_${props.y}`);
    const piholeObject = get(boxData, 'piholestats');
    const domainsBlocked = get(piholeObject, 'domains_being_blocked');
    console.log('I was triggered during render');
    console.log(`boxData: ${JSON.stringify(boxData, null, 2)}`);
    return <PiholeBox {...props} domainsBlocked={domainsBlocked} boxStatus={boxStatus} />;
  }
}

export default PiholeBoxComponent;
