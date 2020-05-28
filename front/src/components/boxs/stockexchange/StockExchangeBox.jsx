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
import DataList from './DataList';


const BOX_REFRESH_INTERVAL_MS = 30 * 60 * 1000;


const StockExchangeBox = ({ children, ...props }) => (
    <div >
      {props.boxStatus === RequestStatus.Error && (
      <div class="card">
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
      </div>
    )}
    {props.boxStatus === GetStockExchangeStatus.RequestToThirdPartyFailed && (
      <div class="card">
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
      </div>
    )}
    {props.datas && (
      <DataList {...props} datas={props.datas} />
    )}
   </div>
);


@connect('DashboardBoxDataStockExchange,DashboardBoxStatusStockExchange', actions)
class StockExchangeBoxComponent extends Component {
  componentDidMount() {
    this.props.getIndex(this.props.box, this.props.x, this.props.y);
    // refresh info every interval
    setInterval(() => this.props.getIndex(this.props.box, this.props.x, this.props.y), BOX_REFRESH_INTERVAL_MS);
  }

  render(props, {}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}StockExchange.${props.x}_${props.y}`);
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}StockExchange.${props.x}_${props.y}`);
    const datas = get(boxData, 'stockexchangedatas');
    console.log(datas);
    return (
      <StockExchangeBox {...props} datas={datas} />
    );
  }
}

export default StockExchangeBoxComponent;
