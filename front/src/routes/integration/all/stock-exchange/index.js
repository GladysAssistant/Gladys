import { Component } from 'preact';
import { connect } from 'unistore/preact';
import StockExchangePage from './StockExchange';
import { RequestStatus } from '../../../../utils/consts';
import actions from './actions';

@connect('user', actions)
class StockExchangeIntegration extends Component {
  componentWillMount() {
    this.props.getStockExchangeSetting();
  }

  render(props, {}) {
    const loading = props.stockexchangeSaveSettingsStatus === RequestStatus.Getting ||
    props.stockexchangeGetSettingsStatus === RequestStatus.Getting;
    return <StockExchangePage {...props} loading={loading} />;
  }
}

export default StockExchangeIntegration;
