import { Component } from 'preact';
import { connect } from 'unistore/preact';
import IntegrationPage from './IntegrationPage';
import actions from '../../actions/integration';

@connect('', actions)
class Integration extends Component {
  componentWillMount() {
    this.props.getIntegrations(this.props.category);
  }

  render({ category }, {}) {
    return <IntegrationPage category={category} />;
  }
}

export default Integration;
