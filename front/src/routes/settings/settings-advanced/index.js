import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SettingsAdvancedPage from './SettingsAdvancedPage';
import actions from '../../../actions/device';

@connect(
  '',
  actions
)
class SettingsAdvanced extends Component {
  componentWillMount() {}

  render({}, {}) {
    return <SettingsAdvancedPage />;
  }
}

export default SettingsAdvanced;
