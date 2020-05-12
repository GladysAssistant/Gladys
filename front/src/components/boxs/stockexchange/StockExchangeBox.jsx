import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import actions from '../../../actions/dashboard/boxes/stockExchange';
import {
  RequestStatus,
  GetStockExchangeStatus,
  DASHBOARD_BOX_STATUS_KEY,
  DASHBOARD_BOX_DATA_KEY
} from '../../../utils/consts';
import get from 'get-value';

const padding = {
  paddingLeft: '40px',
  paddingRight: '40px',
  paddingTop: '10px',
  paddingBottom: '10px'
};

const BOX_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const StockExchangeBox2 = ({ children, ...props }) => (
  <div>
    <h4 class="card-header">
      <Text id="dashboard.boxTitle.stockexchange" />
    </h4>
    <div class="card-body">
      <p class="alert alert-danger">
        <i class="fe fe-bell" />
        <span class="pl-2">
          Here we go with stock exchange data
          {props.name}
          {props.index}
        </span>
      </p>
    </div>
  </div>
)

const StockExchangeBox = ({ children, ...props }) => (
  <div class="card">
    {props.boxStatus === GetStockExchangeStatus.ServiceNotConfigured && (
      <div>
        <h4 class="card-header">
          <Text id="dashboard.boxTitle.stockexchange" />
        </h4>
        <div class="card-body">
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.stockexchange.serviceNotConfigured" />
            </span>
          </p>
        </div>
      </div>
    )}
    {props.boxStatus === RequestStatus.Error && (
      <div>
        <h4 class="card-header">
          <Text id="dashboard.boxTitle.stockexchange" />
        </h4>
        <div class="card-body">
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.stockexchange.unknownError" />
            </span>
          </p>
        </div>
      </div>
    )}
    {props.boxStatus === RequestStatus.Getting && !props.quote && (
      <div>
        <div class="card-body">
          <div class="dimmer active">
            <div class="loader" />
            <div class="dimmer-content" style={padding} />
          </div>
        </div>
      </div>
    )}
    {props.boxStatus === GetStockExchangeStatus.RequestToThirdPartyFailed && (
      <div>
        <h4 class="card-header">
          <Text id="dashboard.boxTitle.stockexchange" />
        </h4>
        <div class="card-body">
          <p class="alert alert-danger">
            <i class="fe fe-bell" />
            <span class="pl-2">
              <Text id="dashboard.boxes.stockexchange.requestToThirdPartyFailed" />{' '}
              <Link href="/dashboard/integration/stockexchange/stockexchange">
                <Text id="dashboard.boxes.stockexchange.clickHere" />
              </Link>
            </span>
          </p>
        </div>
      </div>
    )}
    {props.index && props.name && (
      <div style={padding} class="card-block px-30 py-10">
        <div class="row">
          <div class="col-6">
            <div
              style={{
                fontSize: '14px',
                color: '#76838f'
              }}
            >
            {props.name} => {props.index}
            </div>
            <div
              style={{
                fontSize: '40px'
              }}
              class="font-size-40 blue-grey-700"
            >
              <span
                style={{
                  fontSize: '30px'
                }}
              >

              </span>
            </div>
          </div>
          <div
            class="col-6 text-right"
            style={{
              padding: '10px'
            }}
          >

          </div>
        </div>
      </div>
    )}
  </div>
);


@connect('DashboardBoxDataStockExchange,DashboardBoxStatusStockExchange', actions)
class StockExchangeBoxComponent extends Component {
  componentDidMount() {
    // get the stockexchange data
    this.props.getIndex(this.props.box, this.props.x, this.props.y);
    // refresh info every interval
    setInterval(() => this.props.getIndex(this.props.box, this.props.x, this.props.y), BOX_REFRESH_INTERVAL_MS);
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}StockExchange.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}StockExchange.${props.x}_${props.y}`);
    const name = get(boxData, 'name');
    const index = get(boxData, 'index');

    return (
      <StockExchangeBox {...props} index={index} name={name} />
    );
  }
}

export default StockExchangeBoxComponent;
