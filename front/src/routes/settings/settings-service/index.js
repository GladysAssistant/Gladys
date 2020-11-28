import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ServicesPage from './ServicesPage';
import actions from '../../../actions/integration';

@connect('services,integrations', actions)
class SettingsServices extends Component {
  componentWillMount() {
    this.props.getServices();
  }

  render(props, {}) {
    return <ServicesPage {...props} />;
  }
}

export default SettingsServices;
