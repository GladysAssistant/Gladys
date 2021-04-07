import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/boxes/pihole';
import { RequestStatus, DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import get from 'get-value';

const BOX_REFRESH_INTERVAL_MS = 120000;

const cardStyle = {
  maxHeight: '28rem'
};

const padding = {
  paddingLeft: '40px',
  paddingRight: '40px',
  paddingTop: '5px',
  paddingBottom: '5px'
};

const logoStyle = {
  paddingRight: '20px'
};

const PiholeBox = ({ children, ...props }) => (
  <div class="card">
    <div>
      <h4 class="card-header">
        <div style={logoStyle} >
      {props.status === 'enabled' && (
        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <path
            fill="green"
            d="M5.62,2C9.5,2 11.57,4.29 11.77,7.93C12.5,3.57 15.93,4.08 15.93,4.08C16.1,6.55 14.07,8.05 11.77,8.17C11.12,6.81 7.25,3.47 7.25,3.47C7.23,3.5 10.97,6.74 10.83,8.15C8.33,7.88 5.82,6 5.62,2M6.06,13.11L9.92,9.25C11.09,8.08 13,8.08 14.16,9.25L18,13.11C19.19,14.28 19.19,16.18 18,17.35L14.16,21.21C13,22.38 11.09,22.38 9.92,21.21L6.06,17.35C4.89,16.18 4.89,14.28 6.06,13.11M9.39,19.59C9.39,18.36 10.15,16.85 12.09,16.85C13.4,16.85 14.87,18.1 16.31,17.96C14.87,17.92 13.59,16.85 13.59,15.19C13.59,13.86 14.69,12.9 14.69,11.34C14.63,12.33 13.82,13.77 12,13.77C10.59,13.77 9.55,12.63 7.87,12.63C8.58,12.67 10.5,13.3 10.5,15.35C10.5,17 9.39,17.5 9.39,19.59Z"
          />
        </svg>
        )}
        {props.status === 'disabled' && (
        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <path
            fill="red"
            d="M5.62,2C9.5,2 11.57,4.29 11.77,7.93C12.5,3.57 15.93,4.08 15.93,4.08C16.1,6.55 14.07,8.05 11.77,8.17C11.12,6.81 7.25,3.47 7.25,3.47C7.23,3.5 10.97,6.74 10.83,8.15C8.33,7.88 5.82,6 5.62,2M6.06,13.11L9.92,9.25C11.09,8.08 13,8.08 14.16,9.25L18,13.11C19.19,14.28 19.19,16.18 18,17.35L14.16,21.21C13,22.38 11.09,22.38 9.92,21.21L6.06,17.35C4.89,16.18 4.89,14.28 6.06,13.11M9.39,19.59C9.39,18.36 10.15,16.85 12.09,16.85C13.4,16.85 14.87,18.1 16.31,17.96C14.87,17.92 13.59,16.85 13.59,15.19C13.59,13.86 14.69,12.9 14.69,11.34C14.63,12.33 13.82,13.77 12,13.77C10.59,13.77 9.55,12.63 7.87,12.63C8.58,12.67 10.5,13.3 10.5,15.35C10.5,17 9.39,17.5 9.39,19.59Z"
          />
        </svg>
        )}
        </div>
        <Text id="dashboard.boxTitle.pihole" />
      </h4>
    </div>
    <div class="d-flex align-items-center">
      {props.boxStatus === RequestStatus.Getting && !props.domainsBlocked && (
        <div>
          <div class="card-body">
            <div class="dimmer active">
              <div class="loader" />
              <div class="dimmer-content" style={padding} />
            </div>
          </div>
        </div>
      )}
      <div class="table-responsive" style={cardStyle}>
        <table class="table card-table table-vcenter">
          <thead>
            <tr>
              <th colspan="3">
                <Text id="dashboard.boxes.pihole.headerToday" />
              </th>
            </tr>
          </thead>
          <tbody>
            {props.adsBlockedToday && (
              <tr>
                <td>
                  <i class="mr-2 fe fe-shield-off" />
                </td>
                <td>
                  <Text id="dashboard.boxes.pihole.adsBlocked" />
                </td>
                <td class="text-right">
                  {props.adsBlockedToday}{' '}
                  <Text
                    id="dashboard.boxes.pihole.adsBlockedPercentValue"
                    fields={{ value: Math.round(props.percentAdsBlockedToday) }}
                  />
                </td>
              </tr>
            )}
            {props.dnsQueryToday && (
              <tr>
                <td>
                  <i class="mr-2 fe fe-server" />
                </td>
                <td>
                  <Text id="dashboard.boxes.pihole.dnsQuery" />
                </td>
                <td class="text-right">{props.dnsQueryToday}</td>
              </tr>
            )}
          </tbody>
        </table>
        <table class="table card-table table-vcenter">
          <thead>
            <tr>
              <th colspan="3">
                <Text id="dashboard.boxes.pihole.headerGravitySettings" />
              </th>
            </tr>
          </thead>
          <tbody>
            {props.domainsBlocked && (
              <tr>
                <td>
                  <i class="mr-2 fe fe-globe" />
                </td>
                <td>
                  <Text id="dashboard.boxes.pihole.domainsBlocked" />
                </td>
                <td class="text-right">{props.domainsBlocked}</td>
              </tr>
            )}
            {props.gravityRelativeDate && (
              <tr>
                <td>
                  <i class="mr-2 fe fe-calendar" />
                </td>
                <td>
                  <Text id="dashboard.boxes.pihole.gravityLastUpdate" />
                </td>
                <td class="text-right">{props.gravityRelativeDate}</td>
              </tr>
            )}
          </tbody>
        </table>
        <table class="table card-table table-vcenter">
          <thead>
            <tr>
              <th colspan="3">
                <Text id="dashboard.boxes.pihole.headerStatus" />
              </th>
            </tr>
          </thead>
          <tbody>
            {props.domainsBlocked && (
              <tr>
                <td>
                  <i class="mr-2 fe fe-power" />
                </td>
                <td>
                  <Text id="dashboard.boxes.pihole.piholeStatus" />
                </td>
                <td class="text-right">{props.status}</td>
              </tr>
            )}
            {props.gravityRelativeDate && (
              <tr>
                <td>
                  <i class="mr-2 fe fe-monitor" />
                </td>
                <td>
                  <Text id="dashboard.boxes.pihole.clients" />
                </td>
                <td class="text-right">{props.uniqueClient}/{props.totalClient}</td>
              </tr>
            )}
            {props.queriesCached && (
              <tr>
                <td>
                  <i class="mr-2 fe fe-save" />
                </td>
                <td>
                  <Text id="dashboard.boxes.pihole.queriesCached" />
                </td>
                <td class="text-right">{props.queriesCached}</td>
              </tr>
            )}
          </tbody>
        </table>
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
    const adsBlockedToday = get(piholeObject, 'ads_blocked_today');
    const percentAdsBlockedToday = get(piholeObject, 'ads_percentage_today');
    const dnsQueryToday = get(piholeObject, 'dns_queries_today');
    const uniqueClient = get(piholeObject, 'unique_clients');
    const totalClient = get(piholeObject, 'clients_ever_seen');
    const gravityRelativeDate = get(piholeObject, 'gravity_updated_relative_to_now');
    const status = get(piholeObject, 'status');
    const queriesCached = get(piholeObject, 'queries_cached');

    return (
      <PiholeBox
        {...props}
        gravityRelativeDate={gravityRelativeDate}
        dnsQueryToday={dnsQueryToday}
        percentAdsBlockedToday={percentAdsBlockedToday}
        adsBlockedToday={adsBlockedToday}
        domainsBlocked={domainsBlocked}
        boxStatus={boxStatus}
        status={status}
        uniqueClient={uniqueClient}
        totalClient={totalClient}
        queriesCached={queriesCached}
      />
    );
  }
}

export default PiholeBoxComponent;
