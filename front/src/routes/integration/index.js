import { Component } from 'preact';
import { connect } from 'unistore/preact';
import IntegrationPage from './IntegrationPage';
import actions from '../../actions/integration';

@connect('user', actions)
class Integration extends Component {
  componentDidMount() {
    this.props.getIntegrations(this.props.category);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.user !== this.props.user) {
      this.props.getIntegrations(this.props.category);
    }
  }

  render({ category }, {}) {
    return <IntegrationPage category={category} />;
  }
}

export default Integration;
