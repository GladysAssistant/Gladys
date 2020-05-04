import { Component } from 'preact';
import { connect } from 'unistore/preact';
import StockExchangePage from './StockExchange';
import { RequestStatus } from '../../../../utils/consts';
import actions from './actions';

@connect('user', actions)
class StockExchangeIntegration extends Component {

  render(props, {}) {
    const loading = null; // todo
    return <StockExchangePage {...props} loading={loading} />;
  }
}

export default StockExchangeIntegration;
