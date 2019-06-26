import { Component } from 'preact';
import { connect } from 'unistore/preact';
import IntegrationPage from './IntegrationPage';
import actions from '../../actions/integration';

@connect(
  '',
  actions
)
class Integration extends Component {
  componentWillMount() {
    this.props.getIntegrations();
  }

  componentDidUpdate() {
    this.props.getIntegrations();
  }

  render({}, {}) {
    return <IntegrationPage />;
  }
}

export default Integration;
