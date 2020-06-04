import { Component } from 'preact';
import { connect } from 'unistore/preact';
import StockExchangePage from './StockExchange';
import { RequestStatus } from '../../../../utils/consts';
import actions from './actions';

@connect('user,stockExchangeApiKey,stockExchangeTickers,stockexchangeGetSettingsStatus,stockexchangeSetSettingsStatus', actions)
class StockExchangeIntegration extends Component {
  componentWillMount() {
    this.props.getStockExchangeSetting();
  }

  render(props, {}) {
    const loading =
      props.stockexchangeSetSettingsStatus === RequestStatus.Getting ||
      props.stockexchangeGetSettingsStatus === RequestStatus.Getting;
    return <StockExchangePage {...props} loading={loading} />;
  }
}

export default StockExchangeIntegration;
