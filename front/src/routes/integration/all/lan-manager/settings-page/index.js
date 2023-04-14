import { Component } from 'preact';
import { connect } from 'unistore/preact';

import LANManagerPage from '../LANManagerPage';
import LANManagerSettingsTab from './LANManagerSettingsTab';

@connect('user,httpClient')
class LANManagerSettingsPage extends Component {
  render(props) {
    return (
      <LANManagerPage>
        <LANManagerSettingsTab {...props} />
      </LANManagerPage>
    );
  }
}

export default LANManagerSettingsPage;
