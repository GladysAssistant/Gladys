import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ServicesPage from './ServicesPage';
import actions from '../../../actions/integration';

class SettingsServices extends Component {
  componentWillMount() {
    this.props.getServices();
  }

  render(props, {}) {
    return <ServicesPage {...props} />;
  }
}

export default connect('services,integrations', actions)(SettingsServices);
